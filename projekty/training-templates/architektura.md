# Technický návrh: Training Templates (databáze tréninků)
**Od:** Softwarový architekt
**Pro:** Backend vývojář, Frontend vývojář, QA
**Datum:** 2026-04-17
**Projekt:** training-templates

## Přehled

Zavádíme entitu `TrainingTemplate` reprezentující opakující se plán tréninku (tým × dny v týdnu × čas × místo × trenér × platnost od/do). Při uložení/editaci šablony se **materializují konkrétní `Event` záznamy** typu `PRACTICE` až do `validUntil` (varianta A — bez cronu). Každý Event má volitelný FK `templateId` na šablonu plus flag `detached`, který odlišuje manuálně přesunuté/upravené instance, aby je regenerace nepřepsala.

### Klíčová rozhodnutí (potvrzená uživatelem)
1. **Generace naráz do `validUntil`** — žádný scheduler. Při `CREATE`/`PATCH` šablony služba spočítá všechny termíny a vloží Event řádky v jedné transakci (batch `createMany`).
2. **DELETE šablony** — smaže všechny **budoucí** eventy (startsAt > now). Minulé eventy ponechá odpojené — nastaví `templateId = null` a `detached = true`. Zajišťuje historickou auditní stopu docházky.
3. **Výjimky** — MVP řeší uživatel manuálním smazáním konkrétního Eventu (`DELETE /events/:id`). Detach logikou je to zahrnuto zdarma (když editor šablonu později přegeneruje, smazané Event se neobnoví díky idempotent klíči `templateId + startsAt`).
4. **Paralelní šablony na tým** — povoleno (UMT + posilovna). Unikátní je pár `(templateId, startsAt)` na Event, ne `(teamId, startsAt)` — dva různé tréninky na stejný den v různém čase jsou OK.

## Datový model

### Nový model: `TrainingTemplate`

```prisma
model TrainingTemplate {
  id          String   @id @default(cuid())
  clubId      String
  teamId      String                 // šablona je vždy týmová (MVP)
  name        String                 // "UMT pondělí 17:00", zobrazuje se v UI
  eventType   EventType @default(PRACTICE)  // flexibilita — běžně PRACTICE
  daysOfWeek  Int[]                  // 0=neděle ... 6=sobota (align s JS Date.getDay())
  startTime   String                 // "17:00" — local time dle Club.timezone
  endTime     String                 // "18:30"
  location    String?
  locationUrl String?
  description String?
  validFrom   DateTime               // datum prvního možného tréninku (lokální půlnoc)
  validUntil  DateTime               // datum posledního možného tréninku (lokální 23:59)
  active      Boolean  @default(true) // soft-disable bez smazání
  createdById String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  club      Club    @relation(fields: [clubId], references: [id], onDelete: Cascade)
  team      Team    @relation(fields: [teamId], references: [id], onDelete: Cascade)
  createdBy Member  @relation("TemplateCreator", fields: [createdById], references: [id])
  events    Event[] @relation("TemplateEvents")

  @@index([clubId])
  @@index([teamId, active])
}
```

**Pozn. k polím:**
- `daysOfWeek` — pole intů 0–6 (neděle=0 kvůli JS `Date.getDay()`). Pro multi-select UI stačí pole, bitmask by byl předčasná optimalizace.
- `startTime` / `endTime` — string `HH:mm` lokálně v zóně klubu. Převod na UTC se děje při generaci (viz níže). Žádné `Time` Postgres typy — drží to jednoduché a timezone-safe.
- `validFrom` / `validUntil` — DATE-semantika uložená jako DateTime; end je inclusive (tréninky se generují **do včetně** toho dne).

### Úprava modelu `Event`

```prisma
model Event {
  // ... existující pole beze změny
  templateId String?
  detached   Boolean @default(false)

  template TrainingTemplate? @relation("TemplateEvents", fields: [templateId], references: [id], onDelete: SetNull)

  @@unique([templateId, startsAt], name: "template_instance_unique")
  @@index([templateId])   // doplnit k existujícím indexům
  // existující indexy zůstávají
}
```

- `templateId` — nullable FK. `onDelete: SetNull` — při mazání šablony se historický Event automaticky osiří (flag `detached` nastaví explicitně DELETE handler, viz níže).
- `detached = true` — Event je „manuálně upraven" (přesunut na jiný den, editován titulek, cokoli). Regenerátor ho **nikdy** nepřepíše ani nesmaže.
- `@@unique([templateId, startsAt])` — idempotentní klíč. Zajišťuje, že pokud algoritmus proběhne dvakrát, druhé volání nevloží duplicity. **Kritické** pro bezpečnost regenerace.

