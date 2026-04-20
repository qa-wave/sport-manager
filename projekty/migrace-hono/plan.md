# Projektový plán: Migrace NestJS → Hono (Next.js API Routes)
**Datum:** 2026-04-18
**Status:** Nový
**Autor:** Projektový manažer

---

## Zadání

Zjednodušit stack z dual-server (NestJS :3001 + Next.js :3100) na single-server (Next.js :3100 s Hono uvnitř catch-all API route). Mobilní app (Expo) i webový frontend musí fungovat se stejnými REST endpointy bez přerušení. Migrace musí probíhat paralelně s vývojem nových features (Safeguarding, Read receipts, Smart Reminders).

---

## Cíle projektu

- Eliminovat NestJS server jako samostatný proces — jeden `pnpm dev` místo dvou
- Zachovat 100 % kompatibility REST API (žádný breaking change pro Expo ani web FE)
- Přenést veškerou business logiku bez regrese funkcionalnosti
- Nerozbít paralelní feature vývoj — větve nových features se rebazují na migrační větev, ne obráceně
- Zachovat typovou bezpečnost (Zod kontrakty z `@branik/contracts` zůstávají single source of truth)
- Zachovat multi-tenant RLS přes `prisma.withClub(clubId)`

---

## Architektura cílového stavu

```
apps/web/src/app/api/
  [...route]/
    route.ts          # Next.js catch-all → předává vše do Hono app

apps/web/src/server/
  hono.ts             # Hono app instance
  middleware/
    auth.ts           # JWT verify middleware (jose nebo jsonwebtoken)
    tenant.ts         # x-club-id → ctx.var.clubId
    rbac.ts           # MemberContext resolve
  routes/
    health.ts
    auth.ts
    me.ts
    members.ts
    teams.ts
    notifications.ts
    dashboard.ts
    events.ts
    conversations.ts
    training-templates.ts
    platform-admin.ts
```

**Klíčová pravidla Hono v Next.js:**
- Catch-all route: `app/api/[...route]/route.ts` exportuje `{ GET, POST, PUT, PATCH, DELETE }`
- Hono `app.fetch` → Next.js handler adapter přes `@hono/node-server/adapters/next`
- Cookies pro refresh token: Hono `setCookie` / `getCookie` z `hono/cookie`
- Prisma client sdílen z `@branik/db` — stejný package, žádná změna
- Zod validace zůstává identická — importuje z `@branik/contracts`

---

## Fáze a úkoly

### Fáze 0: Příprava (prerekvizita všeho)
**Cíl:** Vytvořit základní Hono scaffold v Next.js, NestJS stále běží jako primární server.
**Trvání:** 1 den

- [ ] Přidat `hono` a `@hono/node-server` do `apps/web/package.json` — frontend-vyvojar
- [ ] Vytvořit `apps/web/src/app/api/[...route]/route.ts` — catch-all Next.js handler — frontend-vyvojar
- [ ] Vytvořit `apps/web/src/server/hono.ts` — prázdná Hono app, `/health` vrací `{ ok: true }` — frontend-vyvojar
- [ ] Vytvořit `apps/web/src/server/middleware/tenant.ts` — portovat `TenantMiddleware` logiku (`x-club-id` header → `ctx.var.clubId`) — backend-vyvojar
- [ ] Vytvořit `apps/web/src/server/middleware/auth.ts` — JWT verify bez Passport (jose), nastavit `ctx.var.user` — backend-vyvojar
- [ ] Vytvořit `apps/web/src/server/middleware/rbac.ts` — stub, portovat `RbacService.getMemberContext` — backend-vyvojar
- [ ] Nastavit `NEXT_PUBLIC_API_URL` tak, aby web FE i Expo mohly přepínat mezi NestJS a Hono — frontend-vyvojar

**Acceptance criteria Fáze 0:**
- `GET http://localhost:3100/api/health` vrací `{ ok: true }`
- NestJS stále běží na `:3001`, web FE jej stále používá jako primární API
- Žádný existující test/flow není rozbít

**Rizika Fáze 0:**
- Next.js 15 App Router a Hono: ověřit kompatibilitu `@hono/node-server` adapteru s Node.js runtime (ne Edge)
- Sdílení Prisma clienta mezi Server Components a Hono route — singleton pattern v `@branik/db`

---

