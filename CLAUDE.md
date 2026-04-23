# branik — Claude Code Context

## Pracovní styl

Při plnění úkolů postupuj přímo k řešení. Pokud potřebuješ použít nástroj, analyzovat data nebo provést výpočet, udělej to rovnou. Neptej se mě na povolení, pokud to není kriticky nutné pro bezpečnost.

Aplikace pro řízení sportovních klubů (trénink, eventy, RSVP, komunikace, platby). Stavěno pro ABC Braník + TJ Spartak Kbely, potenciálně **self-hostable white-label** pro libovolný klub.

## Stack

| Vrstva | Technologie |
|---|---|
| API | **Hono** uvnitř Next.js (catch-all `app/api/[[...route]]`) + Prisma + PostgreSQL (RLS) |
| Frontend | Next.js 15 App Router + React 19 + TanStack Query + shadcn/ui + Tailwind |
| Auth | JWT access (jose) + httpOnly refresh cookie (hono/cookie) + bcrypt |
| DB | PostgreSQL 16 v Dockeru |
| Cache | Redis 7 v Dockeru (in-memory fallback pokud není dostupný) |
| Contracts | `@branik/contracts` — Zod schémata sdílená FE/BE |
| Monorepo | pnpm workspaces + turbo |
| Theme | light/dark přes `next-themes`, brand modrá ABC Braník `#609bc6` (HSL `205 47% 55%`) |

**Single-process:** Web FE + API běží v jednom Next.js procesu. Žádný zvláštní NestJS server.

## Struktura monorepa

```
branik/
├── apps/
│   ├── web/              # Next.js 15 (FE + Hono API) — port 3100 v dev
│   ├── mobile/           # Expo (zatím stub)
│   └── workers/          # BullMQ workers
├── packages/
│   ├── contracts/        # Zod kontrakty (FE i BE je importují)
│   ├── db/               # Prisma schema + migrace + seed
│   └── config/           # sdílené tsconfig/eslint presety
├── projekty/             # Specifikace feature z agentů (plan.md, architektura.md)
├── .claude/
│   ├── agents/           # 16 subagentů (PM, architect, FE, BE ...)
│   ├── launch.json       # Claude Preview config (jen web)
│   └── settings.local.json
├── docker-compose.yml    # Postgres + Redis
└── CLAUDE.md             # Tento soubor
```

### Hono API

```
apps/web/
├── app/api/[[...route]]/route.ts   # Next.js catch-all → Hono handle()
└── lib/api/
    ├── hono.ts                     # Hono app + global middleware + onError
    ├── prisma.ts                   # Prisma singleton + withClub() RLS
    ├── redis.ts                    # Redis singleton s in-memory fallback
    ├── middleware/
    │   ├── auth.middleware.ts      # JWT verify → c.set('user')
    │   ├── club-context.middleware.ts # x-club-id → c.set('clubId')
    │   ├── rbac.middleware.ts      # requireAuth() + requireRole()
    │   └── feature-flag.middleware.ts # requireFeature() + cache
    ├── routes/
    │   ├── auth.routes.ts          # /v1/auth/{login,register,refresh,logout}
    │   ├── me.routes.ts            # /v1/me/{*,context,coach-only}
    │   ├── members.routes.ts       # /v1/members
    │   ├── teams.routes.ts         # /v1/teams
    │   ├── events.routes.ts        # /v1/events (CRUD + RSVP + attendance)
    │   ├── conversations.routes.ts # /v1/conversations (privacy-by-participation)
    │   ├── notifications.routes.ts # /v1/notifications
    │   ├── dashboard.routes.ts     # /v1/dashboard/feed
    │   ├── training-templates.routes.ts
    │   ├── platform-admin.routes.ts
    │   └── health.routes.ts
    └── services/
        ├── auth.service.ts         # issueTokens + refresh rotation
        ├── limits.service.ts       # Level-2 tenant config enforcement
        └── timezone.ts             # native Intl.DateTimeFormat helpers
```

