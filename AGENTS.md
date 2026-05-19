# Sport manager — Codex Context

> Stav k 2026-05-09. Aktualizováno po Phase A (rebrand), Phase B (full enum seed) a deploy na Neon + Vercel.

---

## Pracovní styl

Při plnění úkolů postupuj přímo k řešení. Pokud potřebuješ použít nástroj, analyzovat data nebo provést výpočet, udělej to rovnou. Neptej se mě na povolení, pokud to není kriticky nutné pro bezpečnost (= akce s blast radiusem na produkci, GitHub repo, tvoji peněženku).

Komunikace **česky**. Kód, enumy, route paths anglicky.

Nikdy:
- Neudělej `git commit` ani `git push` bez toho, abych si o to řekl
- Neudělej `vercel --prod` bez explicitního „nasaď" / „deploy"
- Nemerguj PR autonomně do `main`
- Neaktualizuj `git config`, neforce-pushuj na main, neskipuj hooks

---

## Co je Sport manager

**Veřejný multi-tenant SaaS pro sportovní kluby.** Náhrada za TeamSnap / Spond / Týmuj.cz. Hostuju já (`sport-manager.qawave.ai`), kdokoli si self-service založí klub.

**Killer feature (plánováno):** AI integrace s ligovými API — onboarding wizard najde tým ve FAČR (fotbal first) a stáhne kompletní rozpis. AI volitelně přes lokálního agenta.