### Fáze 1: HealthModule + AuthModule
**Cíl:** Kritická infrastruktura — bez auth nic nefunguje.
**Trvání:** 2 dny
**Závislosti:** Fáze 0 dokončena

**Moduly:** `HealthModule`, `AuthModule`

**Endpointy k portování:**
```
GET  /api/health
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
```

**Úkoly:**
- [ ] Portovat `AuthService` (login, register, refresh, logout) do `apps/web/src/server/services/auth.service.ts` — backend-vyvojar
- [ ] Portovat `AuthController` logiku do `apps/web/src/server/routes/auth.ts` jako Hono routes — backend-vyvojar
- [ ] Refresh cookie: Hono `setCookie` s `httpOnly: true, secure: true` — backend-vyvojar
- [ ] Testovat login + token refresh z web FE (sessions storage `club.access`) — qa-tester
- [ ] Testovat login + token refresh z Expo (SecureStore + Cookie header) — qa-tester

**Acceptance criteria Fáze 1:**
- Login přes Hono vrací `accessToken` identického formátu jako NestJS
- Refresh cookie funguje (web) i manuální cookie header (Expo)
- `/api/auth/logout` invaliduje refresh cookie
- Stávající web FE session (`sessionStorage club.access`) funguje po přihlášení přes nové Hono API

**Rizika Fáze 1:**
- bcrypt na Edge runtime nefunguje — nutno zajistit Node.js runtime (`export const runtime = 'nodejs'` v catch-all route)
- JWT secret musí být dostupný přes `process.env` v Next.js — ověřit `.env` loading
- httpOnly cookie v Next.js dev (localhost) — SameSite=Lax je OK

---

### Fáze 2: MeModule + MembersModule + TeamsModule
**Cíl:** Core datové endpointy potřebné pro navigaci a kontext v celém FE.
**Trvání:** 2 dny
**Závislosti:** Fáze 1 (auth middleware musí být funkční)

**Moduly:** `MeModule`, `MembersModule`, `TeamsModule`

**Endpointy k portování:**
```
GET /api/me
GET /api/me/context
GET /api/me/coach-only
GET /api/members
GET /api/members/:memberId
GET /api/teams
```

**Úkoly:**
- [ ] Portovat `MeService` → `apps/web/src/server/routes/me.ts` — backend-vyvojar
- [ ] Portovat `MembersService` → `apps/web/src/server/routes/members.ts` — backend-vyvojar
- [ ] Portovat `TeamsService` → `apps/web/src/server/routes/teams.ts` — backend-vyvojar
- [ ] Ověřit že `prisma.withClub(clubId)` funguje (RLS) v kontextu Next.js serveru — backend-vyvojar
- [ ] E2E test: web FE sidebar navigace, `useMemberContext` hook — qa-tester

**Acceptance criteria Fáze 2:**
- `GET /api/me/context` vrací `ClubRole`, `TeamRole`, `GuardianLink` identicky s NestJS
- RLS: Dad z klubu Braník nevidí členy Spartak Kbely
- Role switcher v topbaru (Admin/Coach/Parent) funguje

**Rizika Fáze 2:**
- `prisma.withClub` interně používá `SET LOCAL app.club_id` — v serverless/edge prostředí je nutné ověřit, že každý request dostane čistou DB session (connection pooling)

---

### Fáze 3: NotificationsModule + DashboardModule
**Cíl:** Periferní read-heavy moduly bez komplexní mutační logiky.
**Trvání:** 1–2 dny
**Závislosti:** Fáze 2

**Moduly:** `NotificationsModule`, `DashboardModule`

**Endpointy k portování:**
```
GET   /api/notifications
GET   /api/notifications/unread-count
PATCH /api/notifications/:notificationId/read
PATCH /api/notifications/read-all
GET   /api/dashboard/feed
```

**Úkoly:**
- [ ] Portovat `NotificationsService` + routes — backend-vyvojar
- [ ] Portovat `DashboardService` (feed, needs-attention, quick-actions) + routes — backend-vyvojar
- [ ] Ověřit notification bell dropdown ve web FE — qa-tester
- [ ] Ověřit Dashboard "This Week", "Needs Attention" sekce — qa-tester

**Acceptance criteria Fáze 3:**
- Notification bell zobrazuje správný unread count
- Dashboard feed je identický s NestJS výstupem (porovnat JSON response)
- PATCH read/read-all aktualizuje stav

---