## Rychlý start

```bash
# 1) Služby (DB + Redis) — JEDNOU při startu machiny
open -a "Docker Desktop"   # Nebo "Rancher Desktop"
docker compose up -d

# 2) Env
cp .env.example apps/web/.env  # Next čte .env z root apps/web

# 3) Migrace + seed (při prvním běhu nebo po změně schematu)
pnpm --filter @branik/db run prisma:generate
DATABASE_URL="postgresql://club:club@localhost:5432/club_app?schema=public" \
  pnpm --filter @branik/db exec prisma db push
DATABASE_URL="postgresql://club:club@localhost:5432/club_app?schema=public" \
  pnpm --filter @branik/db run seed

# 4) Contracts build (před prvním dev startem — Next čte dist/)
pnpm --filter @branik/contracts build

# 5) Dev server (port 3100)
pnpm --filter @branik/web run dev
# nebo v Claude Preview přes .claude/launch.json
```

URL:
- Web: http://localhost:3100
- Login: http://localhost:3100/login
- API health: http://localhost:3100/api/v1/health
- API base: http://localhost:3100/api/v1/...

## Dev účty (heslo pro všechny: `password`)

### ABC Braník (primární)
| Role | Email | Jméno |
|---|---|---|
| Owner | `admin@example.com` | Jan Novák |
| Head Coach | `coach@example.com` | Martin Procházka |
| Mom (rodič) | `mom@example.com` | Lucie Pecková |
| Dad (rodič) | `dad@example.com` | Tomáš Mertin |
| Hráč (16 let, multi-role) | `alex@example.com` | Alex Mertin |

V topbaru je DEV **role switcher** (Admin / Coach / Parent) — rychlý přepínač bez odhlašování.

### TJ Spartak Kbely U9 (2. klub, multi-tenant proof)
- `admin@spartak-kbely.example.com` — Vít Mrkvička (Owner)
- Reálný roster z Týmuj (Alex Mertin + 26 hráčů + 4 trenéři)
- Alex Mertin je v **obou klubech** (ukázka multi-tenant)

## Co už je hotové

### Hono API (migrace z NestJS dokončena)
- Auth (JWT access + httpOnly refresh cookie, jose + bcrypt)
- RBAC (ClubRole + TeamRole + GuardianLink permission masks) přes `requireAuth()` / `requireRole()`
- `prisma.withClub(clubId)` RLS wrapper (set_config `app.club_id` per transakce)
- Route groups: `auth`, `me`, `members`, `teams`, `events`, `conversations`, `notifications`, `dashboard`, `training-templates`, `platform-admin`, `health`
- Events + EventAttendance s RSVP
- Conversations (TEAM / COACHES / PARENTS / DM / GROUP / ANNOUNCEMENT), privacy-by-participation
- Notifications model + API (10 typů)
- TrainingTemplate CRUD + generátor Events (idempotentní, `skipDuplicates`)
- Feature flags s Redis cache (60s TTL) + `requireFeature()` middleware

### Frontend (admin)
- Layout s left sidebar + role-aware nav (`useMemberContext`)
- Dashboard: This Week + Needs Attention + Quick Actions + Recent Activity
- Events: list view + calendar view (month grid, Czech lokalizace, today highlight)
- Event detail s RSVP roster tabulkou
- Create Event form (Schedule event)
- Messages: inbox + chat view (bubliny, date separators, optimistic updates)
- Notification bell s dropdownem (per-type icon+color)
- Light + Dark theme, brand Braník modrá globálně
- `/admin/design-preview` — 5 vizuálních směrů k výběru

### Seed data
- 2 kluby s **oddělenými rostery** (žádné překrytí příjmení kromě Alexe)
- Braník: 35 členů, 9 týmů, 48 upcoming events, 14 notifications
- Spartak: 32 členů, U9 tým, training template Út+Čt 16:30 → generované tréninky

