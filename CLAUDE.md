# Sport manager — Claude Code Context

## Pracovní styl

Při plnění úkolů postupuj přímo k řešení. Pokud potřebuješ použít nástroj, analyzovat data nebo provést výpočet, udělej to rovnou. Neptej se mě na povolení, pokud to není kriticky nutné pro bezpečnost.

## Co je Sport manager

**Veřejný multi-tenant SaaS pro sportovní kluby** — kalendář, RSVP, attendance, komunikace, platby, tréninkové šablony. Hostuju já (`sport-manager.qawave.ai`), kdokoli si může self-service založit klub. Volitelně lze appku embednout do klubového webu (iframe / widget).

**Killer feature:** AI integrace s ligovými API — onboarding wizard najde tým ve FAČR / ČFbU / ČSLH a stáhne kompletní rozpis (minulé i budoucí zápasy).

**Aktuální fáze:** přechod z původního konceptu (white-label self-hosted pro ABC Braník + Spartak Kbely, kódový název `branik`) na public SaaS. Renaming + reseed + theming probíhá.

## Stack

| Vrstva | Technologie |
|---|---|
| API | **Hono** uvnitř Next.js (catch-all `app/api/[[...route]]`) + Prisma + PostgreSQL (RLS) |
| Frontend | Next.js 15 App Router + React 19 + TanStack Query + shadcn/ui + Tailwind |
| Auth | JWT access (jose) + httpOnly refresh cookie (hono/cookie) + bcrypt |
| DB | PostgreSQL 16 v Dockeru |
| Cache | Redis 7 v Dockeru (in-memory fallback pokud není dostupný) |
| Contracts | `@sport-manager/contracts` — Zod schémata sdílená FE/BE |
| Monorepo | pnpm workspaces + turbo |
| Hosting | Vercel (`sport-manager.qawave.ai`), GitHub Actions CI |
| AI | Plánováno: lokální agent pro ligový sync + theming z loga |

**Single-process:** Web FE + API běží v jednom Next.js procesu.

## Struktura monorepa

```
sport-manager/
├── apps/
│   ├── web/              # Next.js 15 (FE + Hono API) — port 3100 v dev
│   ├── mobile/           # Expo (zatím stub)
│   └── workers/          # BullMQ workers
├── packages/
│   ├── contracts/        # Zod kontrakty
│   ├── db/               # Prisma schema + migrace + seed
│   └── config/           # sdílené tsconfig/eslint presety
├── projekty/             # Specifikace (historické + aktivní)
├── .claude/agents/       # 16 subagentů
├── docker-compose.yml    # Postgres + Redis
└── CLAUDE.md             # Tento soubor
```

## Hono API mapa

```
apps/web/
├── app/api/[[...route]]/route.ts   # Next.js catch-all → Hono handle()
└── lib/api/
    ├── hono.ts                     # Hono app + global middleware + onError
    ├── prisma.ts                   # Prisma singleton + withClub() RLS
    ├── redis.ts                    # Redis singleton s in-memory fallback
    ├── middleware/                 # auth, club-context, rbac, feature-flag
    ├── routes/                     # auth, me, members, teams, events,
    │                               #   conversations, notifications, dashboard,
    │                               #   training-templates, platform-admin, health
    └── services/                   # auth, limits, timezone
```

## Rychlý start

```bash
# 1) Služby (DB + Redis)
open -a "Docker Desktop"
docker compose up -d

# 2) Env
cp .env.example apps/web/.env

# 3) Migrace + seed
pnpm --filter @sport-manager/db run prisma:generate
DATABASE_URL="postgresql://sport_manager:sport_manager@localhost:5432/sport_manager?schema=public" \
  pnpm --filter @sport-manager/db exec prisma db push
DATABASE_URL="postgresql://sport_manager:sport_manager@localhost:5432/sport_manager?schema=public" \
  pnpm --filter @sport-manager/db run seed

# 4) Contracts build
pnpm --filter @sport-manager/contracts build

# 5) Dev server
pnpm --filter @sport-manager/web run dev
```

URL:
- Web (dev): http://localhost:3100
- Web (prod): https://sport-manager.qawave.ai (po DNS propagaci)
- API health: http://localhost:3100/api/v1/health

## Co je hotové

### Hono API (migrace z NestJS dokončena, PR #1 mergnutý)
- Auth (JWT access + httpOnly refresh cookie)
- RBAC (ClubRole + TeamRole + GuardianLink) přes `requireAuth()` / `requireRole()`
- `prisma.withClub(clubId)` RLS wrapper
- Routes: auth, me, members, teams, events (RSVP + attendance), conversations (privacy-by-participation), notifications, dashboard, training-templates, platform-admin, health
- Feature flags s Redis cache + `requireFeature()` middleware

### Frontend
- Layout s left sidebar + role-aware nav, topbar (notification bell, role switcher, theme toggle)
- Dashboard, Events (list + calendar), Event detail s RSVP roster, Create Event
- Members (list + detail), Teams, Messages (inbox + chat)
- Light + Dark theme

### Infra
- Vercel projekt `sport-manager` (team `qa-waves-projects`)
- GitHub repo `qa-wave/sport-manager`
- CI: lint + typecheck + tests + build (vše zelené)
- CD: deploy na Vercel přes `amondnet/vercel-action` (čeká na nastavení `VERCEL_TOKEN` secret v GH)

## Co se právě dělá (aktivní projekty)

| Projekt | Status | Cesta |
|---|---|---|
| Renaming `branik` → `Sport manager` | Probíhá | (není v `projekty/`) |
| Test data wipe + reseed (2 fiktivní kluby) | Plánováno | (Phase B) |
| Theming infra (3 barvy + 10 stylů per klub) | Plánováno | (Phase C) |
| AI Liga Sync (FAČR adapter first) | Plánováno | TBD |
| Self-service signup + onboarding wizard | Plánováno | TBD |
| Public team page (SEO) | Plánováno | TBD |

## Strategická rozhodnutí (potvrzená)

1. **Veřejný SaaS, ne self-hosted white-label.** Self-host volitelně.
2. **Free tier zatím** (žádný billing v MVP).
3. **AI later** — připravit hooky, ale neimplementovat. Možná lokální agent.
4. **Fotbal first** — FAČR adapter první, ostatní svazy potom.
5. **Public API only** — žádný scraping, jen dokumentovaná API.
6. **Brand = Sport manager** napříč git, Vercel, doménou, package names.

## Klíčové principy

1. **Type safety od A do Z** — Zod kontrakty v `@sport-manager/contracts`
2. **Privacy-by-participation** — Dad nevidí konverzaci Mom+Coach
3. **Multi-tenant RLS** — každá DB query přes `prisma.withClub(clubId)`
4. **Per-tenant customizace přes feature flags / config** — žádné `if (clubSlug === '...')` v kódu
5. **Soubory jako sdílená paměť** — všechno na disk do `projekty/`
6. **Žádné komity automatické** — user explicitně řekne "commit"

## User context

- **tomas.mertin@gmail.com** — uživatel/orchestrátor / produkt owner
- Komunikace: čeština
- Reálný klub k dispozici pro user research: ABC Braník (původní pilot, syn Alex, partnerka Lucie)

## Důležité poznámky

- **Docker musí běžet** — API bez DB spadne při startu
- **Next.js načítá `.env` z `apps/web/.env`**
- **Před prvním dev startem vybuilduj `@sport-manager/contracts`** — package exportuje z `./dist/`
- **sessionStorage klíče pro auth**: `club.access` (JWT) a `club.clubId` (aktivní klub)
- **Lokální DB je nově `sport_manager` user/db** (po renamingu z `branik`)
