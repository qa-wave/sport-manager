# Technický návrh: Per-tenant customizace
**Od:** Softwarový architekt
**Pro:** Backend vývojář, Frontend vývojář, DevOps, PM
**Datum:** 2026-04-17
**Projekt:** per-tenant

## Problém

Aplikace je multi-tenant (ABC Braník, TJ Spartak Kbely a další kluby v jednom kódu + jedné DB, izolace přes `clubId` + Postgres RLS). Občas ale konkrétní klub potřebuje něco, co ostatní nechtějí — např.:

- **Braník** chce vlastní modul "Jarní pohár" (rozpis zápasů + bodování jen pro jejich pohár).
- **Spartak Kbely** chce pokročilé statistiky rozhodčích (karty, poznámky, výkonnostní index).
- **FC Rivertown** chce vlastní "trial member" registrační formulář s dotazníkem a souhlasem se zpracováním fotek.
- **Libovolný klub** chce přejmenovat "Trénink" na "Utkání", schovat modul Zpráv nebo mít limit 500 členů místo 50.

Aktuálně neexistuje žádný mechanismus — každá taková žádost by skončila `if (clubId === 'branik')` větvením v produkčním kódu, což je cesta do pekla. Návrh definuje **5 vrstev** od nejjednodušší (Level 1) po nejflexibilnější (Level 5). Vrstvy nejsou alternativy — doplňují se (klub může mít Level 1 + Level 2 + Level 4 současně).

### Klíčové principy návrhu

1. **Graduální přijetí.** Začneme Level 1 + 2 jako součást MVP. Level 3+ teprve až bude skutečná business poptávka (YAGNI).
2. **Flaggy jsou metadata, ne code-path rozvětvení.** `if (clubId === 'branik') ...` je anti-pattern. Správně: `if (features.springCup) ...`.
3. **Default-off.** Nová feature se zapíná per-klub. Staré kluby nevidí nic nového, dokud neaktivujeme flagu.
4. **Audit.** Každá změna flagu/configu = audit log (kdo, kdy, staré → nové).
5. **Žádný dynamický eval.** Klubové konfigy jsou validovaná data (Zod), nikdy ne spustitelný kód (XSS/RCE).

---

## Vrstva 1 — Feature flags (zap/vyp existující funkce)

### Co řeší
- Klub nechce vidět modul **Zprávy** → `features.messages = false` → navigace skryje item, API vrátí 404.
- Klub si přeje **TrainingTemplates** zapnout dřív než ostatní (early access) → `features.trainingTemplates = true`.
- A/B rollout nových fíček — zapneme 5 klubům, počkáme týden, zapneme všem.
- Sunset starých fíček — postupně vypínáme, pak smažeme kód.

### Jak se realizuje

**Prisma schema** — přidáme JSONB pole na `Club`:
```prisma
model Club {
  // ...
  features Json @default("{}")  // { "messages": true, "gallery": false, ... }
}
```

**Typovaný kontrakt** v `packages/contracts/features.ts` (Zod schema = single source of truth):
```ts
export const ClubFeatures = z.object({
  messages: z.boolean().default(true),
  gallery: z.boolean().default(false),
  trainingTemplates: z.boolean().default(true),
  payments: z.boolean().default(true),
  springCup: z.boolean().default(false),           // Braník-only modul
  refereeStats: z.boolean().default(false),        // Spartak-only modul
}).strict();
export type ClubFeatures = z.infer<typeof ClubFeatures>;
```

**NestJS guard** — `@RequireFeature('messages')` dekorátor + `FeatureGuard`:
```ts
@Controller('conversations')
export class ConversationsController {
  @Get()
  @Roles('PLAYER', 'HEAD_COACH')
  @RequireFeature('messages')
  list(@CurrentMember() ctx: MemberContext) { ... }
}
```
Guard se připojí globálně v `AppModule` za `RolesGuard`. Čte flagu z již načteného `req.club` (který naplní rozšířený `TenantMiddleware` — viz Level 2) nebo z cache. Když je flag `false`, hodí `NotFoundException` (ne 403 — klient nemá vědět, že fíčura existuje).

