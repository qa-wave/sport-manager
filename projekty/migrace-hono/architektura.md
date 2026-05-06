# Technický návrh: Migrace NestJS → Hono v Next.js
**Od:** Softwarový architekt
**Pro:** Frontend vývojář, Backend vývojář, DevOps
**Datum:** 2026-04-18
**Projekt:** branik — konsolidace API do Next.js serveru

---

## 1. Přehled a motivace

### Co chceme dosáhnout
Aktuálně běží dva separátní Node.js procesy:
- `apps/api` — NestJS + Fastify na portu 3001
- `apps/web` — Next.js na portu 3000 (nebo 3100)

Cílem je sloučit oba do **jednoho Next.js serveru** s Hono jako API routerem. Expo mobilní app i webový klient budou volat stejné endpointy.

### Proč Hono (a ne Next.js Route Handlers přímo)
Next.js Route Handlers jsou dobré pro pár endpointů, ale pro 11 modulů s middleware chainem by vznikl chaos. Hono přináší:
- **Typovaný router** s `.use()` middleware stacking (identický konceptuální model jako Express/Fastify)
- **Context propagaci** — `c.set('user', ...)` / `c.get('user')` nahrazuje `req.user`, `req.member`
- **Hono/zod-validator** — validace requestů v jednom kroku
- **Edge-ready** — potenciálně nasaditelné na Vercel Edge v budoucnu
- **Catch-all Next.js route** — jeden soubor `app/api/[[...route]]/route.ts` bez boilerplate per-endpoint

### Co se NEMĚNÍ
- `@sport-manager/contracts` — nula změn, Zod schémata sdílíme beze změny
- `@sport-manager/db` — nula změn, PrismaClient + `withClub()` wrapper zůstávají identické
- Databázové schéma, migrace, seed — nedotkneme se
- REST API URL struktura — `/api/v1/...` zůstane kompatibilní s FE i mobilem
- Autentizační flow — JWT access token v paměti + httpOnly refresh cookie

---

## 2. Cílová architektura