### Fáze 4: EventsModule
**Cíl:** Nejkomplexnější CRUD modul s RSVP a attendance logikou.
**Trvání:** 2–3 dny
**Závislosti:** Fáze 2 (members + teams kontext)

**Moduly:** `EventsModule`

**Endpointy k portování:**
```
GET    /api/events
GET    /api/events/:eventId
POST   /api/events
PATCH  /api/events/:eventId
POST   /api/events/:eventId/rsvp
PATCH  /api/events/:eventId/attendance
POST   /api/events/:eventId/detach
```

**Úkoly:**
- [ ] Portovat `EventsService` (list, detail, create, update) — backend-vyvojar
- [ ] Portovat RSVP logiku (`POST /:eventId/rsvp`) — backend-vyvojar
- [ ] Portovat attendance bulk update — backend-vyvojar
- [ ] Portovat detach (odpojení instance ze série) — backend-vyvojar
- [ ] Portovat Zod validace ze stávajících DTO na `@branik/contracts` schémata — backend-vyvojar
- [ ] Testovat Calendar view (month grid) — qa-tester
- [ ] Testovat RSVP roster tabulku v event detailu — qa-tester
- [ ] Testovat Create Event form — qa-tester

**Acceptance criteria Fáze 4:**
- Calendar view zobrazuje eventy identicky (datum, typ, status)
- RSVP: hráč může odpovědět YES/NO/MAYBE, stav se okamžitě projeví
- Attendance: coach bulk update funguje
- Detach instance ze série: event zůstane, ale ztratí `templateId`

**Rizika Fáze 4:**
- Events mají nejvíce business logiky (RSVP stav machine, attendance podmínky) — high risk regrese
- Nutno mít NestJS stále jako fallback v přechodném období

---

### Fáze 5: ConversationsModule
**Cíl:** Privacy-critical modul — privacy-by-participation musí zůstat zachována.
**Trvání:** 2–3 dny
**Závislosti:** Fáze 2 (members context pro privacy guards)

**Moduly:** `ConversationsModule`

**Endpointy k portování:**
```
GET  /api/conversations
GET  /api/conversations/:conversationId
POST /api/conversations
POST /api/conversations/:conversationId/messages
PATCH /api/conversations/:conversationId/read
```

**Úkoly:**
- [ ] Portovat privacy-by-participation guard do Hono middleware — backend-vyvojar
- [ ] Portovat `ConversationsService` (list, detail, create) — backend-vyvojar
- [ ] Portovat message send + optimistic update support — backend-vyvojar
- [ ] Portovat read receipt (`PATCH /read`) — backend-vyvojar
- [ ] Security test: Dad nemůže číst konverzaci Mom+Coach — qa-tester + security-specialista
- [ ] Testovat Messages UI (bubliny, date separators) — qa-tester

**Acceptance criteria Fáze 5:**
- Privacy isolation: cross-participant přístup vrací 403 (ne 404, ne data)
- Konverzace typy (TEAM / COACHES / PARENTS / DM / GROUP / ANNOUNCEMENT) filtrují správně
- Optimistic updates v Messages UI fungují
- Read receipt se aktualizuje

**Rizika Fáze 5:**
- Privacy guard je nejkomplexnější logika — chyba zde = data leak = kritický incident
- Doporučeno: security review před nasazením Fáze 5

---

### Fáze 6: TrainingTemplatesModule + PlatformAdminModule
**Cíl:** Zbývající specializované moduly — nejnižší priorita (FE pro training templates ještě neexistuje).
**Trvání:** 1–2 dny
**Závislosti:** Fáze 4 (templates generují Events)

**Moduly:** `TrainingTemplatesModule`, `PlatformAdminModule`

**Endpointy k portování:**
```
GET    /api/training-templates
GET    /api/training-templates/:id
POST   /api/training-templates
PATCH  /api/training-templates/:id
DELETE /api/training-templates/:id
POST   /api/training-templates/:id/regenerate

GET    /api/platform-admin/clubs
GET    /api/platform-admin/clubs/:clubId
PATCH  /api/platform-admin/clubs/:clubId/features
PATCH  /api/platform-admin/clubs/:clubId/config
GET    /api/platform-admin/clubs/:clubId/audit
```

**Úkoly:**
- [ ] Portovat `TrainingTemplatesService` + event generátor (idempotentní, `skipDuplicates`) — backend-vyvojar
- [ ] Portovat `PlatformAdminGuard` → Hono middleware s platform admin check — backend-vyvojar
- [ ] Portovat platform admin routes — backend-vyvojar
- [ ] Testovat regeneraci eventů ze šablony — qa-tester