**React hook** — `useFeature('messages')` v `apps/web/lib/features.ts`:
```ts
export function useFeature(key: keyof ClubFeatures): boolean {
  const { data: club } = useClub();   // TanStack Query, cached
  return club?.features?.[key] ?? FEATURE_DEFAULTS[key];
}

// Použití:
const hasMessages = useFeature('messages');
if (!hasMessages) return null;        // nav item skryt
```

**Zdroj pravdy pro FE** — `/me/context` odpověď rozšíříme o `club.features` (defaulty se aplikují na backendu, FE dostává vždy kompletní objekt).

### Cena / složitost
**XS** — 1 migrace, 1 guard, 1 hook, 1 Zod schema. ~1 den práce backend + ~0,5 dne FE.

### Kdy to použít
**VŽDY.** Level 1 je základ, který všechno ostatní doplňuje. Každý modul by měl mít flag, i když default=true.

### Kdy NE
Nedává smysl mít flag pro triviality (1 tlačítko). Flag je na modul/submodul, ne na jednotlivé endpointy.

---

## Vrstva 2 — Tenant config (tiery, limity, labels, branding)

### Co řeší
- Tier klubu: `basic` (50 členů, 3 týmy), `pro` (500 členů, neomezeno).
- Přejmenování terminologie: `labels.practice = "Utkání"` místo "Trénink" v UI Spartaku.
- Branding: primární barva, logo, custom CSS proměnné.
- Kontaktní info pro patičku e-mailů.
- Přepínače chování (ne fíčur) — např. `attendanceMode = "opt-in" | "opt-out"`.

### Jak se realizuje

**Prisma** — další JSONB pole `config`:
```prisma
model Club {
  features Json @default("{}")
  config   Json @default("{}")
}
```

**Zod kontrakt** pro tier / limity / labely:
```ts
export const ClubConfig = z.object({
  tier: z.enum(['basic', 'pro', 'enterprise']).default('basic'),
  limits: z.object({
    maxMembers: z.number().int().positive().default(50),
    maxTeams: z.number().int().positive().default(3),
  }).default({}),
  branding: z.object({
    primaryColor: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
    logoUrl: z.string().url().optional(),
  }).default({}),
  labels: z.record(z.string(), z.string()).default({}),  // "practice" -> "Utkání"
  behaviors: z.object({
    attendanceMode: z.enum(['opt-in', 'opt-out']).default('opt-in'),
  }).default({}),
}).strict();
```

**Enforcement limitů** — nový helper `ensureLimit(clubId, 'maxMembers', currentCount)` volaný v service layer při `CREATE`. Při překročení `HttpException(402 Payment Required)` s hintem na upgrade.

**Caching** — `ClubService.getClubWithFlags(clubId)` s TTL 60 s (Redis), zneplatnění přes Redis pub/sub po každém update. Zabrání SELECT na `Club` u každého requestu.

**FE** — `useClub()` hook vrátí celý objekt včetně `config.labels`. Komponenty se ptají `label('practice') ?? t('practice')` (i18n fallback na default). CSS proměnné se injektují do `<html style>` z `layout.tsx` na základě `branding.primaryColor`.

### Cena / složitost
**S** — ~2 dny BE (Zod schema + validace + limit enforcement + cache), ~1 den FE (label helper + branding injection).

### Kdy to použít
- Jakmile máme **placený tier** (limity členů) nebo potřebujeme **enterprise customize** (labels).
- V MVP stačí i malé — jen `tier` a `limits`. Branding/labels odložit na později.

### Kdy NE
Nestrkej do `config` logické flagy — ty patří do `features` (Level 1). `config` je čistě hodnotová konfigurace.

---

## Vrstva 3 — Per-tenant code hooks (plugin bus / event handlery)