### High-level diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        apps/web (Next.js 15)                        │
│                                                                     │
│  ┌─────────────────────────┐    ┌──────────────────────────────┐   │
│  │   App Router (React)    │    │   app/api/[[...route]]/      │   │
│  │   /admin/...            │    │   route.ts                   │   │
│  │   /login                │    │                              │   │
│  │   TanStack Query        │───▶│   Hono app                   │   │
│  └─────────────────────────┘    │   └─ authMiddleware           │   │
│                                 │   └─ clubContextMiddleware    │   │
│                                 │   └─ rbacMiddleware           │   │
│                                 │   └─ featureFlagMiddleware    │   │
│                                 │                              │   │
│                                 │   Route groups:              │   │
│                                 │   /v1/auth/*                 │   │
│                                 │   /v1/me/*                   │   │
│                                 │   /v1/events/*               │   │
│                                 │   /v1/conversations/*        │   │
│                                 │   /v1/notifications/*        │   │
│                                 │   /v1/members/*              │   │
│                                 │   /v1/teams/*                │   │
│                                 │   /v1/dashboard/*            │   │
│                                 │   /v1/training-templates/*   │   │
│                                 │   /v1/platform-admin/*       │   │
│                                 │   /v1/health                 │   │
│                                 └──────────────────────────────┘   │
│                                          │                         │
│                                          ▼                         │
│                            ┌─────────────────────────┐            │
│                            │     lib/api/             │            │
│                            │   prisma.ts (singleton)  │            │
│                            │   redis.ts  (singleton)  │            │
│                            │   auth-service.ts        │            │
│                            │   rbac-service.ts        │            │
│                            │   features-service.ts    │            │
│                            └─────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
                 │                              │
                 ▼                              ▼
    PostgreSQL 16 (Docker)            Redis 7 (Docker)
    @sport-manager/db / Prisma                 feature flag cache
```

### Typ architektury
**Modulární monolit v Next.js** — jeden proces, jeden deploy, logicky separované route skupiny.

Zdůvodnění: Microservices by přinesly distribuovanou komplexitu bez benefitu v tomto stádiu projektu (stovky, ne statisíce uživatelů). Next.js standalone server s Hono je identický výkon jako NestJS/Fastify pro tento workload.

---

## 3. File structure

### Nová struktura v `apps/web`

```
apps/web/
├── app/
│   ├── api/
│   │   └── [[...route]]/
│   │       └── route.ts          # Catch-all — předá vše Hono
│   ├── (admin)/
│   │   └── admin/...             # React UI (beze změny)
│   └── login/
│       └── page.tsx              # (beze změny)
│
└── lib/
    ├── api/
    │   ├── hono.ts               # Hono app instance + mount všech routerů
    │   ├── prisma.ts             # PrismaClient singleton
    │   ├── redis.ts              # Redis/in-memory cache singleton
    │   │
    │   ├── middleware/
    │   │   ├── auth.middleware.ts        # JWT verifikace → c.set('user', ...)
    │   │   ├── club-context.middleware.ts # x-club-id → c.set('clubId', ...)
    │   │   ├── rbac.middleware.ts        # Resolve MemberContext → c.set('member', ...)
    │   │   └── feature-flag.middleware.ts # @requireFeature helper
    │   │
    │   ├── services/
    │   │   ├── auth.service.ts           # Přeneseno z NestJS beze změny logiky
    │   │   ├── rbac.service.ts           # resolve() + check() + canActOnBehalfOf()
    │   │   ├── features.service.ts       # getState() + invalidate() + Redis
    │   │   ├── events.service.ts
    │   │   ├── conversations.service.ts
    │   │   ├── notifications.service.ts
    │   │   ├── members.service.ts
    │   │   ├── teams.service.ts
    │   │   ├── dashboard.service.ts
    │   │   ├── training-templates.service.ts
    │   │   └── platform-admin.service.ts
    │   │
    │   └── routes/
    │       ├── auth.routes.ts
    │       ├── me.routes.ts
    │       ├── events.routes.ts
    │       ├── conversations.routes.ts
    │       ├── notifications.routes.ts
    │       ├── members.routes.ts
    │       ├── teams.routes.ts
    │       ├── dashboard.routes.ts
    │       ├── training-templates.routes.ts
    │       ├── platform-admin.routes.ts
    │       └── health.routes.ts
    │
    └── types/
        └── hono.ts               # Hono Env typy (Variables, Bindings)
```

---

## 4. Catch-all route a Hono mount

### `app/api/[[...route]]/route.ts`

```typescript
import { handle } from 'hono/vercel'
import { app } from '@/lib/api/hono'

// Next.js vyžaduje export named HTTP metod.
// Hono handle() obalí celou Hono aplikaci do Next.js-kompatibilního handleru.
export const GET = handle(app)
export const POST = handle(app)
export const PUT = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)
export const OPTIONS = handle(app)

// DŮLEŽITÉ: Next.js musí vědět, že tato route je dynamic.
// Bez toho by se pokoušel staticky pre-renderovat.
export const dynamic = 'force-dynamic'
```

### `lib/api/hono.ts`

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { logger } from 'hono/logger'
import { authMiddleware } from './middleware/auth.middleware'
import { clubContextMiddleware } from './middleware/club-context.middleware'
import type { HonoEnv } from '@/lib/types/hono'

// Route importy
import { authRoutes } from './routes/auth.routes'
import { meRoutes } from './routes/me.routes'
import { eventsRoutes } from './routes/events.routes'
import { conversationsRoutes } from './routes/conversations.routes'
import { notificationsRoutes } from './routes/notifications.routes'
import { membersRoutes } from './routes/members.routes'
import { teamsRoutes } from './routes/teams.routes'
import { dashboardRoutes } from './routes/dashboard.routes'
import { trainingTemplatesRoutes } from './routes/training-templates.routes'
import { platformAdminRoutes } from './routes/platform-admin.routes'
import { healthRoutes } from './routes/health.routes'

export const app = new Hono<HonoEnv>().basePath('/api')

// ---- Globální middleware (pořadí záleží) ----

// 1. Logging
app.use('*', logger())

// 2. Security headers (analogie @fastify/helmet)
app.use('*', secureHeaders())

// 3. CORS — povolíme web origin + Expo
app.use('*', cors({
  origin: [
    process.env.WEB_ORIGIN ?? 'http://localhost:3000',
    'http://localhost:3100',
    'http://localhost:19006', // Expo web
  ],
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization', 'X-Club-Id'],
}))

// 4. Club context z headeru/path paramu — běží vždy, i pro /auth/*
app.use('*', clubContextMiddleware)

// 5. JWT auth — nastaví c.var.user pokud Bearer token platný
//    Veřejné endpointy (auth/*) nepotřebují user, middleware to přeskočí
app.use('/v1/*', authMiddleware)

// ---- Route skupiny ----
app.route('/v1/auth', authRoutes)
app.route('/v1/me', meRoutes)
app.route('/v1/events', eventsRoutes)
app.route('/v1/conversations', conversationsRoutes)
app.route('/v1/notifications', notificationsRoutes)
app.route('/v1/members', membersRoutes)
app.route('/v1/teams', teamsRoutes)
app.route('/v1/dashboard', dashboardRoutes)
app.route('/v1/training-templates', trainingTemplatesRoutes)
app.route('/v1/platform-admin', platformAdminRoutes)
app.route('', healthRoutes)

// ---- Globální error handler ----
app.onError((err, c) => {
  console.error(err)

  if (err instanceof ZodError) {
    return c.json({ success: false, error: 'Validation error', details: err.flatten() }, 400)
  }

  // Mapování known error kódů na HTTP status
  const statusMap: Record<string, number> = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
  }

  const status = (err as any).code && statusMap[(err as any).code]
    ? statusMap[(err as any).code] as 401 | 403 | 404 | 409
    : 500

  return c.json(
    { success: false, error: err.message ?? 'Internal server error' },
    status,
  )
})
```

---

## 5. Typy — HonoEnv

### `lib/types/hono.ts`

```typescript
import type { AuthenticatedUser } from '@sport-manager/contracts'
import type { MemberContext } from '@/lib/api/services/rbac.service'

/**
 * Hono Variables jsou type-safe context values.
 * c.set('user', ...) a c.get('user') jsou plně typované.
 *
 * Analogie k NestJS: req.user, req.member, req.clubId.
 */
