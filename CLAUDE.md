# Sport manager — Claude Code Context

> Stav k 2026-05-12. Kompletní SaaS portál — 30+ stránek, 25+ API endpointů, 2 jazyky (cs/en), Stripe, SSE real-time, 81 testů.

---

## Pracovní styl

Při plnění úkolů postupuj přímo k řešení. Neptej se na povolení, pokud to není kriticky nutné pro bezpečnost.

Komunikace **česky**. Kód, enumy, route paths anglicky.

Nikdy:
- Neudělej `git commit` ani `git push` bez toho, abych si o to řekl
- Neudělej `vercel --prod` bez explicitního „nasaď" / „deploy"
- Nemerguj PR autonomně do `main`
- Neaktualizuj `git config`, neforce-pushuj na main, neskipuj hooks

---

## Co je Sport manager

**Veřejný multi-tenant SaaS pro sportovní kluby.** Náhrada za TeamSnap / Spond / Týmuj.cz. Hostuju já (`sport-manager.qawave.ai`), kdokoli si self-service založí klub.

---

## Stack

| Vrstva | Technologie |
|---|---|
| API | **Hono** uvnitř Next.js (catch-all `app/api/[[...route]]`) — single proces |
| Frontend | Next.js 15 App Router + React 19 + TanStack Query + shadcn/ui + Tailwind |
| Font | **Inter** via `next/font/google` |
| Auth | JWT access (jose, 15 min) + httpOnly refresh cookie (30 dní) + bcrypt + auto-refresh na 401 |
| DB (lokál) | PostgreSQL 16 v Dockeru — user/db `branik` |
| DB (prod) | **Neon Postgres** us-east-1 (free tier) |
| Cache | In-memory (Redis fallback, prod bez Redis) |
| Contracts | `@sport-manager/contracts` — Zod schémata sdílená FE/BE |
| Monorepo | pnpm workspaces + turbo |
| Hosting | **Vercel** (`sport-manager.qawave.ai`) |
| Platby | **Stripe Connect** (Express accounts, Checkout sessions, webhooks) |
| Email | **Resend** (console.log fallback bez API key) |
| i18n | Custom hook `useTranslation()` — 2 jazyky (cs/en, stejné jako projekt qawave), 453 klíčů |
| Monitoring | **Sentry** (client + server config, vyžaduje DSN) |
| Testy | Shell-based regression (59 testů) + E2E flow testy (22 testů) |

---

## Struktura monorepa

```
sport-manager/
├── apps/
│   ├── web/              # Next.js 15 (FE + Hono API) — port 3100 v dev
│   ├── mobile/           # Expo (stub)
│   └── workers/          # BullMQ workers (stub)
├── packages/
│   ├── contracts/        # Zod kontrakty (build před prvním použitím)
│   ├── db/               # Prisma schema + migrace + seed
│   └── config/           # sdílené tsconfig presety
├── tests/
│   ├── regression.sh     # 59 API regression testů
│   └── e2e.sh            # 22 E2E flow testů
├── projekty/             # Specifikace (historické)
├── docker-compose.yml    # Postgres + Redis (lokál)
└── CLAUDE.md             # Tento soubor
```

---

## Hono API mapa

