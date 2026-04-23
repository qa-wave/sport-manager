# Club App

A multi-tenant sports club management platform — TeamSnap / Spond / XPS class.

> One shared database, radically different UI/UX per role: **Player**, **Parent**, **Coach**, **Club Admin**, **Guest**.

## Architecture

| Layer        | Stack                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Monorepo     | Turborepo + pnpm workspaces                                              |
| Web + API    | Next.js 15 (App Router) + Hono catch-all API — single process            |
| UI           | Tailwind, shadcn/ui, TanStack Query                                      |
| Mobile       | Expo SDK 52 (React Native), Expo Router, NativeWind                      |
| Workers      | BullMQ                                                                   |
| Database     | PostgreSQL 16 + Prisma ORM (Postgres RLS for tenant isolation)           |
| Cache / Queue| Redis 7 (in-memory fallback if unavailable)                              |
| Auth         | jose JWT (access) + httpOnly refresh cookie + bcrypt                     |
| Payments     | Stripe                                                                   |
| Storage      | Cloudflare R2 / S3                                                       |

## Layout

```
branik/
├── apps/
│   ├── web/          # Next.js 15 — admin UI + Hono API in app/api/[[...route]]
│   ├── mobile/       # Expo — Player & Parent
│   └── workers/      # BullMQ — notifications, bulk comms, reminders
└── packages/
    ├── db/           # Prisma schema + client + seed
    ├── contracts/    # Zod schemas + inferred TS types (shared)
    └── config/       # tsconfig / eslint / prettier presets
```

## Key architectural decisions

1. **`User` vs `Member` separation.** `User` is identity (one row per human). `Member` is a club-scoped profile. A user can be a member of many clubs.
2. **Roles live on relationships.** `TeamMembership(memberId, teamId, role)` is the RBAC join — a 16-year-old can be `PLAYER` on U18 *and* `ASSISTANT_COACH` on U8 simultaneously, just by having two rows.
3. **`GuardianLink` carries permissions per link.** Two divorced parents of the same child get two `GuardianLink` rows, each with its own permission mask (`canViewPayments`, `canViewMedical`, etc.).
4. **Privacy by participation.** `Conversation` has an explicit `ConversationParticipant` list — a parent only sees DMs they're a participant of. `Payment.payerId` scopes payment visibility to the actual payer.
5. **Multi-tenant by `clubId`.** Every clubbed table has `clubId`; Postgres Row-Level Security policies enforce isolation at the DB layer.

See `packages/db/prisma/schema.prisma` for the full schema and `packages/db/prisma/seed.ts` for materialized examples of the multi-role and divorced-parent cases.

## Prerequisites

- Node.js 20 LTS (`nvm use`)
- pnpm 9+ (`corepack enable && corepack prepare pnpm@9.12.0 --activate`)
- Docker (for local Postgres + Redis)

## First-time setup

```bash
# 1. Clone & install
pnpm install

# 2. Env
cp .env.example .env

# 3. Local infra (Postgres + Redis)
pnpm docker:up

# 4. Generate Prisma client + apply migrations + RLS policies + seed
pnpm db:generate
pnpm db:migrate    # name the first migration "init" when prompted
pnpm db:rls        # apply Postgres RLS policies (one-time)
pnpm db:seed
```

> **Note on `pnpm db:rls`:** this applies `packages/db/scripts/enable-rls.sql`, which enables Row-Level Security on every clubbed table and adds `USING (clubId = current_setting('app.club_id', true))` policies. It's idempotent — safe to re-run after schema changes. Requires the `psql` client locally.

## Running

```bash
pnpm dev               # turbo run dev — boots web + workers in parallel
# or individually:
pnpm --filter @branik/web     dev    # http://localhost:3000 (serves UI + /api/v1/*)
pnpm --filter @branik/mobile  dev    # Expo Go QR
pnpm --filter @branik/workers dev
```

The Hono API lives inside `apps/web` at `app/api/[[...route]]/route.ts` — no separate server.

## Verification — proving the schema solves the hard cases

After `pnpm db:seed` you should see verification output in your terminal showing:

1. **Multi-role**: Alex appears in U18 as `PLAYER` and U8 as `ASSISTANT_COACH` (two `TeamMembership` rows for the same `memberId`).
2. **Divorced-parent permission mask**: Mom has `payments=true, medical=true, waivers=true`; Dad has all three `false`.
3. **Conversation privacy**: Dad only sees the U8 team chat — *not* the "Coach Doyle & Sarah" DM, because he's not a `ConversationParticipant`.
4. **Payment privacy**: querying payments visible to Dad returns 0 — Mom paid, and Dad's `canViewPayments` is `false`.

You can also poke around interactively:

```bash
pnpm db:studio   # opens Prisma Studio at http://localhost:5555
```

Health check (public):

```bash
curl http://localhost:3000/api/v1/health
# -> {"status":"ok","db":"ok","ts":"..."}
```

### Full auth + RBAC smoke test

Once seeded, prove the auth + RBAC stack works end-to-end:

```bash
# 1. Get the seeded admin's clubId from Prisma Studio (or psql) — store it:
CLUB_ID="<club id from FC Rivertown>"

# 2. Register a brand-new user
curl -i -c cookies.txt -X POST http://localhost:3000/api/v1/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"tester@example.com","password":"hunter22!","firstName":"Test","lastName":"User"}'
# -> 201 Created, body: {"accessToken":"eyJ..."}, Set-Cookie: club_rt=...

ACCESS="<paste accessToken from above>"

# 3. /me works (any authenticated user, no club scope)
curl http://localhost:3000/api/v1/me -H "authorization: Bearer $ACCESS"
# -> 200 with user identity

# 4. /me/context fails — the new user has no Member row in this club
curl -i http://localhost:3000/api/v1/me/context \
  -H "authorization: Bearer $ACCESS" \
  -H "x-club-id: $CLUB_ID"
# -> 403 Forbidden ("Not a member of this club")

# 5. Log in as the seeded head coach instead (email: coach@example.com)
#    — but the seed doesn't set a password, so you'd need to either
#    (a) run a quick update in Prisma Studio to bcrypt-hash a password,
#    or (b) extend the seed to set passwordHash for test users.

# 6. After logging in as coach, /me/coach-only returns 200; as a plain
#    player or parent, it returns 403.
curl http://localhost:3000/api/v1/me/coach-only \
  -H "authorization: Bearer $COACH_ACCESS" \
  -H "x-club-id: $CLUB_ID"
# -> 200 { ok: true, clubRoles: [...], teamRoles: [{teamId, role:'HEAD_COACH'}, ...] }
```

### RLS smoke test

With RLS enabled, prove tenant isolation at the DB layer:

```bash
psql "$DATABASE_URL"

-- No club set -> no rows (fail-safe)
SELECT count(*) FROM "Member";
-- -> 0

-- Set a real club -> only that club's members
SET LOCAL app.club_id = '<club id>';
SELECT count(*) FROM "Member";
-- -> 6 (for seeded FC Rivertown)

-- A fake club -> still 0
SET LOCAL app.club_id = 'not-a-real-club-id';
SELECT count(*) FROM "Member";
-- -> 0
```

## Roadmap (deferred from MVP)

- Coach → player evaluations
- Facility scheduling (`Facility`, `Booking`)
- Tactic boards / playbook uploads
- Match stats / scorekeeping
- Training plans / drill library
- Email-based invite & onboarding flow
- Stripe Connect for clubs (per-club payouts)

## License

Private.