export type HonoVariables = {
  user: AuthenticatedUser           // nastaveno authMiddleware (pokud přihlášen)
  member: MemberContext             // nastaveno rbacMiddleware po resolve()
  clubId: string                    // nastaveno clubContextMiddleware
}

export type HonoEnv = {
  Variables: HonoVariables
  // Bindings: {} — pro Cloudflare Workers (zatím prázdné)
}
```

---

## 6. Middleware chain — detailní implementace

### 6.1 Auth middleware

```typescript
// lib/api/middleware/auth.middleware.ts
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import { jwtVerify } from 'jose'
import { prisma } from '@/lib/api/prisma'
import type { HonoEnv } from '@/lib/types/hono'
import type { JwtAccessPayload } from '@/lib/api/services/auth.service'

// Set of path prefixes that nevyžadují auth.
// Přidej sem každý public endpoint.
const PUBLIC_PATHS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/health',
])

export const authMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  const path = new URL(c.req.url).pathname

  // Public path — přeskočíme, user zůstane nenastavený
  if (PUBLIC_PATHS.has(path)) {
    return next()
  }

  const authHeader = c.req.header('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new HTTPException(401, { message: 'Missing access token' })
  }

  const token = authHeader.slice(7)

  let payload: JwtAccessPayload
  try {
    const secret = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET!)
    const { payload: p } = await jwtVerify(token, secret)
    payload = p as unknown as JwtAccessPayload
  } catch {
    throw new HTTPException(401, { message: 'Invalid or expired access token' })
  }

  // Ověříme, že user stále existuje (stejná logika jako NestJS JwtStrategy)
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true },
  })
  if (!user) {
    throw new HTTPException(401, { message: 'User not found' })
  }

  c.set('user', user)
  return next()
})
```

**Poznámka k jose vs jsonwebtoken:** Používáme `jose` místo `jsonwebtoken`, protože jose je ESM-first a funguje v Edge Runtime. jsonwebtoken závisí na Node.js `crypto` a v Edge padá. Pokud zůstaneme na Node.js runtime (standalone Next.js), obojí funguje — ale jose je budoucnost.

### 6.2 Club context middleware

```typescript
// lib/api/middleware/club-context.middleware.ts
import { createMiddleware } from 'hono/factory'
import type { HonoEnv } from '@/lib/types/hono'

export const clubContextMiddleware = createMiddleware<HonoEnv>(async (c, next) => {
  // Resolution order: header > path param > nic
  const fromHeader = c.req.header('X-Club-Id')
  const fromParam = c.req.param('clubId')  // definováno v route pokud relevantní

  const clubId = fromHeader || fromParam || undefined
  if (clubId) {
    c.set('clubId', clubId)
  }

  return next()
})
```

### 6.3 RBAC middleware — factory funkce

```typescript
// lib/api/middleware/rbac.middleware.ts
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { ClubRoleType, TeamRole } from '@sport-manager/db'
import type { HonoEnv } from '@/lib/types/hono'
import { rbacService } from '@/lib/api/services/rbac.service'

/**
 * requireAuth() — ověří přihlášení + vyřeší MemberContext.
 * Nahrazuje RolesGuard z NestJS.
 *
 * Použití v route:
 *   eventsRoute.get('/', requireAuth(), requireRole('ADMIN', 'HEAD_COACH'), handler)
 *
 * Nebo jen ověření přihlášení bez role check:
 *   meRoute.get('/', requireAuth(), handler)
 */
export const requireAuth = () =>
  createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get('user')
    if (!user) {
      throw new HTTPException(401, { message: 'Authentication required' })
    }

    const clubId = c.get('clubId')
    if (!clubId) {
      // Endpoint nevyžaduje club scope (např. GET /me) — povolíme
      return next()
    }

    const member = await rbacService.resolve(user.id, clubId)
    if (!member) {
      throw new HTTPException(403, { message: 'Not a member of this club' })
    }

    c.set('member', member)
    return next()
  })

/**
 * requireRole(...roles) — musí běžet PO requireAuth().
 * Checkuje ClubRole nebo TeamRole (stejná logika jako RolesGuard.check()).
 */
export const requireRole = (...roles: Array<ClubRoleType | TeamRole>) =>
  createMiddleware<HonoEnv>(async (c, next) => {
    if (roles.length === 0) return next()

    const member = c.get('member')
    if (!member) {
      throw new HTTPException(401, { message: 'Member context missing' })
    }

    const teamId = c.req.param('teamId')
    const ok = rbacService.check(member, roles, { teamId })
    if (!ok) {
      throw new HTTPException(403, { message: 'Insufficient role' })
    }

    return next()
  })