```
apps/web/lib/api/
├── hono.ts                     # Hono app + global middleware + onError
├── prisma.ts                   # Prisma singleton + withClub() RLS
├── redis.ts                    # Redis singleton s in-memory fallback
├── middleware/
│   ├── auth.middleware.ts      # JWT verify + public paths
│   ├── club-context.middleware.ts  # x-club-id extraction
│   ├── rbac.middleware.ts      # requireAuth() + requireRole() + requirePlatformAdmin()
│   ├── feature-flag.middleware.ts  # requireFeature()
│   └── rate-limit.middleware.ts    # 100 req/min/IP
├── routes/
│   ├── auth.routes.ts          # login, register, refresh, logout, forgot-password, reset-password
│   ├── me.routes.ts            # /me, /me/context, /me/search, PATCH /me
│   ├── members.routes.ts       # CRUD, invite, status, stats, import CSV
│   ├── teams.routes.ts         # CRUD, detail+roster, stats, attendance-stats, transfer-member
│   ├── events.routes.ts        # CRUD, RSVP, attendance, delete, magic-rsvp-link, qr-token
│   ├── conversations.routes.ts # CRUD, messages, SSE stream
│   ├── notifications.routes.ts # list, unread-count, mark-read, mark-all-read
│   ├── dashboard.routes.ts     # feed (stats, thisWeek, children), activity
│   ├── training-templates.routes.ts # CRUD, regenerate
│   ├── clubs.routes.ts         # create, theme, settings, invite-link, join, archive-season, audit, referral
│   ├── payments.routes.ts      # list, summary
│   ├── stripe.routes.ts        # connect, checkout, webhook
│   ├── rsvp.routes.ts          # GET /rsvp/:token (public magic link)
│   ├── attend.routes.ts        # POST /attend/:token (QR attendance)
│   ├── upload.routes.ts        # POST /upload, PATCH /upload/members/:id/avatar
│   ├── platform-admin.routes.ts # clubs CRUD, analytics
│   └── health.routes.ts        # health check
└── services/
    ├── auth.service.ts         # register, login, refresh, logout, forgotPassword, resetPassword
    ├── email.service.ts        # sendEmail (Resend), rsvpReminderEmail, newEventEmail
    ├── stripe.service.ts       # createConnectedAccount, createCheckoutSession, webhook
    ├── limits.service.ts       # assertMemberLimit, assertTeamLimit
    └── timezone.service.ts     # timezone utilities
```

---

## Frontend stránky

```
apps/web/app/
├── page.tsx                    # Landing page (public)
├── login/page.tsx              # Login s demo účty
├── signup/page.tsx             # 2-step registrace (účet → klub)
├── forgot-password/page.tsx    # Zapomenuté heslo
├── reset-password/page.tsx     # Reset hesla s tokenem
├── join/page.tsx               # Join klub přes invite link
├── k/[slug]/page.tsx           # Veřejná stránka klubu (demo showcase)
├── rsvp/[token]/page.tsx       # Magic link RSVP (bez loginu)
├── attend/[token]/page.tsx     # QR docházka
├── error.tsx                   # Global error boundary
├── icon.svg                    # Favicon (gradient star)
├── manifest.ts                 # PWA manifest
└── (admin)/admin/
    ├── page.tsx                # Dashboard (role-aware: admin/coach/parent)
    ├── onboarding/page.tsx     # 4-step onboarding wizard
    ├── events/                 # List (3 views: seznam/týden/měsíc) + detail + create
    ├── treninky/               # Knihovna 30+ cvičení + drag-to-calendar plánovač
    ├── training-templates/     # Šablony opakujících se tréninků
    ├── members/                # List + detail (stats tab) + invite
    ├── teams/                  # List + detail (roster, heatmap, coach stats) + create
    ├── messages/               # Inbox + chat (SSE real-time)
    ├── notifications/          # Full page s filtry
    ├── payments/               # Přehled plateb (Stripe checkout)
    ├── account/                # Profil, vzhled, theme, klub settings, sezona, Stripe, notif prefs, referral
    ├── activity/               # Timeline dění v klubu
    ├── gallery/                # Galerie stub (feature-flagged)
    ├── audit-log/              # Audit log změn
    └── platform-analytics/     # Platform admin dashboard
```

---

## Komponenty

```
apps/web/components/
├── admin/
│   ├── sidebar.tsx             # Collapsible + mobile drawer
│   ├── topbar.tsx              # Club switcher, search ⌘K, notifications, avatar
│   ├── page-header.tsx         # Reusable page title
│   ├── stat-card.tsx           # Metric card s trendy
│   ├── empty-state.tsx         # Animated empty state
│   ├── notification-bell.tsx   # Dropdown s real-time polling
│   ├── event-calendar.tsx      # Month grid calendar
│   ├── rsvp-bar.tsx            # RSVP progress bar
│   ├── attendance-heatmap.tsx  # GitHub-style grid
│   ├── drill-diagram.tsx       # SVG taktická schémata (30+)
│   ├── drill-video-preview.tsx # Video preview stub
│   └── api-status.tsx          # API health indicator
├── ui/                         # shadcn/ui primitives (card, button, input, badge, ...)
├── command-palette.tsx         # Cmd+K global search
├── language-switcher.tsx       # cs/en přepínač (stejné lokalizace jako qawave)
├── theme-toggle.tsx            # Light/dark switch
├── auth-guard.tsx              # Redirect to login if unauthenticated
├── auth-redirect.tsx           # Redirect to /admin if authenticated
└── query-provider.tsx          # TanStack Query provider
```