### Dny v týdnu — volba reprezentace

| Varianta | + | − | Verdikt |
|----------|---|---|---------|
| `Int[]` (pole 0–6) | Prostá, čitelná v SQL, jednoduchý JS mapping | Validace v aplikační vrstvě | **Vybráno** |
| Bitmask `Int` (0–127) | Kompaktní | Nečitelné v DB, nutný helper | Over-engineering pro 7 hodnot |
| `Weekday[]` enum | Semantický | Prisma enum pole vyžaduje custom parsing při filtru | Malý benefit |

Zod validace: `z.array(z.number().int().min(0).max(6)).min(1).max(7)` + dedup check. Normalizace (sort ASC) při uložení.

### Timezone strategie

- `Club.timezone` (IANA, např. `Europe/Prague`) je zdroj pravdy.
- `startTime` / `endTime` jsou **lokální čas**. Generátor převede `(date, localTime, clubTimezone) → UTC DateTime` pomocí `date-fns-tz` (`zonedTimeToUtc`). Doporučený dep — Nest už má `date-fns` tranzitivně, `date-fns-tz` přidá ~10 kB.
- Automaticky to řeší přechod letní/zimní čas: 27. 10. se trénink stále koná v 17:00 lokálně, i když kalendářově posun hodinu.

## Generátor eventů

### Umístění
- `TrainingTemplatesService.generateEvents(templateId, scope, tx)` — interní metoda, volá se z `createTemplate()` a `updateTemplate()`.
- Fyzicky: `/apps/api/src/training-templates/training-templates.service.ts`. Module: `training-templates.module.ts` s providerem, controllerem a závislostí na `PrismaModule`, `AuthModule` (RBAC).

### Algoritmus (pseudokód)

```
vstup: template { teamId, clubId, daysOfWeek, startTime, endTime, validFrom, validUntil, eventType, location, locationUrl, description, createdById },
       clubTimezone,
       scope: "all" | "future"   // "future" = jen od now() dál

1. spočítej hranice:
   rangeFrom = scope === "future" ? max(now(), template.validFrom) : template.validFrom
   rangeTo   = template.validUntil

2. iteruj den po dni (date-fns `eachDayOfInterval`):
   pro každý date v [rangeFrom, rangeTo]:
     if (daysOfWeek.includes(date.getDay())):
        startsAt = zonedTimeToUtc(`${yyyy-MM-dd} ${startTime}`, clubTimezone)
        endsAt   = zonedTimeToUtc(`${yyyy-MM-dd} ${endTime}`,   clubTimezone)
        candidates.push({ clubId, teamId, templateId, type: eventType,
                          title: template.name, startsAt, endsAt,
                          location, locationUrl, description,
                          createdById, detached: false })

3. batch insert:
   prisma.event.createMany({
     data: candidates,
     skipDuplicates: true     // opírá se o @@unique([templateId, startsAt])
   })
```

### Kdy se volá

| Situace | Scope | Poznámka |
|---------|-------|----------|
| `POST /training-templates` | `all` | Generuje celé rozmezí `[validFrom, validUntil]`. |
| `PATCH /training-templates/:id` (změna časové mřížky, místa, dnů) | `future` | Krok 1: smaž budoucí non-detached eventy (`startsAt > now AND detached = false AND templateId = this.id`). Krok 2: vygeneruj znovu od `now` do `validUntil`. Detached eventy v minulosti i budoucnosti zůstávají. |
| `PATCH /training-templates/:id` (změna jen `name` nebo `active`) | — | Nemazat, neregenerovat. Only metadata update. Pokud uživatel edituje i title šablony, nechávají se staré tituly na už vygenerovaných Eventech (alternativa: copy na budoucí non-detached — vyřešit v UI copy). |
| `DELETE /training-templates/:id` | — | Smaž budoucí (`startsAt > now`) eventy s `templateId = this`. Minulým nastav `templateId = null, detached = true` v bulk update. Nakonec smaž template. |
| `POST /events/:id/detach-from-template` | — | Pouze flipne `detached = true`. Událost zůstává, příští regenerace ji nechá být. Implicitně se spouští při `PATCH /events/:id` pokud se změní `startsAt` nebo `endsAt`. |