**Acceptance criteria Fáze 6:**
- Template regenerate je idempotentní (duplicitní eventy se nepřidají)
- Platform admin endpoints přístupné pouze s platform admin rolí
- Audit log endpoint vrací záznamy

---

### Fáze 7: Cutover a vypnutí NestJS
**Cíl:** Přepnout veškerý traffic na Hono, odstavit NestJS.
**Trvání:** 1 den
**Závislosti:** Fáze 0–6 všechny hotovy + QA sign-off

**Úkoly:**
- [ ] Aktualizovat `NEXT_PUBLIC_API_URL` / `API_BASE_URL` na `:3100/api` pro web FE a Expo — frontend-vyvojar
- [ ] Odebrat NestJS z `pnpm dev` / `turbo` pipeline — devops-inzenyr
- [ ] Odebrat `apps/api` z docker-compose (Redis + Postgres zůstávají) — devops-inzenyr
- [ ] Archivovat `apps/api` (nepřidávat do `.gitignore`, jen přesunout do `apps/_legacy/api`) — devops-inzenyr
- [ ] Aktualizovat `CLAUDE.md`: nový stack, nové příkazy pro dev — pm

**Acceptance criteria Fáze 7:**
- `pnpm dev` startuje pouze Next.js na `:3100`
- Expo app funguje se stejnými REST endpointy (žádná změna v Expo kódu)
- Všechny FE features fungují: auth, calendar, messages, notifications, dashboard
- Žádný request nevede na `:3001`

---

## Strategie přechodného období

### Dual-server provoz (Fáze 0–6)

Po dobu migrace běží oba servery paralelně:
- **NestJS (:3001)** = primární, produkční API
- **Hono (:3100/api)** = stínový server, testuje se modul po modulu

Web FE přepíná přes env proměnnou:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001   # NestJS (výchozí)
# NEXT_PUBLIC_API_URL=http://localhost:3100/api  # Hono (po migraci fáze)
```

Expo přepíná stejnou proměnnou (nebo přes Expo Config).

Po dokončení každé fáze: QA otestuje danou sadu endpointů přes Hono, teprve pak se fáze označí za hotovou. Přepnutí FE na Hono proběhne až po Fázi 6 (všechny moduly migrovány).

### NestJS jako referenční implementace

Dokud NestJS běží, slouží jako ground truth. Při pochybnostech o business logice:
1. Zavolat stejný endpoint na NestJS
2. Porovnat JSON response
3. Hono musí vrátit identický výstup (nebo dokumentovanou odlišnost)

---

## Koordinace s paralelním vývojem features

### Princip: Feature branches cílí na `main`, ne na migrační větev

```
main
├── feature/safeguarding          # vývoj probíhá v NestJS
├── feature/read-receipts         # vývoj probíhá v NestJS
├── feature/smart-reminders       # vývoj probíhá v NestJS
└── feature/migrace-hono          # migrační větev
    ├── phase-0-scaffold
    ├── phase-1-auth
    ├── phase-2-core
    ...