---

## Design systém

- **Brand**: Fialovo-modrý gradient (250° → 200°), teal accent (170°)
- **Font**: Inter (next/font)
- **Palette**: `--primary: 250 85% 60%`, `--accent: 170 70% 42%`
- **Shadows**: 5 úrovní (xs/sm/md/lg/xl)
- **Animace**: fade-up, fade-in, scale-in, shimmer, float, pulse-glow
- **Utility classes**: `.mesh-gradient`, `.dot-grid`, `.glass`, `.hover-lift`, `.text-gradient-brand`, `.bg-gradient-brand`
- **Per-klub theming**: 3 barvy (primary/secondary/tertiary) + 10 stylů (Classic, Nordic, Editorial, Glass, Dashboard, Rounded, Sharp, Soft, Bold, Airy)

---

## Rychlý start (lokál)

```bash
open -a "Docker Desktop"
pnpm --filter @sport-manager/contracts build
pnpm --filter @sport-manager/db run prisma:generate
DATABASE_URL="postgresql://branik:branik@localhost:5432/branik?schema=public" \
  pnpm --filter @sport-manager/db exec prisma db push
DATABASE_URL="postgresql://branik:branik@localhost:5432/branik?schema=public" \
  pnpm --filter @sport-manager/db run seed
pnpm --filter @sport-manager/web dev
```

---

## Produkce

| | |
|---|---|
| **URL** | https://sport-manager.qawave.ai |
| **Vercel** | `sport-manager` v týmu `qa-waves-projects` |
| **DB** | Neon Postgres (us-east-1, free tier) |
| **GitHub** | `qa-wave/sport-manager` |
| **CD** | GitHub Actions → Vercel (secrets nastaveny) |

### Deploy

```bash
vercel --prod --yes
```

### Env vars (Vercel)

| Var | Stav |
|---|---|
| `DATABASE_URL` | ✅ Nastaveno |
| `JWT_ACCESS_SECRET` | ✅ |
| `JWT_REFRESH_SECRET` | ✅ |
| `STRIPE_SECRET_KEY` | ⚠️ Potřeba nastavit |
| `STRIPE_WEBHOOK_SECRET` | ⚠️ Potřeba nastavit |
| `RESEND_API_KEY` | ⚠️ Potřeba nastavit |
| `NEXT_PUBLIC_SENTRY_DSN` | ⚠️ Potřeba nastavit |

---

## Login matrix (heslo `heslo123`)

| Email | Role | Co uvidíš |
|---|---|---|
| `admin@hvezda.cz` | OWNER + ADMIN | Kompletní přístup, Stripe connect, audit log |
| `coach@hvezda.cz` | HEAD_COACH | Plánování, attendance, bulk RSVP, coach stats |
| `parent@hvezda.cz` | Rodič (Mom) | Dashboard s dětmi, statistiky dítěte, DM s trenérem |
| `petr.pekar@hvezda.cz` | Rodič (Dad, rozvedený) | **NE**vidí DM, **NE**vidí platby |
| `simon.assist@hvezda.cz` | Multi-role | U15 PLAYER + U13 ASSISTANT_COACH |
| `admin@sokoli.cz` | OWNER (Sokol) | TJ Sokol — florbal |
| `tomas@example.com` | Multi-tenant + multi-club rodič | Hvězda rodič (Anna) + Sokol HEAD_COACH + rodič |
| `platform@example.com` | Platform admin | Platform analytics, cross-club |

---

## Test data (seed)

- **2 kluby**: FC Hvězda Strašnice (fotbal) + TJ Sokol Měcholupy (florbal)
- **66+ uživatelů** s realistickými avatary (pravatar.cc + DiceBear)
- **Full enum coverage**: všechny MemberStatus, ClubRoleType, TeamRole, GuardianRelationship, EventType, etc.
- **Edge cases**: multi-role, multi-tenant, multi-club rodič, rozvedení rodiče, step-parent, legal-guardian

---

## Testy

```bash
# Regression testy (59 testů — API CRUD, auth, RBAC, multi-tenant, error handling)
./tests/regression.sh http://localhost:3100

# E2E flow testy (22 testů — complete user flows)
./tests/e2e.sh http://localhost:3100

# Proti produkci
./tests/regression.sh https://sport-manager.qawave.ai
```