### Co řeší
- Braník chce, aby se po vytvoření nového člena **automaticky poslal webhook** do jejich externího registračního systému.
- Spartak chce přidat vlastní validaci: registrace minora vyžaduje lékařské potvrzení jako attachment.
- Klub chce custom e-mail po RSVP (se sponzorem v patičce).

### Jak se realizuje

**Event bus** — NestJS `EventEmitterModule` (in-process, synchronní nebo async). Každý doménový service publikuje události:
```ts
this.events.emit('member.created', { clubId, memberId, payload });
this.events.emit('event.rsvp', { clubId, eventId, memberId, status });
```

**Plugin registry** — `apps/api/src/plugins/` adresář, každý plugin je TS modul:
```ts
// apps/api/src/plugins/branik-webhook/index.ts
export const branikWebhookPlugin: ClubPlugin = {
  clubSlug: 'branik',
  listeners: {
    'member.created': async (ctx, payload) => {
      await fetch('https://registrace.branik.cz/hook', {
        method: 'POST',
        headers: { 'x-secret': ctx.secrets.BRANIK_WEBHOOK_SECRET },
        body: JSON.stringify(payload),
      });
    },
  },
};
```

Při startu aplikace `PluginLoader` načte všechny registrované pluginy a zaregistruje listenery. Dispatcher filtruje podle `clubSlug` — plugin se spustí jen pro události z "jeho" klubu.

**Bezpečnost**
- Pluginy jsou **in-tree kód**, commitnutý v repu, review v PR — ne dynamický code-load.
- Secrety v `.env` nebo secret manageru (ne v DB). Plugin dostane `ctx.secrets` scoped k jeho slugu.
- Errory z pluginu nesmí shodit hlavní request (try/catch s logováním + Sentry). Webhook s externím selháním jde do retry queue (BullMQ).

**Hot-plug / dynamic load**
V MVP **ne** — jednoduchost. Pokud by později šlo o skutečné 3rd-party pluginy, pak `@club/plugin-sdk` + dynamický import z `/plugins/*.js` s sandboxem (ale to je Level 5, viz níže).

### Cena / složitost
**M** — ~1 týden (event bus, plugin-loader, konvence, první dva příklady + testy).

### Kdy to použít
- Jakmile máme **2+ klubů s netriviální externí integrací** (webhook, custom notifikace).
- Když větvení `if (clubSlug === ...)` v service už páchne a rozlézá se.

### Kdy NE
- Když je potřeba jen zapnout/vypnout feature — Level 1.
- Když je potřeba jen změnit hodnotu (label, limit) — Level 2.
- Pro "jen pro 1 klub navždy" hack — větev do vlastního repa radši než do hlavního.

---

## Vrstva 4 — White-label deploy (vlastní doména / theme)

### Co řeší
- Klub chce vlastní URL: `app.branik.cz` místo `branik.clubapp.cz`.
- Klub chce úplně vlastní theme — ne jen barvu, ale vlastní font, layout, marketing landing page.
- Vyšší percepce vlastnictví pro klub (psychologie prodeje).

### Jak se realizuje

**DNS + proxy** — klub nasměruje CNAME na `cname.clubapp.cz`. Cloudflare (nebo Caddy/Traefik) udělá TLS + forward na stejný Next.js origin s hlavičkou `x-club-slug`.

**Resolver klubu podle hostname** — middleware na FE a BE:
```ts
// Next.js middleware.ts
const hostname = req.headers.get('host');
const club = await resolveClubByHostname(hostname);  // Redis cache
req.headers.set('x-club-slug', club.slug);
```

**Theme** — `apps/web/app/[clubSlug]/layout.tsx` nebo "tenant-root layout" s dynamickým CSS (na základě `club.config.branding`). Tailwind CSS custom properties (`--primary`, `--accent`) přepnuté v `<html style>`.

**Stejná code-base, jiný deploy?** Ne. Stejné nasazení, jen host-based routing. **Jeden binární build = všechny kluby.**