```

### 6.4 Feature flag middleware

```typescript
// lib/api/middleware/feature-flag.middleware.ts
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'
import type { FeatureKey } from '@sport-manager/contracts'
import type { HonoEnv } from '@/lib/types/hono'
import { featuresService } from '@/lib/api/services/features.service'

/**
 * requireFeature('messages') — vrátí 404 pokud klub nemá feature enabled.
 * 404 (ne 403) — nechceme prozradit, že feature existuje.
 *
 * Analogie k @RequireFeature() decoratoru z NestJS + FeaturesGuard.
 */
export const requireFeature = (feature: FeatureKey) =>
  createMiddleware<HonoEnv>(async (c, next) => {
    const clubId = c.get('member')?.clubId ?? c.get('clubId')
    if (!clubId) {
      throw new HTTPException(404)
    }

    const flags = await featuresService.getFeatures(clubId)
    if (!flags[feature]) {
      throw new HTTPException(404) // 404 on purpose — neadvertisovat existenci
    }

    return next()
  })
```

---

## 7. Příklad kompletní route skupiny — Events

```typescript
// lib/api/routes/events.routes.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CreateEventInput, UpdateEventInput, RsvpInput, MarkAttendanceInput } from '@sport-manager/contracts'
import { requireAuth, requireRole } from '@/lib/api/middleware/rbac.middleware'
import { eventsService } from '@/lib/api/services/events.service'
import { trainingTemplatesService } from '@/lib/api/services/training-templates.service'
import type { HonoEnv } from '@/lib/types/hono'

export const eventsRoutes = new Hono<HonoEnv>()

// GET /v1/events
eventsRoutes.get(
  '/',
  requireAuth(),
  async (c) => {
    const me = c.get('member')
    const { from, to, teamId } = c.req.query()
    const data = await eventsService.listEvents(me.clubId, { from, to, teamId })
    return c.json({ success: true, data })
  }
)

// GET /v1/events/:eventId
eventsRoutes.get(
  '/:eventId',
  requireAuth(),
  async (c) => {
    const me = c.get('member')
    const data = await eventsService.getEventDetail(me.clubId, c.req.param('eventId'))
    return c.json({ success: true, data })
  }
)

// POST /v1/events
eventsRoutes.post(
  '/',
  requireAuth(),
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'),
  zValidator('json', CreateEventInput),
  async (c) => {
    const me = c.get('member')
    const input = c.req.valid('json')
    const data = await eventsService.createEvent(me.clubId, me.memberId, input)
    return c.json({ success: true, data }, 201)
  }
)

// PATCH /v1/events/:eventId
eventsRoutes.patch(
  '/:eventId',
  requireAuth(),
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  zValidator('json', UpdateEventInput),
  async (c) => {
    const me = c.get('member')
    const input = c.req.valid('json')
    const data = await eventsService.updateEvent(me.clubId, c.req.param('eventId'), input)
    return c.json({ success: true, data })
  }
)

// POST /v1/events/:eventId/rsvp
eventsRoutes.post(
  '/:eventId/rsvp',
  requireAuth(),
  zValidator('json', RsvpInput.omit({ eventId: true })),
  async (c) => {
    const me = c.get('member')
    const body = c.req.valid('json')
    const data = await eventsService.submitRsvp(
      me,
      c.req.param('eventId'),
      body.memberId,
      body.status,
      body.note,
    )
    return c.json({ success: true, data })
  }
)

// PATCH /v1/events/:eventId/attendance
eventsRoutes.patch(
  '/:eventId/attendance',
  requireAuth(),
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH'),
  zValidator('json', MarkAttendanceInput),
  async (c) => {
    const me = c.get('member')
    const { attendances } = c.req.valid('json')
    const data = await eventsService.markAttendance(me.clubId, c.req.param('eventId'), attendances)
    return c.json({ success: true, data })
  }
)

// POST /v1/events/:eventId/detach
eventsRoutes.post(
  '/:eventId/detach',
  requireAuth(),
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'TEAM_MANAGER'),
  async (c) => {
    const me = c.get('member')
    const data = await trainingTemplatesService.detachEvent(me, c.req.param('eventId'))
    return c.json({ success: true, data })
  }
)
```

---

## 8. Auth routes — cookie handling

```typescript
// lib/api/routes/auth.routes.ts
import { Hono } from 'hono'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { zValidator } from '@hono/zod-validator'
import { LoginInput, RegisterInput } from '@sport-manager/contracts'
import { authService } from '@/lib/api/services/auth.service'
import type { HonoEnv } from '@/lib/types/hono'

const REFRESH_COOKIE = 'club_rt'
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'Lax' as const,
  path: '/',
  maxAge: 30 * 24 * 60 * 60,
}