---

## Co je hotové

✅ Landing page + signup + login + forgot password
✅ Dashboard (role-aware: admin/coach/parent portál)
✅ Events (3 calendar views, CRUD, bulk RSVP, bulk attendance, bulk delete)
✅ Training library (30+ cvičení, SVG diagramy, drag-to-calendar plánovač)
✅ Training templates (opakující se tréninky)
✅ Members (CRUD, invite, CSV import/export, status, statistiky, avatar upload)
✅ Teams (CRUD, roster, transfer, attendance heatmap, coach stats)
✅ Messages (chat, DM, SSE real-time, new conversation)
✅ Notifications (bell dropdown + full page)
✅ Payments (Stripe Connect, checkout, webhook)
✅ Per-club theming (3 barvy + 10 stylů)
✅ Club settings (název, timezone, sezóna, archiv)
✅ Auth guard + 401 auto-refresh + magic link RSVP + QR attendance
✅ Self-service signup + onboarding wizard
✅ Public club page `/k/{slug}` (role showcase)
✅ Club switcher (multi-tenant)
✅ Mobile sidebar (hamburger + drawer)
✅ Global search (Cmd+K)
✅ Activity feed (timeline)
✅ Platform analytics (admin dashboard)
✅ Audit log UI
✅ Notification preferences
✅ Referral system
✅ i18n (2 jazyky cs/en — stejné lokalizace jako qawave, 453 klíčů)
✅ Rate limiting (100 req/min/IP)
✅ PWA manifest
✅ Sentry error tracking (config ready)
✅ CD pipeline (GitHub Actions → Vercel)
✅ Regression + E2E testy (81 testů)
✅ Premium design (Inter, gradient brand, mesh bg, animations)
✅ Kompletní čeština (všechny labely)

---

## Co chybí / future

| # | Feature | Status |
|---|---|---|
| 1 | **Pricing page + paywall** | Free/Pro/Enterprise tiery |
| 2 | **AI Liga Sync** | FAČR adapter, auto-import rozpisu |
| 3 | **Mobilní app (Expo)** | Stub existuje v `apps/mobile/` |
| 4 | **Offline mode** | Service Worker cache |
| 5 | **OpenAPI/Swagger docs** | Auto-generated API docs |
| 6 | **Database backup cron** | pg_dump → S3 |
| 7 | **Web push notifications** | Service Worker + push API |
| 8 | **Vercel Blob pro upload** | Místo base64 storage |

---

## Klíčové principy

1. **Type safety** — Zod kontrakty sdílené FE/BE
2. **Privacy-by-participation** — Dad nevidí konverzaci Mom+Coach
3. **Multi-tenant RLS** — `prisma.withClub(clubId, fn)`
4. **Per-tenant customizace** — feature flags + config JSON
5. **Žádné komity/deploy automaticky** — user explicitně řekne
6. **Čeština UI, angličtina kód**

---

## User context

- **tomas.mertin@gmail.com** — produkt owner
- Komunikace: čeština
- Pace: rychlý, preferuje zkratky a jasný status

---

## Důležité poznámky

- **Docker musí běžet** pro lokál
- **`.env` je v `apps/web/`**, ne v rootu
- **Před dev startem**: `pnpm --filter @sport-manager/contracts build`
- **Lokální DB**: `branik:branik@localhost:5432/branik`
- **TypeScript build chyby v UI** (React 19 + @types/react duplicate) suprimované v next.config.ts
- **Vercel deployment protection** — jen `sport-manager.qawave.ai` je public

---

## Užitečné příkazy

```bash
# Produkce
curl -s https://sport-manager.qawave.ai/api/v1/health | jq
vercel --prod --yes
vercel logs sport-manager.qawave.ai --follow

# Lokál
pnpm --filter @sport-manager/web dev
curl -s http://localhost:3100/api/v1/health | jq

# Testy
./tests/regression.sh
./tests/e2e.sh

# Reseed (lokál)
DATABASE_URL="postgresql://branik:branik@localhost:5432/branik?schema=public" \
  pnpm --filter @sport-manager/db run seed

# Build contracts
pnpm --filter @sport-manager/contracts build
```