### Co když admin posune validUntil dál
- `PATCH` s novým `validUntil` (delší rozsah) → regenerace scope `future` doplní nové termíny. `skipDuplicates` zajistí, že existující budoucí non-detached se nezmění (vlastně budou jen znovu vloženi kandidáti, stávající se přeskočí).
- Pokud se změní `startTime`/`endTime`: krok 1 (delete future non-detached) zajistí, že staré časy zmizí, a nové se vloží.

### Detached eventy v minulosti (edge case)
Úložení historického data je bezpečné: regenerátor nikdy nemaže minulost. Kdyby admin změnil `startTime` a zpět, staré non-detached budoucí se přepíšou, ale minulé (i non-detached) zůstanou beze změny — protože filtr je `startsAt > now`.

### Duplicita — jak ji zabránit
- DB unikát `@@unique([templateId, startsAt])` + `skipDuplicates: true` v `createMany`. Znamená: spuštění generátoru je **idempotentní**. I kdyby admin omylem klikl „regenerovat" 5×, výsledek je stejný.
- Detached Event (stejný `templateId`) bude mít jiný `startsAt` (uživatel ho přesunul) — collision se nestane. Kdyby se náhodou vrátil zpět na původní čas, unique zabrání duplicitě.
- Paralelní šablony na stejný tým (UMT + posilovna): `(templateA_id, 2026-04-20T17:00Z)` a `(templateB_id, 2026-04-20T18:00Z)` jsou rozdílné klíče → OK.

### Performance
- Pro 1 rok × 3 dny/týden ≈ 150 Event řádků. Jeden `createMany` insert < 50 ms. Žádný stream/chunk není potřeba.
- Absolutní strop: 7 dnů × 52 týdnů × 5 let = 1820 řádků. Stále jeden insert OK (PG limit ~65k params).

## API kontrakt

Base path: `/api/v1/training-templates` (konzistentní s existujícím `/api/v1/events`).

