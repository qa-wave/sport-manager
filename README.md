# Sport manager

> Veřejný multi-tenant SaaS pro sportovní kluby — kalendář, RSVP, attendance, komunikace, platby. Hostuju já, kdokoli si může self-service založit klub.

## Co umíme

- **Kalendář** zápasů a tréninků s RSVP a attendance
- **Komunikace** per tým / role / DM s privacy-by-participation
- **Multi-tenant** — jeden uživatel může být v několika klubech, jeden klub může mít více týmů
- **Privacy** — vlastní účet pro každého rodiče s permission maskou, hráč 16+ s vlastním přístupem
- **AI integrace s ligami** *(plánováno)* — onboarding wizard najde tým a stáhne celý rozpis z FAČR / ČFbU / ČSLH

## Architektura

| Vrstva | Stack |
|---|---|
| Monorepo | Turborepo + pnpm workspaces |
| Web + API | Next.js 15 (App Router) + Hono v catch-all `/api/[[...route]]` |
| Mobile | Expo SDK 52 (zatím stub) |
| Workers | BullMQ |
| Databáze | PostgreSQL 16 + Prisma ORM (Postgres RLS pro tenant isolation) |
| Cache / Queue | Redis 7 |
| Auth | Self-hosted JWT (jose) + httpOnly refresh cookie + bcrypt |
| Hosting | Vercel (`sport-manager.qawave.ai`) |
| Storage | Cloudflare R2 / S3 *(plánováno pro fotky)* |

## Layout

```
sport-manager/
├── apps/
│   ├── web/          # Next.js 15 — admin & coach console + Hono API
│   ├── mobile/       # Expo — Player & Parent (stub)
│   └── workers/      # BullMQ — notifications, reminders
└── packages/
    ├── db/           # Prisma schema + client + seed
    ├── contracts/    # Zod schémata + inferred TS typy (sdílené)
    └── config/       # tsconfig / eslint / prettier presety
```

## Klíčová architektonická rozhodnutí

1. **`User` vs `Member` separation.** `User` je identita (1 řádek per člověk). `Member` je klubový profil. User může být členem více klubů.
2. **Role na vztazích.** `TeamMembership(memberId, teamId, role)` je RBAC join — 16letý hráč může být `PLAYER` na U18 *a* `ASSISTANT_COACH` na U8 současně.
3. **`GuardianLink` nese permission per link.** Dítě může mít víc rodičovských účtů — každý má vlastní `GuardianLink` řádek s vlastní maskou (`canViewPayments`, `canViewMedical`, atd.).
4. **Privacy by participation.** `Conversation` má explicitní `ConversationParticipant` list — rodič vidí jen DMs, kterých je účastníkem.
5. **Multi-tenant by `clubId`.** Každá tabulka s klubovým scope má `clubId`; Postgres Row-Level Security policies vynucují izolaci na DB úrovni.

## Prerequisites

- Node.js 22 LTS (`nvm use`)
- pnpm 9+ (`corepack enable && corepack prepare pnpm@9.12.0 --activate`)
- Docker (pro lokální Postgres + Redis)

## First-time setup

```bash
# 1. Install
pnpm install

# 2. Env
cp .env.example .env
cp .env.example apps/web/.env

# 3. Local infra (Postgres + Redis)
pnpm docker:up

# 4. Generate Prisma client + apply migrations + RLS + seed
pnpm db:generate
pnpm db:migrate
pnpm db:rls
pnpm db:seed
```

## Running

```bash
pnpm dev                              # turbo run dev
# nebo individuálně:
pnpm --filter @sport-manager/web    dev    # http://localhost:3100
pnpm --filter @sport-manager/mobile dev    # Expo Go QR
pnpm --filter @sport-manager/workers dev
```

Health check (public):

```bash
curl http://localhost:3100/api/v1/health
# -> {"status":"ok","db":"ok","ts":"..."}
```

## Deploy

CI běží na GitHub Actions (lint + typecheck + test + build). CD deploy na Vercel přes `amondnet/vercel-action`. Vyžaduje GH secrets:

```bash
gh secret set VERCEL_TOKEN          # https://vercel.com/account/tokens
gh secret set VERCEL_ORG_ID         # team_uVlMvMQ4WwYeNbcPHUkQb9vc
gh secret set VERCEL_PROJECT_ID     # prj_yZJQlDviBVf3LLtuAkOFhKtGWeJY
```

## License

Private.
