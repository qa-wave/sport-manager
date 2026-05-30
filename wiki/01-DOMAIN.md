# 01 — Doména — sport-manager

## Co projekt řeší

**Sport manager** — veřejný **multi-tenant SaaS** pro sportovní kluby. Náhrada za TeamSnap / Spond / Týmuj.cz. Hostuje to autor, kdokoli si self-service založí klub.

Produkční URL: **sport-manager.qawave.ai**.

## Cílová skupina / persony

- **Klubový admin** — zakládá klub, zve trenéry/hráče, spravuje členství
- **Trenér** — vytváří akce (tréninky/zápasy), RSVP, attendance, komunikace
- **Hráč / rodič** — RSVP, kalendář, komunikace, platby

## Klíčové KPI

- Aktivní kluby (>5 členů, retention 3+ months)
- Self-service signup conversion
- RSVP completion rate (kvalita user behavior)
- Stripe Connect adoption (% klubů s platbami)

## Stav projektu

Kompletní SaaS portál — **30+ stránek, 25+ API endpointů, 2 jazyky (cs/en)**, Stripe Connect, SSE real-time, 81 testů. (Stav k 2026-05-12.)

## Stack

| Vrstva | Technologie |
|---|---|
| API | **Hono** uvnitř Next.js (catch-all `app/api/[[...route]]`) — single proces |
| Frontend | Next.js 15 App Router + React 19 + TanStack Query + shadcn/ui + Tailwind |
| Font | **Inter** via `next/font/google` |
| Auth | JWT access (jose, 15 min) + httpOnly refresh cookie (30 dní) + bcrypt |
| DB (lokál) | PostgreSQL 16 v Dockeru — user/db `branik` |
| DB (prod) | **Neon Postgres** us-east-1 (free tier) |
| Contracts | `@sport-manager/contracts` — Zod schémata sdílená FE/BE |
| Monorepo | pnpm workspaces + turbo |
| Hosting | **Vercel** (`sport-manager.qawave.ai`) |
| Platby | **Stripe Connect** (Express accounts, Checkout sessions, webhooks) |
| Email | **Resend** (console.log fallback bez API key) |
| i18n | Custom hook `useTranslation()` — cs/en, 453 klíčů |
| Monitoring | **Sentry** |
| Testy | 59 shell regression + 22 E2E flow |

## Doménový kontext

- Group: `web-app-saas` (s `fedic`, `goodmove`, `stunova`)
- Multi-tenant — každý klub má izolovaná data (RLS? nebo app-level filter)
- Stripe Connect = každý klub si propojí vlastní Stripe účet (platby přímo k nim, ne přes platformu)
- i18n od začátku (CZ first, EN parity)

## Co projekt **není**

- **Není** custom self-hosted (vždy SaaS na sport-manager.qawave.ai)
- **Není** mobilní app (responzivní web stačí pro MVP)
- **Není** turnajový systém (jen tréninky/zápasy/RSVP)
- **Není** scout / talent management

## Klíčová pravidla

- Žádný `git commit` / `git push` bez explicitního požadavku uživatele
- Žádný `vercel --prod` bez "nasaď" / "deploy"
- Nikdy merge do `main` autonomně