export const authRoutes = new Hono<HonoEnv>()

authRoutes.post('/register', zValidator('json', RegisterInput), async (c) => {
  const dto = c.req.valid('json')
  const tokens = await authService.register(dto, {
    ip: c.req.header('X-Forwarded-For') ?? c.req.header('CF-Connecting-IP'),
    userAgent: c.req.header('User-Agent'),
  })

  setCookie(c, REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS)
  return c.json({ success: true, data: { accessToken: tokens.accessToken } }, 201)
})

authRoutes.post('/login', zValidator('json', LoginInput), async (c) => {
  const dto = c.req.valid('json')
  const tokens = await authService.login(dto, {
    ip: c.req.header('X-Forwarded-For'),
    userAgent: c.req.header('User-Agent'),
  })

  setCookie(c, REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS)
  return c.json({ success: true, data: { accessToken: tokens.accessToken } })
})

authRoutes.post('/refresh', async (c) => {
  const rt = getCookie(c, REFRESH_COOKIE)
  if (!rt) {
    return c.json({ success: false, error: 'Missing refresh token' }, 400)
  }

  const tokens = await authService.refresh(rt, {
    ip: c.req.header('X-Forwarded-For'),
    userAgent: c.req.header('User-Agent'),
  })

  setCookie(c, REFRESH_COOKIE, tokens.refreshToken, COOKIE_OPTIONS)
  return c.json({ success: true, data: { accessToken: tokens.accessToken } })
})

authRoutes.post('/logout', async (c) => {
  const rt = getCookie(c, REFRESH_COOKIE)
  await authService.logout(rt)
  deleteCookie(c, REFRESH_COOKIE, { path: '/' })
  return c.body(null, 204)
})
```

**Proč hono/cookie a ne @fastify/cookie:** Hono má vlastní cookie utilitu, která funguje nad Web Standard Request/Response. Fastify cookies fungují na Fastify requestu, který v Next.js není k dispozici.

---

## 9. Prisma singleton — řešení pro Next.js

### Problém
Next.js v dev módu (hot reload) opakovaně importuje moduly → vznikají stovky PrismaClient instancí → wyczerpání connection poolu.

### Řešení — global singleton pattern

```typescript
// lib/api/prisma.ts
import { PrismaClient, Prisma } from '@sport-manager/db'

/**
 * PrismaClient singleton bezpečný pro Next.js hot reload.
 *
 * V produkci se modul importuje jen jednou — žádný globální trick.
 * V dev Next.js hot reloads modul znova, takže vyrábíme nové instance.
 * globalThis.prisma udrží jednu instanci přes hot reloady.
 *
 * V serverless prostředí (Vercel Functions) každý invocation může dostat
 * novou instanci — to je OK, pool má maxConnections = 1 (PgBouncer před DB).
 */
const globalForPrisma = globalThis as unknown as {
  _clubPrisma: ClubPrismaClient | undefined
}

class ClubPrismaClient extends PrismaClient {
  /**
   * Identická implementace jako apps/api/src/prisma/prisma.service.ts
   * — žádná změna logiky RLS.
   */
  async withClub<T>(
    clubId: string,
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.club_id', ${clubId}, true)`
      return fn(tx)
    })
  }
}

export const prisma =
  globalForPrisma._clubPrisma ??
  (globalForPrisma._clubPrisma = new ClubPrismaClient())

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma._clubPrisma = prisma
}
```

### Standalone server vs. serverless
Pokud nasadíme Next.js jako `output: 'standalone'` (doporučeno pro self-hosted):
- Jeden perzistentní Node.js proces
- Connection pool funguje stejně jako v NestJS
- `globalThis` trick není potřeba, ale nevadí

Pokud nasadíme na Vercel (serverless functions):
- Každý invocation může být nová instance
- Doporučení: přidat `pgBouncer` nebo použít Prisma Accelerate jako connection pooler

---

## 10. Redis singleton

```typescript
// lib/api/redis.ts
import Redis from 'ioredis'

/**
 * Stejná logika jako apps/api/src/features/redis-cache.service.ts
 * — in-memory fallback pokud REDIS_URL není nastavena.
 */

type Entry = { value: string; expiresAt: number }

class CacheService {
  private client: Redis | null = null
  private memory = new Map<string, Entry>()
  private usingFallback = true

  constructor() {
    const url = process.env.REDIS_URL
    if (!url) {
      console.warn('[cache] REDIS_URL not set — using in-memory fallback')
      return
    }
    try {
      this.client = new Redis(url, { maxRetriesPerRequest: 2, lazyConnect: false })
      this.client.on('error', () => { this.usingFallback = true })
      this.client.on('connect', () => { this.usingFallback = false })
    } catch {
      console.warn('[cache] Redis unavailable — using memory fallback')
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.usingFallback || !this.client) {
      const entry = this.memory.get(key)
      if (!entry || entry.expiresAt < Date.now()) {
        this.memory.delete(key)
        return null
      }
      return entry.value
    }
    return this.client.get(key)
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.memory.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
    if (!this.usingFallback && this.client) {
      await this.client.set(key, value, 'EX', ttlSeconds)
    }
  }