```

**Pravidla pro nové features:**
1. Nová feature se vyvíjí nejdřív v NestJS (jako dosud) — přidá se do `apps/api/src`
2. Pokud migrační Fáze pro daný modul ještě neproběhla → feature jde do NestJS
3. Pokud migrační Fáze pro daný modul proběhla → feature jde přímo do Hono
4. Po mergi migrační větve do `main`: zbývající NestJS features se portují do Hono v samostatném PR

**Konkrétně pro aktuální backlog:**
| Feature | Modul | Strategie |
|---|---|---|
| Safeguarding | MembersModule + nový SafeguardingModule | Vyvíjet v NestJS, portovat při Fázi 2 nebo po |
| Read receipts | ConversationsModule | Vyvíjet v NestJS, portovat při Fázi 5 |
| Smart Reminders | EventsModule + nová NotificationQueue | Vyvíjet v NestJS, portovat při Fázi 4 |

---

## Rollback plán

### Rollback na úrovni fáze

Každá fáze je izolovaná. Pokud Fáze N selže:
1. Fáze N se revertuje (git revert nebo branch delete)
2. Web FE a Expo zůstávají na NestJS (`NEXT_PUBLIC_API_URL=:3001`)
3. Příčina selhání se analyzuje (1–2 dny debug)
4. Fáze N se restartuje s opraveným přístupem

### Rollback po Fázi 7 (cutover)

Pokud se po cutoveru projeví kritická chyba:
1. Okamžitě: přepnout `NEXT_PUBLIC_API_URL` zpět na `:3001`
2. Restartovat NestJS proces (`pnpm --filter @branik/api dev`)
3. `apps/_legacy/api` je stále dostupný, NestJS kód nebyl smazán
4. Analyzovat příčinu, opravit v Hono, provést nový cutover

**Rollback není možný pokud:**
- NestJS byl odstraněn z repozitáře (proto: přesun do `apps/_legacy`, ne delete)
- DB schema byl změněn neobrátitelnou migrací (migrační plán nesmí měnit DB schema)

---

## Pořadí migrace — shrnutí a zdůvodnění

| Pořadí | Modul(y) | Zdůvodnění |
|---|---|---|
| 1. | HealthModule | Zero dependencies, proof of concept integrace Hono do Next.js |
| 2. | AuthModule | Vše ostatní závisí na auth; bez funkčního JWT middleware nelze testovat nic dalšího |
| 3. | MeModule, MembersModule, TeamsModule | Poskytují `MemberContext` který spotřebovávají všechny ostatní endpointy; nutné pro RLS |
| 4. | NotificationsModule, DashboardModule | Read-heavy, nízká mutační komplexita; rychlé jistoty po auth |
| 5. | EventsModule | Největší business logika, ale izolovaná od Conversations; RSVP strojek musí být stabilní před ConversationsModule |
| 6. | ConversationsModule | Privacy-critical; testovat až po stabilitě auth + members kontextu; security review |
| 7. | TrainingTemplatesModule, PlatformAdminModule | Nejnižší frekvence použití; Training Templates FE ještě neexistuje |
| 8. | Cutover | Až po 100 % coverage všech modulů + QA sign-off |

---

## Aktuální stav

Fáze plánování dokončena. Čeká na zahájení Fáze 0 (scaffold).

## Další kroky

1. **Architektonické rozhodnutí** (blokuje Fázi 0): Potvrdit Node.js runtime vs. Edge runtime pro Next.js API route (bcrypt + Prisma vyžadují Node.js)
2. **Zahájit Fázi 0**: Softwarový architekt navrhne detailní strukturu Hono app (middleware stacking, context types) — výstup do `projekty/migrace-hono/architektura.md`
3. **Komunikovat feature týmům**: Informovat vývojáře pracující na Safeguarding/Read receipts/Smart Reminders o strategii (nové features stále do NestJS)

## Rizika a bloky

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|
| bcrypt / Prisma nefunguje na Edge runtime | Vysoká | Kritický | Explicitně nastavit `export const runtime = 'nodejs'` |
| Privacy regression v ConversationsModule | Střední | Kritický | Security review + Dad/Mom privacy test suite |
| Prisma connection pool a RLS (`SET LOCAL`) | Střední | Vysoký | Ověřit chování s PgBouncer / connection pooling před cutoverem |
| Feature branches konflikty při mergi | Nízká | Střední | Jasná pravidla (nové features do NestJS dokud modul není portován) |
| Expo cookie handling | Nízká | Střední | Testovat v Expo dev build, ne jen simulátor |
| Výkon: Next.js handler overhead vs. Fastify | Nízká | Nízký | Benchmark po Fázi 1, rozhodnutí před cutoverem |

---

---HANDOFF---
OD: projektovy-manazer
KOMU: softwarovy-architekt
STATUS: hotovo
VÝSTUP: projekty/migrace-hono/plan.md
DALŠÍ KROK: Architekt navrhne detailní technickou architekturu Hono v Next.js — typy Hono Context Variables (user, clubId, member), middleware stacking pořadí, adapter pattern pro sdílení services mezi Hono a Next.js Server Components, Prisma singleton. Výstup: projekty/migrace-hono/architektura.md
OTÁZKY:
  1. Node.js runtime vs. Edge runtime — potvrdit že catch-all route bude `export const runtime = 'nodejs'`?
  2. Sdílet Prisma client instanci mezi Hono routes a Next.js Server Components přes singleton v `@branik/db`?
  3. Přejmenovat `apps/api` na `apps/_legacy/api` hned v Fázi 0, nebo až po cutoveru (Fáze 7)?
---/HANDOFF---