| Metoda | Endpoint | Popis | Zod input | Response | RBAC |
|--------|----------|-------|-----------|----------|------|
| GET | `/training-templates` | Seznam šablon klubu (filtr `teamId`, `active`) | query: `teamId?`, `active?` | `TrainingTemplateListItem[]` | Autentizovaný member klubu |
| GET | `/training-templates/:id` | Detail šablony + stats (#vygenerovaných, #detached) | — | `TrainingTemplateDetail` | Autentizovaný member klubu |
| POST | `/training-templates` | Vytvoří šablonu **a** vygeneruje eventy | `CreateTrainingTemplateInput` | `{ id, generatedEventsCount }` | `ADMIN`, `OWNER`, `HEAD_COACH` (+ `TEAM_MANAGER` daného týmu) |
| PATCH | `/training-templates/:id` | Update; regeneruje budoucí eventy dle pravidel | `UpdateTrainingTemplateInput` | `{ id, regeneratedEventsCount, detachedPreservedCount }` | `ADMIN`, `OWNER`, `HEAD_COACH` |
| DELETE | `/training-templates/:id` | Smaže šablonu + budoucí eventy; minulé odpojí jako detached | — | `{ deletedEventsCount, detachedLegacyCount }` | `ADMIN`, `OWNER`, `HEAD_COACH` |
| POST | `/training-templates/:id/regenerate` | Manuální trigger regenerace (bez změny šablony) — admin debug | — | `{ regeneratedEventsCount }` | `ADMIN`, `OWNER` |
| POST | `/events/:eventId/detach` | Odpojí Event od šablony (flip `detached=true`, `templateId` zůstává pro audit) | — | `{ ok: true }` | `ADMIN`, `OWNER`, `HEAD_COACH` |

**Poznámky k RBAC:**
- Stávající `@Roles(...)` dekorátor stačí. `rbacService.canActOnBehalfOf()` nepotřebuju — šablony se netvoří „na chování" nikoho.
- Validace vlastnictví týmu (že HEAD_COACH je z `TeamMembership` daného týmu) v service vrstvě — analogicky k existujícím event operacím.
- `TEAM_MANAGER` může editovat **jen šablony svého týmu** — doplňující check v service vrstvě.
- **Endpoint `POST /events/:eventId/detach`** přidávám do existujícího `EventsController`, protože logicky patří k eventu. **Doporučuji také implicitní detach**: při `PATCH /events/:id` pokud přijde změna `startsAt` nebo `endsAt`, service automaticky nastaví `detached=true`. Jednodušší UX, méně endpointů. Explicit `POST /detach` jako fallback.

### List response — `TrainingTemplateListItem`
```ts
{
  id: string;
  name: string;
  teamId: string;
  teamName: string;
  daysOfWeek: number[];         // [1, 3, 5]
  startTime: string;            // "17:00"
  endTime: string;
  location: string | null;
  validFrom: string;            // ISO date
  validUntil: string;
  active: boolean;
  generatedEventsCount: number; // total events z této template
  upcomingEventsCount: number;  // startsAt > now
}
```

### Detail response — `TrainingTemplateDetail`
Obsahuje vše z list + `description`, `locationUrl`, `createdBy`, `createdAt`, `updatedAt`, a `stats: { totalEvents, detachedEvents, pastEvents, upcomingEvents }`.

## Zod kontrakty

Přidat do `/packages/contracts/src/index.ts`:

```ts
// ---------- Training Templates ----------
export const DayOfWeek = z.number().int().min(0).max(6);
// 0 = Sunday, ..., 6 = Saturday (aligned with JS Date.getDay())

const timeString = z.string().regex(
  /^([01]\d|2[0-3]):[0-5]\d$/,
  'Must be HH:mm (24h)'
);

export const CreateTrainingTemplateInput = z.object({
  teamId: z.string().cuid(),
  name: z.string().min(1).max(120),
  eventType: EventType.default('PRACTICE'),
  daysOfWeek: z.array(DayOfWeek).min(1).max(7),
  startTime: timeString,
  endTime: timeString,
  location: z.string().max(300).optional(),
  locationUrl: z.string().url().optional(),
  description: z.string().max(2000).optional(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  active: z.boolean().default(true),
}).refine(
  (d) => d.startTime < d.endTime,
  { message: 'startTime must be before endTime', path: ['endTime'] }
).refine(
  (d) => new Date(d.validFrom) <= new Date(d.validUntil),
  { message: 'validFrom must be on or before validUntil', path: ['validUntil'] }
).refine(
  (d) => new Set(d.daysOfWeek).size === d.daysOfWeek.length,
  { message: 'daysOfWeek must not contain duplicates', path: ['daysOfWeek'] }
);
export type CreateTrainingTemplateInput = z.infer<typeof CreateTrainingTemplateInput>;

// Partial pro PATCH — re-validace cross-field jen pokud obě pole přítomna
export const UpdateTrainingTemplateInput = CreateTrainingTemplateInput
  .innerType()     // odstraní .refine wrapper
  .partial()
  .refine(
    (d) => !d.startTime || !d.endTime || d.startTime < d.endTime,
    { message: 'startTime must be before endTime', path: ['endTime'] }
  )
  .refine(
    (d) => !d.validFrom || !d.validUntil || new Date(d.validFrom) <= new Date(d.validUntil),
    { message: 'validFrom must be on or before validUntil', path: ['validUntil'] }
  );
export type UpdateTrainingTemplateInput = z.infer<typeof UpdateTrainingTemplateInput>;

export const TrainingTemplateListItem = z.object({
  id: z.string().cuid(),
  name: z.string(),
  teamId: z.string().cuid(),
  teamName: z.string(),
  daysOfWeek: z.array(DayOfWeek),
  startTime: z.string(),
  endTime: z.string(),
  location: z.string().nullable(),
  validFrom: z.string().datetime(),
  validUntil: z.string().datetime(),
  active: z.boolean(),
  generatedEventsCount: z.number().int(),
  upcomingEventsCount: z.number().int(),
});
export type TrainingTemplateListItem = z.infer<typeof TrainingTemplateListItem>;
```

### Validační pravidla shrnutí
1. `startTime < endTime` (porovnání `HH:mm` stringu funguje lexikograficky).
2. `validFrom <= validUntil`.
3. `daysOfWeek` — neprázdné, max 7, bez duplicit, rozsah 0–6.
4. `teamId` — existuje a patří stejnému klubu jako autentizovaný uživatel (service-layer check).
5. `name` — 1–120 znaků.

## Migrační plán

### DB schema change
1. Přidat `TrainingTemplate` model + pole `Event.templateId` + `Event.detached` + `@@unique([templateId, startsAt])` do `packages/db/prisma/schema.prisma`.
2. Přidat nová relation pole:
   - `Club.trainingTemplates TrainingTemplate[]`
   - `Team.trainingTemplates TrainingTemplate[]`
   - `Member.createdTrainingTemplates TrainingTemplate[] @relation("TemplateCreator")`
3. Přidat `@@index([templateId])` do `Event`.
4. Spustit `pnpm prisma db push` (dev/MVP, bez migrate history — projekt tak funguje dnes).
5. `pnpm prisma generate` — regenerace klienta.

### Seed dat
Rozšířit `packages/db/prisma/seed.ts`:
- Pro tým „U15 Braník" vytvořit šablonu **"UMT pondělí + středa"**: daysOfWeek=[1,3], 17:00–18:30, validFrom=dnes, validUntil=+3 měsíce, location="UMT Braník".
- Pro stejný tým vytvořit paralelní šablonu **"Posilovna pátek"**: daysOfWeek=[5], 18:00–19:00, validFrom=dnes, validUntil=+3 měsíce, location="Posilovna Kavčí hory".
- Seed zavolá `TrainingTemplatesService.generateEvents()` pro oba → vygeneruje se ~40 Eventů (ukázka paralelních šablon + reálná data v kalendáři).

### Backward compatibility
- Pole `Event.templateId` je nullable → všechny existující Eventy zůstanou funkční s `templateId = null`, `detached = false`.
- Existující endpointy `/events/*` se nemění. Ve výstupu může frontend přidat indikátor „opakovaná" když `templateId != null && !detached`.

## Bezpečnost
- Validace přes Zod před vstupem do service.
- `prisma.withClub(clubId, ...)` wrapper (existující pattern) zajistí RLS scope — šablonu z cizího klubu nelze číst ani editovat.
- RBAC check přes stávající `@Roles()` guardy + team-ownership check v service.
- Generátor nespouští externí I/O, všechna data z template rowu — nízké riziko SSRF/inj.

## Škálovatelnost
- Největší zátěž: DELETE šablony s dlouhou historií (tisíce eventů) → `updateMany` (detach past) + `deleteMany` (future) v jedné transakci. Index na `Event(templateId)` to podporuje.
- Seznam šablon: `findMany` s `_count` na relaci `events` — O(n) v počtu šablon, žádný join bomb.

## Open questions (low-priority, mimo MVP)
- **Svátky** — budoucí feature. Navrhovaný approach: model `ClubHoliday { clubId, date, name }`, generátor vynechává datum pokud je v holidays. Mimo MVP.
- **Timezone kolem DST** — `date-fns-tz` to řeší, ale doporučuji QA test: generovat šablonu přes 27. 10. (DST fallback) a 29. 3. (DST spring forward) a ověřit, že `startsAt`/`endsAt` v UTC reflektuje lokální 17:00.
- **Mobilní notifikace** — když se smaže/posune event, existující `NotificationType.EVENT_CANCELLED` / `EVENT_UPDATED` se dají znovupoužít. Mimo scope tohoto dokumentu.
- **Masová editace série** — „změnit titulek všem budoucím" — samostatný endpoint později. Teď řešeno přes PATCH template + regenerate.

## Další kroky pro backend vývojáře
1. Přidat schema change + `pnpm prisma db push` + `pnpm prisma generate`.
2. Přidat dep `date-fns-tz` do `apps/api/package.json`.
3. Doplnit Zod kontrakty do `@branik/contracts` (+ export `CreateTrainingTemplateInput`, `UpdateTrainingTemplateInput`, `TrainingTemplateListItem`).
4. Implementovat `TrainingTemplatesService` s metodami `create`, `update`, `delete`, `list`, `get`, `regenerate`, `generateEvents(templateId, scope, tx)`.
5. Implementovat `TrainingTemplatesController` dle tabulky endpointů.
6. Doplnit `POST /events/:id/detach` do `EventsController` + implicit detach při `PATCH /events/:id` pokud se změní `startsAt`/`endsAt`.
7. Rozšířit seed o 2 ukázkové šablony.
8. Přidat integrační test: create → list → patch (change time) → verify generated events updated → detach one → patch again → verify detached preserved → delete → verify historical preserved with `detached=true`.

---HANDOFF---
OD: softwarovy-architekt
KOMU: backend-vyvojar
STATUS: hotovo
VÝSTUP: /Users/tm/workspaces/projects/branik/projekty/training-templates/architektura.md
DALŠÍ KROK: Backend vývojář implementuje Prisma schema change (TrainingTemplate + Event.templateId/detached), TrainingTemplatesService vč. generátoru (date-fns-tz, idempotent insert přes @@unique([templateId, startsAt]) + skipDuplicates), controller dle tabulky, Zod kontrakty v @branik/contracts, detach endpoint v EventsController (+ implicit detach při změně času), seed 2 ukázkových šablon pro ABC Braník.
OTÁZKY: Žádné blokační. Timezone závislost date-fns-tz (~10 kB) k přidání. Svátky vědomě mimo MVP.
---/HANDOFF---