  async del(key: string): Promise<void> {
    this.memory.delete(key)
    if (!this.usingFallback && this.client) {
      await this.client.del(key)
    }
  }
}

const globalForCache = globalThis as unknown as { _clubCache: CacheService | undefined }
export const cache = globalForCache._clubCache ?? (globalForCache._clubCache = new CacheService())
```

---

## 11. Mapování NestJS modulů → Hono route groups

| NestJS modul | Hono route soubor | Endpoint prefix | Poznámka |
|---|---|---|---|
| AuthModule | `auth.routes.ts` | `/v1/auth` | Cookies identické |
| MeModule | `me.routes.ts` | `/v1/me` | `GET /`, `GET /context`, `GET /coach-only` |
| EventsModule | `events.routes.ts` | `/v1/events` | Identická logika |
| ConversationsModule | `conversations.routes.ts` | `/v1/conversations` | + `requireFeature('messages')` |
| NotificationsModule | `notifications.routes.ts` | `/v1/notifications` | + `requireFeature('notifications')` |
| MembersModule | `members.routes.ts` | `/v1/members` | |
| TeamsModule | `teams.routes.ts` | `/v1/teams` | |
| DashboardModule | `dashboard.routes.ts` | `/v1/dashboard` | |
| TrainingTemplatesModule | `training-templates.routes.ts` | `/v1/training-templates` | |
| PlatformAdminModule | `platform-admin.routes.ts` | `/v1/platform-admin/clubs` | PlatformAdminGuard → check isPlatformAdmin |
| HealthModule | `health.routes.ts` | `/health` | Bez auth |

### URL změny pro klienty
**Žádné URL změny.** Stávající FE volá `http://localhost:3001/api/v1/...`. Po migraci bude volat `http://localhost:3000/api/v1/...`. Jen jiný port.

V produkci bude obojí na stejné doméně — `https://app.example.com/api/v1/...`.

---

## 12. Změny v klientech (FE + Expo)

### Frontend (apps/web)
Změna je minimální — jen base URL API klienta:

```typescript
// Před migrací (apps/web/lib/api-client.ts nebo fetch wrappery):
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// Po migraci — API je na stejném originu:
const API_BASE = ''  // prázdný string = same-origin volání

// Nebo explicitně:
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ''
```

**Benefit same-origin API:** Cookies fungují automaticky bez `credentials: 'include'`. CORS hlavičky nejsou potřeba pro webový klient. Lepší bezpečnost (no CORS preflight na každý request).

### Session storage klíče
Beze změny: `club.access` (JWT) + `club.clubId` (aktivní klub) — logika na FE zůstává identická.

### Expo (apps/mobile)
Expo volá API přes síť (jiný origin vždy) — pokračuje s:
- `Authorization: Bearer <token>` header
- `X-Club-Id: <clubId>` header
- Refresh token v `SecureStore`, poslaný jako `Cookie: club_rt=<token>` header manuálně

Žádná breaking change, jen update base URL.

---

## 13. Migrační postup — krok za krokem

### Fáze 0: Příprava (1 den)
**Cíl:** Nainstalovat Hono, připravit skeleton bez funkcionality.

```bash
# V apps/web
pnpm add hono @hono/zod-validator jose ioredis
```

1. Přidat do `apps/web/next.config.ts`:
   ```typescript
   // Nutné pro ioredis a některé Node.js moduly
   serverExternalPackages: ['ioredis', '@prisma/client']
   ```

2. Vytvořit prázdný `app/api/[[...route]]/route.ts` s hello world Hono app.
3. Ověřit, že Next.js builduje (`pnpm --filter @sport-manager/web build`).
4. Ověřit, že `GET /api/health` vrací `{ ok: true }` na portu 3000.

**NestJS API stále běží na 3001 — paralelní provoz.**

---

### Fáze 1: Auth (2 dny) — PRVNÍ MODUL
**Proč first:** Bez auth nelze testovat nic dalšího. Pokud auth funguje, middleware chain funguje.

Pořadí implementace:
1. `lib/api/prisma.ts` — singleton
2. `lib/api/services/auth.service.ts` — přepsat z NestJS (odstranit DI dekorátory, importovat prisma singleton přímo)
3. `lib/api/middleware/auth.middleware.ts`
4. `lib/api/middleware/club-context.middleware.ts`
5. `lib/api/routes/auth.routes.ts`
6. `lib/api/hono.ts` — základní app s pouze auth routes
7. Update `app/api/[[...route]]/route.ts`

**Verifikace:**
```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"password"}' \
  -c /tmp/cookies.txt

# Ověřit, že club_rt cookie je httpOnly
```

---

### Fáze 2: RBAC + Me (1 den)
1. `lib/api/services/rbac.service.ts`
2. `lib/api/middleware/rbac.middleware.ts`
3. `lib/api/routes/me.routes.ts`