## Co zbývá / TOP 15 z Týmuj analýzy

| # | Feature | Status |
|---|---|---|
| 1 | Notification Center | ✅ Hotovo |
| 2 | Calendar view | ✅ Hotovo |
| 3 | Training templates (databáze tréninků) | ✅ BE + DB + seed · ⏳ FE stránka `/admin/training-templates` chybí |
| 4 | Per-tenant customizace (feature flags) | 📋 Architektura hotová, čeká na implementaci |
| 5 | Bulk RSVP | ⏳ |
| 6 | Email/push reminders | ⏳ |
| 7 | Attendance statistiky | ⏳ |
| 8 | Platební přehled | ⏳ |
| 9 | Gallery / media | ⏳ |
| ... | | |

Strategická otázka v řešení: **self-hosted single-tenant** vs. **SaaS multi-tenant** vs. **dual-mode**.

## Práce s agenty

V `.claude/agents/` je 16 subagentů:

```
projektovy-manazer, produktovy-manazer, business-analytik,
ux-designer, ui-designer, brand-designer, copywriter,
softwarovy-architekt, frontend-vyvojar, backend-vyvojar, mobilni-vyvojar,
qa-tester, security-specialista, devops-inzenyr,
marketer, web-designer
```

**Komunikační protokol** (viz `/Users/tm/Documents/Claude/Projects/Company/team/PROTOKOL.md`):
Každý agent končí handoff blokem:
```
---HANDOFF---
OD: <role>
KOMU: <další role | uživatel>
STATUS: hotovo | blokováno | čekám-na-vstup | otázka
VÝSTUP: <cesty k souborům>
DALŠÍ KROK: <co očekává>
---/HANDOFF---
```

**Pracovní výstupy ukládat do `projekty/<slug>/`:**
- `plan.md` — od PM
- `architektura.md` — od architekta
- `prd.md`, `specifikace.md` — od PdM / BA
- atd.

Už existuje:
- `projekty/migrace-hono/plan.md` + `architektura.md` (migrace dokončena)
- `projekty/training-templates/plan.md` + `architektura.md`
- `projekty/per-tenant/architektura.md`

## Klíčové principy

1. **Type safety od A do Z** — Zod kontrakty v `@branik/contracts` jsou single source of truth
2. **Privacy-by-participation** — Dad nevidí konverzaci Mom+Coach i když jsou v stejném klubu
3. **Multi-tenant RLS** — každá DB query musí přes `prisma.withClub(clubId)` nebo explicit `clubId` filter
4. **Handoff mezi agenty** — nikdy bot nevolá bota, PM orchestruje
5. **Soubory jako sdílená paměť** — všechno na disk do `projekty/`
6. **Žádné `if (clubSlug === 'branik')`** — per-klub customizace přes feature flags / config

## User context

- **tomas.mertin@gmail.com** je uživatel/orchestrátor
- Jeho syn **Alex Mertin** (16, narozen 2009-06-12) je hráč v ABC Braník + Spartak Kbely U9
- Matka: **Lucie Pecková** (`mom@`), Otec: **Tomáš Mertin** (`dad@`)
- Jazyk komunikace: Čeština
- Má TOP 15 analýzu konkurence (Týmuj.cz) v `/Users/tm/Documents/Claude/Projects/Company/`

## Důležité poznámky

- **Docker musí běžet** — API bez DB spadne při startu (`PrismaClientInitializationError`). Health endpoint vrátí `db: down`, ostatní endpointy padnou s 500.
- **Next.js načítá .env z `apps/web/.env`** — root `.env` Next ignoruje (monorepo root čte jen Turbo pro globalDependencies)
- **Před prvním dev startem vybuilduj `@branik/contracts`** — package exportuje z `./dist/`, Next bez toho selže na imports
- **sessionStorage klíče pro auth**: `club.access` (JWT) a `club.clubId` (aktivní klub)
- **Žádné komity automatické** — user explicitně řekne "commit"