### Cena / složitost
**M-L** — ~1-2 týdny. Hlavní náklady: certifikáty (Let's Encrypt / Cloudflare SSL for SaaS), DevOps pipeline pro onboarding nových domén, dokumentace pro kluby. Plus FE práce na theme systému.

### Kdy to použít
- Klub platí vyšší tier a chce vlastní brand.
- Marketing argument (enterprise sales).
- Splníte až 10+ klubů má skutečný zájem, ne dřív.

### Kdy NE
V MVP absolutně ne. Pozor: neslučuj s microservice multi-deploy — to je Level 5 past.

---

## Vrstva 5 — Custom modules (pluginy z Gitu, sandboxed)

### Co řeší
- Třetí strana (externí dev nebo sám klub) chce dodat vlastní modul bez PR do hlavního repa.
- Modul má vlastní DB tabulky, vlastní routes, vlastní FE komponenty.
- Klub dostává SDK a píše si vlastní "appku nad appkou".

### Jak se realizuje (koncept)

- **Module manifest** (`module.json`) — popis modulu: slug, verze, endpoints, migrace.
- **Runtime registry** — na startu appky se modul naloaduje z cesty / URL / npm package.
- **DB izolace** — modul dostane vlastní Postgres schema (`module_jarni_pohar`) + omezenou roli (nemá právo na `club.*` tabulky přímo, jen přes SDK).
- **Sandbox** — Node.js `vm` / worker thread pro 3rd-party kód (neplatí pro vlastní moduly v in-tree).
- **FE** — module federation (Webpack/Turbopack) nebo iframe s postMessage bridge.

### Cena / složitost
**XXL** — měsíce. Jde o samostatný produktový projekt, ne fíčuru.

### Kdy to použít
- **Téměř nikdy** v MVP/startup fázi.
- Až budou 50+ klubů a skutečný ekosystém developerů (Shopify, Salesforce model).

### Kdy NE
**Teď.** Nepřeinženýruj. Pokud by to bylo potřeba dřív, Level 3 obvykle stačí.

---

## Srovnávací tabulka

| Level | Co řeší | Cena | Kdy |
|-------|---------|------|-----|
| 1. Feature flags | Zap/vyp modulů per klub | XS (1 den) | **Teď, MVP** |
| 2. Tenant config | Tiery, limity, labely, brand | S (2-3 dny) | **Teď, MVP (aspoň `tier` + `limits`)** |
| 3. Code hooks / events | Webhooks, custom logika per klub | M (1 týden) | Až bude 2. klient s custom integrací |
| 4. White-label deploy | Vlastní doména + theme | M-L (1-2 týdny) | Enterprise tier, 10+ klubů |
| 5. Custom modules | 3rd-party pluginy s DB + UI | XXL (měsíce) | 50+ klubů, ekosystém devs |

---

## Doporučení pro projekt club-app (nyní)

### Fáze A — MVP (nyní, 1-2 sprinty)
1. **Level 1 — Feature flags** implementovat celé.
   - `Club.features Json`, Zod schema, `@RequireFeature()` guard, `useFeature()` hook.
   - Flagy pro stávající moduly: `messages`, `gallery`, `payments`, `trainingTemplates`.
   - Defaulty v Zod (všechno `true`, kromě "budoucích" fíčur jako `springCup` = `false`).

2. **Level 2 — Tenant config (minimální)** — jen `tier` + `limits.maxMembers` + `limits.maxTeams`.
   - Dává prodejní argument (placené tiery) a ochranu před abusem.
   - Labels/branding odložit — není to MVP prio.

### Fáze B — až bude business potřeba
3. **Level 3** — teprve když přijde 2. klub s webhook/integrační specialitou.
4. **Level 4** — enterprise argument, ne dřív než 10 klubů v produkci.
5. **Level 5** — skoro jistě nikdy, nebo za 3+ roky.

### Co NEdělat
- Nepřidávat `Club.customConfig: Json` bez Zod kontraktu — brzy z toho bude "dark Json" se schizofrenickým schématem.
- Nevětvit kód `if (clubSlug === 'branik') ...`. Vždy přes feature flag.
- Nenaskakovat rovnou na Level 5 — to je klasické OVER-engineering, které pohřbilo mnohem větší firmy.

---

## Migration strategy pro `Club` model

### 1. Prisma schema change
```prisma
model Club {
  id       String @id @default(cuid())
  // ... existující pole
  features Json   @default("{}")  // NEW
  config   Json   @default("{}")  // NEW
}
```

### 2. Migrace
```bash
pnpm db:migrate --name add_club_features_config
```
Migrace je **non-breaking** — existující řádky dostanou `{}` a Zod defaulty se aplikují při čtení.

### 3. Zod schema + API → FE kontrakt
`packages/contracts/club.ts`:
```ts
export const ClubFeaturesSchema = z.object({ /* Level 1 pole */ }).strict();
export const ClubConfigSchema   = z.object({ /* Level 2 pole */ }).strict();
export const ClubDto = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  features: ClubFeaturesSchema,
  config: ClubConfigSchema,
});
```

Service vrstva aplikuje `parse()` při čtení **i** při zápisu — tím garantujeme, že defaulty se doplňují a nevalidní hodnoty nikdy neskončí v DB.

### 4. Admin UI pro flag management (interní)
Minimalisticky: stránka `/admin/_internal/clubs/:id/features` jen pro `OWNER` role (super-admin). Checkbox per flag, save POST → audit log. Netřeba krásné, stačí funkční.

### 5. Postupné pokrytí existujících modulů
Každý controller v api/src/\*/ dostane `@RequireFeature(...)` v PR, který nenasadí nové chování (default `true`). Rollout po modulech, ne naráz. Žádná "big bang" migrace.

### 6. Cache
`ClubService.getWithFlags(clubId)` s Redis cache (klíč `club:flags:{id}`, TTL 60 s). Invalidace pub/sub z `updateFlags` endpointu. Jinak selektujeme `Club` každý request → zbytečná zátěž DB.

---

## Mini ukázky kódu (ilustrační, ne finální)

### Ukázka 1 — Feature guard
```ts
// apps/api/src/features/feature.guard.ts
@Injectable()
export class FeatureGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly clubs: ClubService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<keyof ClubFeatures>(FEATURE_KEY, ctx.getHandler());
    if (!required) return true;

    const req = ctx.switchToHttp().getRequest();
    const clubId = req.clubId as string | undefined;
    if (!clubId) throw new NotFoundException();

    const club = await this.clubs.getWithFlagsCached(clubId);
    if (!club.features[required]) {
      throw new NotFoundException();  // 404, ne 403 — neprozrazuje existenci
    }
    return true;
  }
}

// Použití:
@Get()
@RequireFeature('messages')
listConversations() { ... }
```

### Ukázka 2 — React hook
```ts
// apps/web/lib/features.ts
import { useMemberContext } from './member-context';
import type { ClubFeatures } from '@club/contracts';

export function useFeature(key: keyof ClubFeatures): boolean {
  const { data } = useMemberContext();
  return data?.club?.features?.[key] ?? DEFAULTS[key];
}

// V nav komponentě:
const hasMessages = useFeature('messages');
const items = ADMIN_NAV.filter(i => i.href !== '/admin/messages' || hasMessages);
```

### Ukázka 3 — Rozšíření `/me/context` o flagy
```ts
// apps/api/src/me/me.controller.ts
@Get('context')
async context(@CurrentMember() member: MemberContext) {
  const club = await this.clubs.getWithFlagsCached(member.clubId);
  return { ...member, club: { id: club.id, slug: club.slug, features: club.features, config: club.config } };
}
```

---

## Bezpečnostní poznámky

1. **Config injection** — všechny JSON hodnoty procházejí Zod validací při zápisu. XSS brání i frontend (React default-escape).
2. **Labels escape** — pokud klub zadá do `labels.practice = "<script>"`, FE **nikdy** neinterpoluje jako HTML. Pouze jako text content.
3. **Tier abuse** — limity enforcovat na backend (DB count `+ 1 > maxMembers` → 402). Frontend je hint, ne gate.
4. **Audit log** — tabulka `ClubConfigAudit` (kdo, kdy, staré, nové). `Club.updatedAt` ≠ audit, potřebujeme historii.
5. **Secret management** — Level 3 pluginy nikdy nečtou secrets z DB. `process.env.CLUB_<SLUG>_*` nebo secret manager.

---

## Dopady na existující kód

- **`TenantMiddleware`** — rozšířit o načtení `Club` objektu (features + config), stashnout na `req.club`. Jinak by každý guard musel selektovat znova.
- **`RolesGuard`** — beze změny, `FeatureGuard` běží **za** ním (RBAC first, feature second).
- **`useMemberContext()`** — rozšířit odpověď o `club: { features, config }`. Všechny stávající callery fungují dál (additive change).
- **`packages/contracts`** — přidat `features.ts` a `club.ts` Zod schémata. Tyto jsou export pro api i web.
- **`ADMIN_NAV`** v `apps/web/lib/nav.ts` — rozšířit typ `NavItem` o volitelné `feature?: keyof ClubFeatures`, filtr v sidebar komponentě.

---

## Další kroky

1. **PM / uživatel** odsouhlasí doporučenou cestu (Level 1 + Level 2 minimální).
2. **Backend vývojář** implementuje Level 1 podle tohoto návrhu:
   - Prisma migrace `add_club_features_config`
   - `packages/contracts/features.ts` Zod schema
   - `FeatureGuard` + `@RequireFeature()` dekorátor
   - Rozšíření `TenantMiddleware` + `/me/context`
   - Cache layer (Redis, TTL 60 s)
3. **Frontend vývojář** po BE merge:
   - `useFeature()` hook
   - Filtering navigation podle flagů
   - Interní admin UI pro flag management (OWNER only)
4. **Security specialista** review: Zod validace, audit log, 404 vs 403 escape.
5. **QA** test plan: klub s vypnutou fíčurou → endpoint 404, nav item skrytý, existující kluby dostávají defaulty.

---

---HANDOFF---
OD: softwarovy-architekt
KOMU: projektovy-manazer (dále backend-vyvojar)
STATUS: hotovo
VÝSTUP: /Users/tm/workspaces/projects/club-app/projekty/per-tenant/architektura.md
DALŠÍ KROK: Uživatel / PM odsouhlasí doporučenou cestu (Level 1 + minimální Level 2). Pak backend-vyvojar implementuje Level 1 podle spec:
  1. Prisma migrace `add_club_features_config` — přidat `features Json` + `config Json` na `Club`.
  2. `packages/contracts/features.ts` Zod schema (ClubFeatures + ClubConfig).
  3. `FeatureGuard` + `@RequireFeature('key')` dekorátor v `apps/api/src/features/`.
  4. Rozšíření `TenantMiddleware` (stash `req.club` s flagy) + `/me/context` o flagy/config.
  5. Redis cache `club:flags:{id}` TTL 60 s, pub/sub invalidace.
  6. Applikace `@RequireFeature` na existující moduly (messages, trainingTemplates, payments).
OTÁZKY:
  - Chceme v Level 2 MVP i `labels` (přejmenování "Trénink" → "Utkání"), nebo až později?
  - Kdo je "super-admin" pro úpravu flagů — role `OWNER` na klubu, nebo samostatná globální role `PLATFORM_ADMIN`?
  - Audit log flag-změn — stačí Postgres tabulka `ClubConfigAudit`, nebo raději napojit existující event bus (až bude Level 3)?
---/HANDOFF---