**Aktuální stav:** Po migraci NestJS → Hono (PR #1) a rebrand `branik → sport-manager` (PR #2). Produkce běží na Vercelu + Neon Postgres.

---

## Stack

| Vrstva | Technologie |
|---|---|
| API | **Hono** uvnitř Next.js (catch-all `app/api/[[...route]]`) — single proces |
| Frontend | Next.js 15 App Router + React 19 + TanStack Query + shadcn/ui + Tailwind |
| Auth | JWT access (jose, 15 min) + httpOnly refresh cookie (30 dní) + bcrypt |
| DB (lokál) | PostgreSQL 16 v Dockeru — user/db `branik` (Phase A renaming neproběhl pro lokál) |
| DB (prod) | **Neon Postgres** us-east-1 (free tier, auto-suspend po 5 min) |
| Cache (lokál) | Redis 7 v Dockeru — *vyžaduje auth, dev fallback na in-memory* |
| Cache (prod) | **In-memory only** (Redis na prod nenasazený) |
| Contracts | `@sport-manager/contracts` — Zod schémata sdílená FE/BE |
| Monorepo | pnpm workspaces + turbo |
| Hosting | **Vercel** (`sport-manager.qawave.ai` — custom domain bypass SSO protection) |
| AI | Plánováno: lokální agent pro ligový sync + theming z loga |

---

## Struktura monorepa

```
sport-manager/
├── apps/
│   ├── web/              # Next.js 15 (FE + Hono API) — port 3100 v dev
│   ├── mobile/           # Expo (zatím stub)
│   └── workers/          # BullMQ workers (stub)
├── packages/
│   ├── contracts/        # Zod kontrakty (build před prvním použitím)
│   ├── db/               # Prisma schema + migrace + seed
│   └── config/           # sdílené tsconfig presety
├── projekty/             # Specifikace (historické + aktivní)
├── .Codex/agents/       # 16 subagentů
├── docker-compose.yml    # Postgres + Redis (lokál)
├── lovable-brief.md      # Self-contained brief pro Lovable
├── agent-brief.md        # Self-contained brief pro UX/UI design agenty
└── AGENTS.md             # Tento soubor
```

---

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

**Endpoint base:** `/api/v1/*`. Multi-tenant header: `x-club-id: <uuid>`. Middleware `requireAuth()` + `requireRole()` + `requireFeature()`.

---

## Rychlý start (lokál)

```bash
# 1) Docker (Postgres + Redis)
open -a "Docker Desktop"
# kontejnery existují jako infra-branik-postgres-1 a infra-branik-redis-1

# 2) .env v apps/web (NE v rootu — Next.js čte odsud)
cat > apps/web/.env <<'EOF'
DATABASE_URL="postgresql://branik:branik@localhost:5432/branik?schema=public"
REDIS_URL="redis://localhost:6379"
JWT_ACCESS_SECRET="dev-access-secret-change-me"
JWT_REFRESH_SECRET="dev-refresh-secret-change-me"
NODE_ENV="development"
EOF

# POZOR: pokud existuje apps/web/.env.local s old creds (club:club),
#        smaž ho — má precedence před .env

# 3) Build contracts + generate Prisma
pnpm --filter @sport-manager/contracts build
pnpm --filter @sport-manager/db run prisma:generate

# 4) (jednorázově) push schema + seed
DATABASE_URL="postgresql://branik:branik@localhost:5432/branik?schema=public" \
  pnpm --filter @sport-manager/db exec prisma db push
DATABASE_URL="postgresql://branik:branik@localhost:5432/branik?schema=public" \
  pnpm --filter @sport-manager/db run seed

# 5) Dev server (port 3100)
pnpm --filter @sport-manager/web dev
```

URL:
- Web (lokál): http://localhost:3100
- Login: http://localhost:3100/login
- API health: http://localhost:3100/api/v1/health → `{"status":"ok","db":"ok"}`

---

## Produkce

| | |
|---|---|
| **Web URL** | https://sport-manager.qawave.ai |
| **Vercel projekt** | `sport-manager` v týmu `qa-waves-projects` (`prj_yZJQlDviBVf3LLtuAkOFhKtGWeJY`) |
| **Vercel region** | Frankfurt (`fra1`) |
| **DB** | Neon Postgres `ep-rapid-wildflower-aphp19w6` (us-east-1, free tier) |
| **Health** | https://sport-manager.qawave.ai/api/v1/health |
| **GitHub repo** | `qa-wave/sport-manager` |
| **Doména** | `sport-manager.qawave.ai` přes Porkbun DNS, custom domain → Vercel auto-issued cert |

### Deploy na prod (manuální)

```bash
cd /Users/tm/workspaces/projects/sport-manager
git checkout main && git pull
vercel --prod --yes
# CD workflow v .github/workflows/cd.yml NEFUNGUJE — chybí GH secrets
# (VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID); doplnit přes `gh secret set`
```

### Reseed prod DB (destruktivní!)

```bash
cd /Users/tm/workspaces/projects/sport-manager
export $(grep DATABASE_URL_UNPOOLED .env.production | xargs)
DATABASE_URL="$DATABASE_URL_UNPOOLED" \
  pnpm --filter @sport-manager/db exec prisma db push --force-reset --accept-data-loss
DATABASE_URL="$DATABASE_URL_UNPOOLED" \
  pnpm --filter @sport-manager/db run seed
```

---

## Login matrix (lokál i prod, heslo `heslo123` pro všechny)

| Email | Co uvidíš |
|---|---|
| `admin@hvezda.cz` | FC Hvězda OWNER + ADMIN + FINANCE — kompletní přístup |
| `coach@hvezda.cz` | FC Hvězda U13 HEAD_COACH |
| `parent@hvezda.cz` | Mom of Anna (divorced) — vidí DM s trenérem |
| `petr.pekar@hvezda.cz` | Dad of Anna — privacy demo: **NE**vidí DM, **NE**vidí platby |
| `simon.assist@hvezda.cz` | Multi-role: U15 PLAYER + U13 ASSISTANT_COACH |
| `admin@sokoli.cz` | TJ Sokol OWNER |
| `tomas@example.com` | Multi-tenant: Hvězda parent + Sokol HEAD_COACH (přepínač klubů) |
| `platform@example.com` | Platform admin (super-user) |

---

## Test data — co je v seedu (full enum coverage)

**2 fiktivní kluby:**
- **FC Hvězda Strašnice** (fotbal, U13 + U15, modrá `#1e3a8a` + zlatá `#f59e0b`, tier `pro`)
- **TJ Sokol Měcholupy** (florbal, U11, zelená `#16a34a` + oranžová `#ea580c`, tier `free`)

**Pokryto:** všechny enum hodnoty ze schema.prisma (`MemberStatus`, `ClubRoleType`, `TeamRole`, `GuardianRelationship`, `EventType`, `HomeAway`, `RSVPStatus`, `ConversationType`, `WaiverType`, `PaymentStatus`, `NotificationType`).

**Edge cases:** multi-role player, multi-tenant user, divorced parents s permission maskou, step-parent, legal-guardian, unverified guardian, training template + detached event, edited message + soft-deleted message, club feature audit log, push tokens.

**Counts:** 2 clubs · 66 users · 66 members · 3 teams · 41 team memberships · 21 guardian links · 69 events · 667 attendances · 6 conversations · 10 messages · 5 payments · 12 waiver signatures · 10 notifications.

---

## Co je hotové (high-level)

✅ **Hono API kompletní** — auth, RBAC, RLS, all routes
✅ **Frontend kostra** — dashboard, events (list + calendar), members, teams, messages, account
✅ **Multi-tenant** — 2 kluby, role-aware sidebar, role switcher
✅ **Seed** — full enum coverage + edge cases
✅ **Vercel deploy** — `sport-manager.qawave.ai` živá
✅ **Neon DB** — Postgres prod připojený, schema pushnutý, seed aplikovaný

---

## Co chybí (priority-ordered)

| # | Feature | Status |
|---|---|---|
| 1 | **Phase C: Theming UI** | 3-color picker + 10 stylů katalog v `/admin/account → Vzhled` |
| 2 | **Self-service signup** | `/signup` route + onboarding wizard (jméno klubu, sport, kategorie, AI sync) |
| 3 | **Veřejná stránka klubu** | `/k/{slug}` SEO-indexable |
| 4 | **AI Liga Sync** | FAČR adapter first; `findTeam()` + `getFixtures()`; cron sync |
| 5 | **Notification inbox** (full) | Aktuálně jen dropdown v topbaru |
| 6 | **Bulk RSVP** | Coach zaškrtne tým → YES/NO bulk |
| 7 | **Bulk attendance** | Po tréninku — checkboxy 20 dětí, 30 sekund |
| 8 | **GitHub CD secrets** | `VERCEL_TOKEN/ORG_ID/PROJECT_ID` chybí → CD workflow nepojede |
| 9 | **Redis na prod** | Aktuálně in-memory fallback; pro full RLS perf nasadit Upstash |
| 10 | **Vercel SSO bypass na non-custom URLs** | `*-vercel.app` URLs vrací 401 (jen `sport-manager.qawave.ai` je public) |

---

## Strategická rozhodnutí (potvrzená)

1. **Veřejný SaaS, ne self-hosted white-label.** Self-host volitelně, ale není primární distribuce.
2. **Free tier zatím** — žádný billing v MVP.
3. **AI later** — připravit hooky, ale neimplementovat. Možná lokální agent.
4. **Fotbal first** — FAČR adapter první, ostatní svazy potom.
5. **Public API only** — žádný scraping, jen dokumentovaná svazová API.
6. **Brand = Sport manager** napříč git, Vercel, doménou, package names.

---

## Klíčové principy

1. **Type safety od A do Z** — Zod kontrakty v `@sport-manager/contracts`, build před prvním dev startem
2. **Privacy-by-participation** — Dad nevidí konverzaci Mom+Coach, vždy explicit `ConversationParticipant`
3. **Multi-tenant RLS** — každá DB query přes `prisma.withClub(clubId, fn)`, který volá `set_config('app.club_id', ..., true)` v transakci
4. **Per-tenant customizace přes feature flags / config** — žádné `if (clubSlug === '...')` v kódu
5. **Soubory jako sdílená paměť** — výstupy do `projekty/<slug>/`, briefs v rootu
6. **Žádné komity automatické** — user explicitně řekne „commit"
7. **Žádný auto-deploy** — user explicitně řekne „deploy" / „nasaď"

---

## User context

- **tomas.mertin@gmail.com** — produkt owner / orchestrátor
- Komunikace: čeština
- Pace: rychlý, preferuje zkratky a jasný status, neabstraktní

---

## Důležité poznámky / footguns

- **Docker musí běžet** pro lokál — API bez DB spadne
- **Next.js načítá `.env` z `apps/web/`**, ne z rootu repa
- **`apps/web/.env.local` má precedenci nad `.env`** — pokud existuje se starými creds (`club:club`), smaž ho
- **Před prvním dev startem vybuilduj `@sport-manager/contracts`** — package exportuje z `./dist/`
- **Lokální DB je `branik:branik@localhost:5432/branik`** — Phase A renaming proběhl všude *kromě* lokální DB (volume migrace by zabila stávající seed)
- **Prod DB je Neon `neondb_owner`** — credentials v `.env.production` (`vercel env pull`), pooled URL pro app, unpooled URL pro migrace/seed
- **Vercel deployment protection** je `all_except_custom_domains` — direct `*.vercel.app` URLs vrací 401, jen `sport-manager.qawave.ai` je public
- **`projekty/per-tenant/architektura.md`** používá „branik" jako sample slug v anti-pattern code samples — historická ilustrace, neaktuální naming
- **TypeScript build chyby v UI komponentách** (React 19 + @types/react duplicate) jsou suprimované v `next.config.ts` (`ignoreBuildErrors: true`) a `apps/web/typecheck` skriptu (scoped jen na `lib/api/**` přes `tsconfig.api.json`). Nezačínej řešit, pokud na to nejsi explicitně poslán.

---

## Užitečné příkazy

```bash
# Status produkce
curl -s https://sport-manager.qawave.ai/api/v1/health | jq

# Status lokálu
curl -s http://localhost:3100/api/v1/health | jq

# Přihlášení přes API (test)
curl -s -X POST https://sport-manager.qawave.ai/api/v1/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"admin@hvezda.cz","password":"heslo123"}' | jq

# Zobrazit Neon connection string
cd /Users/tm/workspaces/projects/sport-manager && grep DATABASE_URL .env.production | head -1

# Trigger prod redeploy bez kódových změn
cd /Users/tm/workspaces/projects/sport-manager && vercel redeploy --target production

# Otevřít Vercel inspector posledního deploye
cd /Users/tm/workspaces/projects/sport-manager && vercel inspect --yes

# Sledovat live prod logy
cd /Users/tm/workspaces/projects/sport-manager && vercel logs sport-manager.qawave.ai --follow
```

---

## Briefs k dispozici

- **`lovable-brief.md`** (root) — self-contained brief pro Lovable / jiný no-code AI builder
- **`agent-brief.md`** (root) — self-contained brief pro `ux-designer` / `ui-designer` agenty
- **`projekty/`** — historické projekty (migrace-hono, training-templates, per-tenant, design-system, competitor-features)
