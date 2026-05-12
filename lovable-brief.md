# Sport manager — Lovable project brief

> Vlož tento soubor do Lovable jako projektovou specifikaci. Self-contained — neodkazuje se na žádný externí kontext.

---

## 1. Co stavíme

**Public multi-tenant SaaS pro sportovní kluby.** Náhrada za TeamSnap / Spond / Týmuj.cz. Kdokoli si self-service založí klub za 5 minut, pozve trenéra a rodiče, a má hotový kalendář, RSVP, attendance, chat a evidenci členů.

**Hostuju já**, kdokoli si může klub založit (free tier). Volitelně: white-label embed (iframe widgetu „nejbližší zápas" do klubového webu).

**Killer feature (plánováno):** AI integrace s ligovými API — onboarding wizard najde tým ve FAČR (fotbal) a stáhne kompletní rozpis (minulé i budoucí zápasy + výsledky).

---

## 2. Persony

| Persona | Co řeší denně | Klíčový jobs-to-be-done |
|---|---|---|
| **Club Admin / Owner** | Vede klub, sleduje členy, účtuje | „Chci vidět, kdo dluží příspěvky a koho pozvat na sportovní soustředění" |
| **Head Coach** | Vede tým, plánuje tréninky, dělá attendance | „Chci za 30 sekund odbavit prezenci 20 dětí po tréninku" |
| **Parent** | RSVPuje za dítě, čte oznámení, platí | „Chci vidět příští trénink dcery a v kolik mám přijít" |
| **Player (16+)** | RSVPuje sám, kouká na rozpis | „Chci vědět, kdy hraju a proti komu" |
| **Guest** | Read-only přístup | „Chci vidět rozpis týmu, který trénuje můj kamarád" |

**Kritické UX případy:**
1. **Multi-role na jedné osobě.** 16letý hráč může být `PLAYER` na U18 *a* `ASSISTANT_COACH` na U13.
2. **Multi-tenant na jedné osobě.** Tomáš je rodič v jednom klubu *a* hlavní trenér v jiném klubu. Plynulé přepínání jako Slack workspaces.
3. **Privacy by participation.** Konverzace vidí jen ti, kdo jsou v `ConversationParticipant` listu. Rozvedený táta nesmí vidět DM mezi mámou a trenérem.
4. **Rozvedení rodiče.** Mom a Dad mají oba `GuardianLink` na dítě, každý s jinou permission maskou (Mom může vidět platby, Dad ne).
5. **Hráč 16+** může RSVPnout sám, ale rodič to taky vidí a může přepsat.

---

## 3. Datový model (Postgres + Prisma)

### Klíčové entity a vztahy

```
User (1) ─< Member (N per club) ─< TeamMembership (N per team)
            │
            ├── ClubRole [OWNER, ADMIN, FINANCE, COMMUNICATIONS, FACILITY]
            ├── GuardianLink (guardian → child, with permission mask)
            └── Status: ACTIVE | INACTIVE | SUSPENDED | ARCHIVED

Club ─< Team ─< Event ─< EventAttendance (RSVPStatus + attended)
       │       │
       │       └── EventType: PRACTICE | MATCH | TOURNAMENT | MEETING | SOCIAL
       │           HomeAway:  HOME | AWAY | NEUTRAL
       │
       ├── TrainingTemplate (generates recurring Events)
       ├── Conversation [TEAM | COACHES | PARENTS | DM | GROUP | ANNOUNCEMENT]
       │   └── ConversationParticipant ─< Message
       ├── Fee ─< Payment [PENDING | PROCESSING | PAID | FAILED | REFUNDED]
       ├── Waiver [GDPR | HEALTH | LIABILITY | MEDIA_CONSENT]
       │   └── WaiverSignature
       └── Notification [10 types: EVENT_*, RSVP_REMINDER, MESSAGE, PAYMENT_*, ANNOUNCEMENT, WAIVER_PENDING, GENERAL]
```

### Klíčová pravidla

1. **`User` vs `Member` separation.** `User` je identita (1 řádek per člověk). `Member` je klubový profil. Jeden user může být členem N klubů.
2. **Role na vztazích, ne na uživateli.** `TeamMembership(memberId, teamId, role)` umožňuje multi-role. Žádný „role" sloupec na user.
3. **`GuardianLink` má permission masku per link.** Pole: `canViewSchedule`, `canRsvp`, `canViewPayments`, `canMakePayments`, `canViewMedical`, `canSignWaivers`.
4. **Multi-tenant by `clubId`.** Každá tabulka s klubovým scope má `clubId`. **Postgres RLS** vynucuje izolaci na DB úrovni: `USING (club_id = current_setting('app.club_id', true))`.
5. **Conversation privacy** je vynucená přes explicit `ConversationParticipant` join. Žádné implicitní „všichni v týmu vidí".

### Enumy (kompletní výčet)

- **MemberStatus:** `ACTIVE`, `INACTIVE`, `SUSPENDED`, `ARCHIVED`
- **ClubRoleType:** `OWNER`, `ADMIN`, `FINANCE`, `COMMUNICATIONS`, `FACILITY`
- **TeamRole:** `PLAYER`, `HEAD_COACH`, `ASSISTANT_COACH`, `TEAM_MANAGER`, `MEDIC`
- **GuardianRelationship:** `PARENT`, `STEP_PARENT`, `LEGAL_GUARDIAN`, `OTHER`
- **EventType:** `PRACTICE`, `MATCH`, `TOURNAMENT`, `MEETING`, `SOCIAL`
- **HomeAway:** `HOME`, `AWAY`, `NEUTRAL`
- **RSVPStatus:** `YES`, `NO`, `MAYBE`, `PENDING` (+ `attended: boolean | null`)
- **ConversationType:** `TEAM`, `COACHES`, `PARENTS`, `DM`, `GROUP`, `ANNOUNCEMENT`
- **WaiverType:** `GDPR`, `HEALTH`, `LIABILITY`, `MEDIA_CONSENT`
- **PaymentStatus:** `PENDING`, `PROCESSING`, `PAID`, `FAILED`, `REFUNDED`
- **NotificationType:** `EVENT_CREATED`, `EVENT_UPDATED`, `EVENT_CANCELLED`, `RSVP_REMINDER`, `MESSAGE`, `PAYMENT_DUE`, `PAYMENT_RECEIVED`, `ANNOUNCEMENT`, `WAIVER_PENDING`, `GENERAL`

---

## 4. Obrazovky (musí existovat)

### Veřejné
- `/` → redirect na `/admin` (pokud přihlášen) nebo `/login`
- `/login` — email + heslo
- `/signup` — *(plánováno)* self-service signup nového klubu
- `/k/{clubSlug}` — *(plánováno)* veřejná stránka klubu, SEO-indexable

### Admin (přihlášený, role-aware)
- `/admin` — Dashboard: This Week + Needs Attention + Quick Actions + Recent Activity
- `/admin/events` — list + **calendar view** (month grid, čeština, today highlight)
- `/admin/events/[eventId]` — detail s RSVP roster + attendance
- `/admin/events/new` — create form
- `/admin/members` — list + filtry + search
- `/admin/members/[memberId]` — detail (tabs: profil, attendance, platby, waivery)
- `/admin/teams` — list + detail
- `/admin/messages` — inbox všech konverzací
- `/admin/messages/[conversationId]` — chat view (bubliny, date separators, optimistic)
- `/admin/payments` — *(stub)* fees + payments
- `/admin/training-templates` — *(stub)* šablony tréninků
- `/admin/account` — profil + nastavení vzhledu (theming)
- `/admin/notifications` — *(plánováno)* full inbox

### Layout
- **Left sidebar** — role-aware nav (Admin / Coach / Parent vidí různé položky)
- **Topbar** — notification bell + role switcher (DEV) + avatar + theme toggle
- **Mobile responsive** — sidebar se schová na hamburger

---

## 5. Brand & Theming

### Princip: per-tenant theming

Každý klub si v `/admin/account → Vzhled` vybere:
1. **3 barvy:** primary, secondary, tertiary (color picker)
2. **1 z 10 vizuálních stylů**

Theming se aplikuje injekcí CSS variables do `<html>` per request (z RLS-safe `clubId` kontextu). Dark + Light variant pro každý styl.

### 10 vizuálních stylů

| # | Název | Charakter |
|---|---|---|
| 1 | **Solid Bold** | Plné primární barvy, sharp hrany, white text |
| 2 | **Gradient Diagonal** | Diagonální gradient primary→secondary |
| 3 | **Soft Pastel** | Desaturované tóny, rounded corners, whitespace |
| 4 | **Dark Stadium** | Tmavý base, primary jako accent, neon glow |
| 5 | **Vintage Heritage** | Sepia overlay, serifové akcenty, znak-feel |
| 6 | **Mesh Gradient** | Animovaný mesh ze všech 3 barev |
| 7 | **Striped Court** | Diagonální pruhy primary+secondary |
| 8 | **Mono Brutalist** | Jen primary, oversized typo |
| 9 | **Editorial Magazine** | Secondary jako BG, primary serif headlines |
| 10 | **Glassmorphism** | Průsvitné panely, blur, primary za nimi |

### AI theming (plánováno)
Endpoint `POST /v1/club/theme/suggest-from-logo` — admin nahraje logo, LLM vrátí navrženou paletu (primary z dominantní barvy loga, komplementární secondary, kontrastní tertiary).

---

## 6. Test data (musí být v seedu)

**2 fiktivní kluby s totální coverage všech enum hodnot:**

### Klub 1: FC Hvězda Strašnice (fotbal)
- Tier: `pro`. Barvy: modrá `#1e3a8a` + zlatá `#f59e0b` + tmavě modrá `#0f172a`. Style: Solid Bold.
- 2 týmy: U13 (11 hráčů) + U15 (9 hráčů)
- Adultní role: 1× OWNER+ADMIN+FINANCE, 1× COMMUNICATIONS, 1× FACILITY, 1× HEAD_COACH, 1× ASSISTANT_COACH, 1× TEAM_MANAGER, 1× MEDIC
- **Multi-role:** Šimon Růžička (16) = PLAYER na U15 + ASSISTANT_COACH na U13
- **Divorced parents:** Anna má Mom (full perms) + Dad (jen schedule+rsvp) + Step-Dad (jen schedule)
- **LEGAL_GUARDIAN:** jiné dítě má babičku jako legálního zástupce
- **OTHER unverified:** strýc, čeká na admin approval
- 4 členové se statusy: ACTIVE / INACTIVE / SUSPENDED / ARCHIVED
- 5 plateb (jedna v každém PaymentStatus)
- 4 waivery × 3 podpisy = 12
- 6 chatů (každý ConversationType)
- 10 notifikací (každý NotificationType)
- TrainingTemplate s 1 navázaným event-em + 1 detached
- Edited message + soft-deleted message v DM
- ClubFeatureAudit zápis (platform admin enabled payments)
- PushTokens (web + ios)

### Klub 2: TJ Sokol Měcholupy (florbal)
- Tier: `free`. Barvy: zelená `#16a34a` + oranžová `#ea580c` + tmavě zelená `#064e3b`. Style: Mesh Gradient.
- 1 tým: U11 (8 hráčů + rodiče)
- HEAD_COACH = Tomáš Mertin (multi-tenant: současně rodič v Hvězdě)
- ASSISTANT_COACH + TEAM_MANAGER coverage

### Login matrix (heslo `heslo123` pro všechny)

| Email | Role |
|---|---|
| `admin@hvezda.cz` | Hvězda OWNER + ADMIN + FINANCE |
| `coach@hvezda.cz` | Hvězda U13 HEAD_COACH |
| `parent@hvezda.cz` | Mom of Anna (divorced — vidí všechno) |
| `petr.pekar@hvezda.cz` | Dad of Anna (privacy: nevidí DM, nevidí platby) |
| `simon.assist@hvezda.cz` | Multi-role: U15 PLAYER + U13 ASSISTANT_COACH |
| `admin@sokoli.cz` | Sokol OWNER |
| `tomas@example.com` | Multi-tenant: Hvězda parent + Sokol HEAD_COACH |
| `platform@example.com` | Platform admin (super-user, cross-club) |

---

## 7. API & auth

### Stack (preferovaný, ale Lovable může použít vlastní)
- **API:** Hono uvnitř Next.js (catch-all `/api/[[...route]]`) — single process
- **Auth:** JWT access (jose, 15min TTL) + httpOnly refresh cookie (30 dní), bcrypt
- **DB:** Postgres + Prisma + RLS
- **Cache:** Redis (volitelné, in-memory fallback OK)

### Endpoint mapa

```
POST   /api/v1/auth/register            email + password → token + cookie
POST   /api/v1/auth/login               email + password → token + cookie
POST   /api/v1/auth/refresh             cookie → new token + cookie
POST   /api/v1/auth/logout              clears cookie
GET    /api/v1/me                       current user identity
GET    /api/v1/me/context               { clubRoles, teamRoles, guardianLinks, features }
GET    /api/v1/health                   { status, db, ts }

GET    /api/v1/members
GET    /api/v1/members/:id
GET    /api/v1/teams
GET    /api/v1/teams/:id

GET    /api/v1/events?from&to&teamId
POST   /api/v1/events                   coach+
PATCH  /api/v1/events/:id
GET    /api/v1/events/:id
POST   /api/v1/events/:id/rsvp          self or guardian for child
PATCH  /api/v1/events/:id/attendance    coach+ bulk

GET    /api/v1/conversations            scoped by participation
GET    /api/v1/conversations/:id
POST   /api/v1/conversations
POST   /api/v1/conversations/:id/messages
PATCH  /api/v1/conversations/:id/read

GET    /api/v1/notifications?cursor
GET    /api/v1/notifications/unread-count
PATCH  /api/v1/notifications/:id/read
PATCH  /api/v1/notifications/read-all

GET    /api/v1/dashboard/feed           thisWeek + needsAttention + activity + stats

GET    /api/v1/training-templates
POST   /api/v1/training-templates
PATCH  /api/v1/training-templates/:id
DELETE /api/v1/training-templates/:id
POST   /api/v1/training-templates/:id/regenerate    idempotentně dotvoří chybějící eventy

GET    /api/v1/platform-admin/clubs                 platform admin only
PATCH  /api/v1/platform-admin/clubs/:id/features    audit-logged
```

### Multi-tenant header
Klient posílá `x-club-id: <uuid>` v každém scoped requestu. Middleware extrahuje, ověří, že user má `Member` v daném klubu, a setne `clubId` do request kontextu. Prisma wrapper `withClub(clubId, fn)` udělá `SELECT set_config('app.club_id', $clubId, true)` v rámci transakce → RLS aplikuje policies.

---

## 8. Co plánujeme dál (roadmap, ne MVP)

### AI Liga Sync (killer feature)
- **A1.** Per-svaz adapter (FAČR fotbal first, ČFbU florbal, ČSLH hokej…)
- **A2.** AI Smart Linker v onboardingu — admin zadá *"Spartak Kbely U9"*, LLM s tool calls najde FAČR ID
- **A3.** Cron sync 1×/den, idempotentní (`source: "FACR-{teamId}-{matchId}"`)
- **A4.** AI Opponent Scouting — LLM shrnutí soupeře z minulých zápasů
- **A5.** AI Post-Match Recap — návrh shrnutí pro rodiče
- **A6.** Historic backfill (předchozí sezóna stats)

### Self-service onboarding
- Signup s Google/Apple OAuth
- Wizard: jméno klubu → sport → věkové kategorie → první tým → AI sync → pozvi trenéra → hotovo
- Veřejná SEO stránka klubu/týmu

### Billing (až po MVP)
- Free (1 tým, 25 členů)
- Klub 990 Kč/měsíc (5 týmů, AI)
- Akademie 2 990 Kč/měsíc (neomezeně + brand)

---

## 9. Co **nedělej**

- ❌ Nedělej fitness/wellness UI vibe — jsme nástroj, ne motivační app
- ❌ Žádné AI chat-bot maskoty
- ❌ Žádné stock fotky sportovců na hero
- ❌ Žádný tvrdý role-based router (Alex je current-user-state, ne role) — přepínat kontext, ne identitu
- ❌ Nepiš si vlastní cookie management — použij standardní `Set-Cookie` httpOnly
- ❌ Neukládej refresh token do localStorage (musí být httpOnly cookie)
- ❌ Nedělej landing page / marketing site v této appce — to je separátní projekt
- ❌ Nedělej globální search napříč kluby — privacy by default

---

## 10. Definice „hotovo" pro MVP

1. Dashboard zobrazuje data ze 2 seed klubů
2. Login `admin@hvezda.cz` / `heslo123` funguje, sidebar zobrazí role-aware nav
3. Calendar view zobrazí 69+ eventů z různých EventType + HomeAway variant
4. Event detail s RSVP rosterem (vidíš všechny 4 RSVPStatus)
5. Bulk attendance po tréninku
6. Member detail s tabs: profil / attendance / platby / waivery
7. Messages: vidíš jen své konverzace (privacy test: Dad nevidí Mom+Coach DM → 403)
8. Multi-tenant switcher: Tomáš přepíná Hvězda ↔ Sokol
9. Theme picker v `/admin/account` — barvy + 1 z 10 stylů, preview live
10. Health endpoint vrací `{status:"ok",db:"ok"}`

---

## 11. Češ­tina

**Veškeré UI texty česky.** Tlačítka, popisky stavů, error messages, empty states. Anglická jména jsou jen u technických věcí (kód, enumy, route paths).

Příklady:
- „Členové" ne „Members"
- „Trenér" ne „Coach"
- „Příští trénink: zítra v 17:30" ne „Next practice: tomorrow at 5:30 PM"
- „Účast potvrzena" ne „RSVP confirmed"