**Verifikace:** `GET /api/v1/me` s Bearer tokenem vrátí user data.

---

### Fáze 3: Features service + Redis (1 den)
1. `lib/api/redis.ts` — singleton
2. `lib/api/services/features.service.ts`
3. `lib/api/middleware/feature-flag.middleware.ts`

**Verifikace:** `GET /api/v1/me/context` vrátí features object.

---

### Fáze 4: Core moduly (3-4 dny)
Každý den 1-2 moduly, pořadí volné:
- Events (nejkomplexnější — začni s ním)
- Conversations + feature gate
- Notifications + feature gate
- Members
- Teams
- Dashboard
- Training Templates

---

### Fáze 5: Platform Admin (1 den)
PlatformAdminGuard → v Hono: middleware, který checkuje `user.isPlatformAdmin`.

```typescript
export const requirePlatformAdmin = () =>
  createMiddleware<HonoEnv>(async (c, next) => {
    const user = c.get('user')
    // Načíst isPlatformAdmin z DB (nebo bake into JWT payload)
    const full = await prisma.user.findUnique({
      where: { id: user.id },
      select: { isPlatformAdmin: true },
    })
    if (!full?.isPlatformAdmin) {
      throw new HTTPException(403, { message: 'Platform admin only' })
    }
    return next()
  })
```

---

### Fáze 6: FE přepnutí + smoke test (1 den)
1. Změnit `API_BASE` ve webovém klientovi z `http://localhost:3001` na `''`
2. Ověřit všechny existující FE stránky
3. Smoke test Expo stub (pokud existuje)

---

### Fáze 7: Cleanup (0,5 dne)
1. Smazat `apps/api` z monorepa
2. Odebrat `@sport-manager/api` z `pnpm-workspace.yaml`
3. Odebrat `apps/api` entry z `turbo.json`
4. Odebrat port 3001 z `docker-compose.yml` (pokud byl tam expose)
5. Odebrat `.claude/launch.json` entry pro api
6. Odebrat z `README` / `CLAUDE.md` zmínky o portu 3001

---

## 14. Co se mění v packages

### `@sport-manager/contracts` — ŽÁDNÁ ZMĚNA
Zod schémata jsou framework-agnostická. Import beze změny.

### `@sport-manager/db` — ŽÁDNÁ ZMĚNA
PrismaClient + `withClub()` zůstávají. PrismaService wrapper (NestJS Injectable) se nepoužije — místo toho `lib/api/prisma.ts` singleton. Ale samotný `@sport-manager/db` package beze změny.

### `@sport-manager/config` — případná malá změna
Pokud API v `@sport-manager/config` exportuje NestJS-specifické věci (ConfigModule, etc.), tyto importy z nové implementace odstraníme. Obecné env proměnné zůstávají.

---

## 15. Cookies a httpOnly refresh token — detaily

### Jak funguje hono/cookie v Next.js
`setCookie(c, name, value, options)` volá Web Standard `Response.headers.append('Set-Cookie', ...)`. Next.js toto nativně předá browseru — identické chování jako Fastify `reply.setCookie()`.

### Mobile (Expo) — cookie workaround
Expo nemá browser cookie jar. Aktuální přístup (zachováme):
1. Login response obsahuje `Set-Cookie: club_rt=<token>; HttpOnly; ...`
2. Expo čte raw header přes `response.headers.get('set-cookie')`
3. Extrahuje hodnotu, uloží do `SecureStore`
4. Na `/refresh` pošle jako `Cookie: club_rt=<token>` header ručně

Hono `getCookie(c, 'club_rt')` přečte cookie z `Cookie` headeru — funguje stejně ať přijde z browser cookie jar nebo z Expo manuálně nastaveného headeru.

### SameSite policy
- Web klient: same-origin → `SameSite: Lax` je bezpečné
- Expo: cross-origin → `SameSite: None; Secure` by bylo potřeba v produkci pokud Expo volá přes síť. Doporučení: pro mobile ponechat cookie mechanismus jako optional, primary flow může být access token v SecureStore s delší expirací (7 dní místo 15 minut) — to je separátní rozhodnutí.

---

## 16. Rizika a mitigace

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|---|---|---|---|
| **Prisma connection pool exhaustion** | Střední (dev hot reload) | Vysoký | `globalThis` singleton pattern (sekce 9) |
| **Cookie SameSite v Expo** | Nízká (funguje i teď) | Střední | Explicitní Cookie header v Expo fetch |
| **jose vs jsonwebtoken kompatibilita** | Nízká | Střední | jose je drop-in, stejné JWT formáty |
| **Next.js Edge Runtime nekompatibilita** | Nízká (zůstáváme Node.js) | Střední | `runtime = 'nodejs'` v route.ts pokud potřeba |
| **ioredis v serverless** | Střední pokud Vercel | Střední | In-memory fallback pokud REDIS_URL chybí |
| **Missing NestJS DI magic** | Nízká | Nízká | Services jsou plain classes/singletons |
| **Chybějící global exception filter** | Střední | Nízká | `app.onError()` v hono.ts pokrývá vše |
| **CORS pro Expo v produkci** | Nízká | Střední | CORS middleware v hono.ts konfigurujeme explicitně |
| **Paralelní provoz obou API při migraci** | Nízká | Nízká | Různé porty (3000 vs 3001), DB je sdílená — v pořádku |

