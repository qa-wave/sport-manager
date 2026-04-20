# branik — Claude Code Context

## Pracovní styl

Při plnění úkolů postupuj přímo k řešení. Pokud potřebuješ použít nástroj, analyzovat data nebo provést výpočet, udělej to rovnou. Neptej se mě na povolení, pokud to není kriticky nutné pro bezpečnost.

Aplikace pro řízení sportovních klubů (trénink, eventy, RSVP, komunikace, platby). Stavěno pro ABC Braník + TJ Spartak Kbely, potenciálně **self-hostable white-label** pro libovolný klub.

## Stack

| Vrstva | Technologie |
|---|---|
| Backend | NestJS + Fastify + Prisma + PostgreSQL (RLS) |
| Frontend | Next.js 15 App Router + React 19 + TanStack Query + shadcn/ui + Tailwind |
| DB | PostgreSQL 16 v Dockeru (`club-postgres`) |
| Cache | Redis 7 v Dockeru (`club-redis`) |
| Contracts | `@branik/contracts` — Zod schémata sdílená FE/BE |
| Monorepo | pnpm workspaces + turbo |
| Theme | light/dark přes `next-themes`, brand modrá ABC Braník `#609bc6` (HSL `205 47% 55%`) |

## Struktura monorepa

```
branik/
├── apps/
│   ├── api/              # NestJS backend (port 3001)
│   └── web/              # Next.js web (port 3100)
├── packages/
│   ├── contracts/        # Zod kontrakty (FE i BE je importují)
│   └── db/               # Prisma schema + migrace + seed
├── projekty/             # Specifikace feature z agentů (plan.md, architektura.md)
├── .claude/
│   ├── agents/           # 16 subagentů (PM, architect, FE, BE ...)
│   ├── launch.json       # Claude Preview config (web + api)
│   └── settings.local.json
├── docker-compose.yml    # Postgres + Redis
└── CLAUDE.md             # Tento soubor
```

## Rychlý start

```bash
# 1) Služby (DB + Redis) — JEDNOU při startu machiny
open -a "Docker Desktop"   # Nebo "Rancher Desktop"
docker compose up -d

# 2) Migrace + seed (při prvním běhu nebo po změně schematu)
DATABASE_URL="postgresql://club:club@localhost:5432/club_app?schema=public" \
  pnpm --filter @branik/db exec npx prisma db push

DATABASE_URL="postgresql://club:club@localhost:5432/club_app?schema=public" \
  pnpm --filter @branik/db exec npx tsx prisma/seed.ts

# 3) Backend (port 3001)
pnpm --filter @branik/api run dev
# nebo v Claude Preview přes .claude/launch.json

# 4) Frontend (port 3100)
pnpm --filter @branik/web run dev
# nebo v Claude Preview přes .claude/launch.json
```

URL:
- Web: http://localhost:3100
- Login: http://localhost:3100/login
- API health: http://localhost:3001/health

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

### Backend
- Auth (JWT access + httpOnly refresh cookie)
- RBAC (ClubRole + TeamRole + GuardianLink permission masks)
- `prisma.withClub(clubId)` RLS wrapper
- Moduly: `auth`, `members`, `teams`, `events`, `dashboard`, `conversations`, `notifications`, `training-templates`
- Events + EventAttendance s RSVP
- Conversations (TEAM / COACHES / PARENTS / DM / GROUP / ANNOUNCEMENT), privacy-by-participation
- Notifications model + service + API (10 typů)
- **TrainingTemplate** model + generátor Events (idempotentní, `skipDuplicates`)

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

Strategická otázka v řešení: **self-hosted single-tenant** vs. **SaaS multi-tenant** vs. **dual-mode**. Viz poslední zpráva uživatele.

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

## Dulezite poznámky

- **Docker musí běžet** — API bez DB spadne při startu (`PrismaClientInitializationError`)
- **Port 3001 obsazen jinou appkou** — občas na `:3001` startuje `/Users/tm/workspaces/projects/fedicfinance-app` (jiný projekt) — zabij ho (`lsof -i :3001` → `kill`) nebo v tom projektu vypni autoport
- **sessionStorage klíče pro auth**: `club.access` (JWT) a `club.clubId` (aktivní klub)
- **Žádné komity automatické** — user explicitně řekne "commit"