### Největší risk: přeběhnutí scope
Migrace je pure refactor — žádná nová business logika. Pokud se přidávají features souběžně s migrací, merge konflikty budou bolestivé. Doporučení: **zmrazit nový vývoj na apps/api** od Fáze 0 do Fáze 7.

---

## 17. Nové závislosti v `apps/web`

```json
{
  "dependencies": {
    "hono": "^4.6.x",
    "@hono/zod-validator": "^0.4.x",
    "jose": "^5.9.x",
    "ioredis": "^5.4.x",
    "bcrypt": "^5.1.x"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.x"
  }
}
```

`bcrypt` je nutný pro password hashing v auth.service — v NestJS bylo v `apps/api`. Alternativa: `bcryptjs` (pure JS, žádné native bindings, jednodušší build na různých platformách).

---

## 18. `next.config.ts` úpravy

```typescript
// apps/web/next.config.ts
const nextConfig = {
  // Hono + Prisma + Redis jsou server-only — nepouštět je do klienta
  serverExternalPackages: [
    '@prisma/client',
    'ioredis',
    'bcrypt',
  ],

  // Pokud self-hosted standalone deploy
  output: 'standalone',
}
```

---

## 19. Odpovědi na konkrétní otázky ze zadání

**Co se změní v @sport-manager/db?** Nic.

**Co se změní v @sport-manager/contracts?** Nic.

**Co se stane s apps/api?** Smaže se ve Fázi 7 po úspěšném smoke testu všech endpointů.

**Jak řešit session/cookies?** `hono/cookie` utilities — identická sémantika jako `@fastify/cookie`, žádná breaking change pro browser klienty.

**Jak řešit Prisma singleton?** `globalThis._clubPrisma` pattern (sekce 9) — standardní Next.js pattern.

**Breaking changes pro FE?** Jen změna API base URL (`localhost:3001` → `localhost:3000` v dev, v produkci stejná doména). Žádná URL path změna.

**Jak řešit Prisma v serverless vs. standalone?** Standalone (doporučeno pro self-hosted) = žádný problém. Serverless (Vercel) = singleton přes globalThis + doporučení přidat connection pooler (PgBouncer / Prisma Accelerate).

---

## 20. Prostředí po migraci

| Prostředí | Web + API | DB | Redis |
|---|---|---|---|
| Local dev | `localhost:3000` (Next.js) | `localhost:5432` (Docker) | `localhost:6379` (Docker) |
| Staging | `staging.app.com` | Managed PostgreSQL | Managed Redis |
| Production | `app.com` | Managed PostgreSQL | Managed Redis |

Provoz: 1 proces místo 2. Docker Compose po migraci obsahuje jen `club-postgres` a `club-redis`.

---

## 21. Časový odhad

| Fáze | Odhad | Kumulativně |
|---|---|---|
| 0 — Příprava + skeleton | 1 den | 1 den |
| 1 — Auth | 2 dny | 3 dny |
| 2 — RBAC + Me | 1 den | 4 dny |
| 3 — Features + Redis | 1 den | 5 dní |
| 4 — Core moduly (6 modulů) | 4 dny | 9 dní |
| 5 — Platform Admin | 1 den | 10 dní |
| 6 — FE přepnutí + smoke test | 1 den | 11 dní |
| 7 — Cleanup | 0,5 dne | 11,5 dne |

Celkem: ~2,5 týdne při jednom vývojáři, bez nového vývoje souběžně.

---

---HANDOFF---
OD: softwarovy-architekt
KOMU: projektovy-manazer
STATUS: hotovo
VÝSTUP: projekty/migrace-hono/architektura.md
DALŠÍ KROK: PM rozhodne, zda migraci zařadit do roadmapy. Pokud ano — delegovat implementaci Fáze 0 na frontend-vyvojar nebo backend-vyvojar (soubory v apps/web, žádná NestJS znalost potřeba). Doporučuji nejprve diskutovat riziko zmrazení vývoje na apps/api po dobu 2,5 týdne.
OTÁZKY:
  1. Je self-hosted standalone priorita, nebo zvažujeme Vercel deploy? Má vliv na Prisma connection pooling strategii.
  2. Expo mobilní app je zatím stub — má smysl řešit SameSite cookie pro mobile teď, nebo odložit?
  3. Chceme zachovat paralelní provoz obou API po dobu migrace (bezpečnější) nebo přepnout FE okamžitě po Fázi 1 (rychlejší)?
---/HANDOFF---
