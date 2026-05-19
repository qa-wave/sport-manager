# Produktová vize: Sport Manager — Kompletní analýza a backlog
**Od:** Produktový manažer
**Pro:** Business analytik, UX Designér, tým
**Datum:** 2026-05-12
**Projekt:** Sport Manager — SaaS pro sportovní kluby
**Verze:** 2.0 (navazuje na competitor-features/prioritizace.md z 2026-04-18)

---

## 1. Kde jsme teď — stav produktu

Produkt dosáhl stavu "feature-complete MVP+". Oproti analýze z dubna 2026 přibyla řada features:

| Oblast | Stav k 2026-05-12 |
|--------|-------------------|
| Auth + RBAC | Kompletní (JWT, role, multi-tenant) |
| Events + RSVP | Kompletní (3 view, bulk ops, magic link, QR) |
| Tréninky | Kompletní (30+ cvičení, SVG diagramy, drag-to-calendar, šablony) |
| Members | Kompletní (CRUD, CSV import/export, stats, avatar) |
| Teams | Kompletní (roster, heatmap, coach stats, transfer) |
| Messages | Kompletní (SSE real-time, 6 typů konverzací, DM) |
| Payments | **Stripe Connect + Checkout funguje** (UI v `payments/page.tsx`) |
| i18n | 5 jazyků, 354 klíčů |
| Design | Premium (Inter, gradient brand, 10 témat) |
| Testy | 81 testů (59 regression + 22 E2E) |

**API stub routes existují ale chybí UI:** `polls.routes.ts`, `waivers.routes.ts`, `gallery.routes.ts`, `federation.routes.ts`, `documents.routes.ts`

---

## 2. Feature Gap Analysis — co má konkurence a my ne

### 2.1 Spond (norský, zdarma, silný v Evropě)

| Feature Spond | Náš stav | Gap |
|---------------|----------|-----|
| Automatické RSVP připomenutí | RSVP reminder typ v DB, bez workeru | Chybí push delivery |
| Carpooling (odvoz k eventu) | Jen textové pole `location` | Chybí `EventTask` modul |
| Opakující se události (série) | `TrainingTemplate` je proxy | Chybí pravé event series (edit one/all) |
| Skupinové hlasování / ankety | `polls.routes.ts` existuje, chybí UI | **API stubováno, UI 0 %** |
| Skupiny uvnitř týmu (sub-groups) | Jen Team úroveň | Chybí sub-group pro pozice (útočníci, obránci) |
| Sdílení dokumentů (PDF, soubory) | `documents.routes.ts` stub | **API stubováno, UI 0 %** |
| Veřejný profil hráče pro přestupy | Jen `/k/{slug}` klub page | Chybí hráčský veřejný profil |
| Platby bez Stripe nutnosti | Stripe Connect hotové | Chybí "ruční platba" (offline evidence) |

### 2.2 TeamSnap (americký, placený, dominantní anglosaský trh)

| Feature TeamSnap | Náš stav | Gap |
|------------------|----------|-----|
| Team store (eshop dresů) | Není | Chybí — nízká priorita pro ČR |
| Live scoring (zápas) | Není | Chybí — vysoká hodnota pro matches |
| Zdravotní záznamy hráče | `Member.medicalNotes` pole | Chybí UI + ochrana dat |
| Roster export pro federaci | `federation.routes.ts` stub | **API stubováno, UI 0 %** |
| "Fan view" pro rodiče | Máme guardian view | Pokrytí srovnatelné |
| Timeclock (přesný příjezd) | QR docházka hotová | Pokrytí srovnatelné, náš je lepší |
| Age division management | Věková kategorie v Team | Základní, chybí automatický věkový přechod |

### 2.3 Heja (skandinávský, mobilní-first, zaměřen na mládež)

| Feature Heja | Náš stav | Gap |
|--------------|----------|-----|
| Read receipts v chatu | `ConversationParticipant.lastReadAt` v DB | **Chybí UI** |
| Safeguarding (blokace DM trenér-nezletilý) | `Member.isMinor`, `GuardianLink` v DB | **Chybí guard** |
| Injury/Illness report (jednorázová omluvenka) | Jen per-event RSVP=NO | Chybí `AbsenceReport` model |
| Celebration posts (gól, narozeniny) | Není | Zajímavá diferenciace |
| Push notifikace (web push) | `PushToken` model, chybí delivery | Chybí FCM/Web Push worker |
| Offline mode | PWA manifest, bez SW cache | Chybí Service Worker |

### 2.4 Týmuj.cz (český, placený, tradiční)

| Feature Týmuj | Náš stav | Gap |
|---------------|----------|-----|
| Soupisky pro FAČR/ČSLH | `federation.routes.ts` stub | **API stubováno, UI 0 %** |
| Faktury a účetní export | Platby jen Stripe | Chybí faktury / ARES lookup |
| SMS upozornění | Email + in-app | Chybí SMS fallback |
| Waivers (GDPR, zdravotní souhlas) | `waivers.routes.ts` stub | **API stubováno, UI 0 %** |
| Přestupní kalendář FAČR | Není | Relevantní pro amatérský fotbal |

### 2.5 Sportlyzer (akademický, zaměřen na rozvoj)

| Feature Sportlyzer | Náš stav | Gap |
|--------------------|----------|-----|
| Performance analytics | Attendance heatmap, chybí metriky | Chybí `TestProtocol` |
| Domácí úkoly (homework) | Není | Chybí |
| Video analýza | SVG drill diagramy | Chybí video upload/análýza |
| Srovnání hráčů (benchmarks) | Attendance stats | Chybí výkonnostní metriky |

### 2.6 PlayyOn (český, novější)

| Feature PlayyOn | Náš stav | Gap |
|-----------------|----------|-----|
| Turnajový modul (pavouk, skupiny) | Jen event type TOURNAMENT | Chybí turnajový engine |
| Registrace týmu na turnaj | Není | Chybí |
| Výsledková listina | Není | Chybí |

---

## 3. Co máme navíc oproti konkurenci — naše silné stránky

Toto jsou skutečné diferenciátory, které nikdo z konkurence nenabízí v kombinaci:

| Naše výhoda | Proč je to důležité |
|-------------|---------------------|
| **Privacy pro rozvedené rodiče** (GuardianLink + RBAC) | Unikátní — TeamSnap ani Spond to nemají. Ochrana dítěte při rozvodu. Silné pro ČR trh |
| **Multi-tenant se silnou RLS** (`withClub()`) | Admin může být v 5 klubech. Spond je single-club app |
| **QR docházka bez loginu** | `attend/[token]` — fyzická docházka u hráče bez nutnosti přihlášení |
| **SVG drill knihovna (30+ cvičení)** | Vizuální příprava tréninku. Žádný přímý competitor to nemá na webu takto |
| **Drag-to-calendar plánovač tréninku** | UX inovace, chybí u Spond i TeamSnap |
| **Magic link RSVP bez registrace** | Rodič klikne z emailu, bez loginu potvrdí. Snižuje tření |
| **Per-klub theming (10 stylů, 3 barvy)** | Bílý label pro každý klub |
| **5 jazyků s 354 klíči** | Připraveno na DACH + Španělsko/Brazílie |
| **Open architecture (API-first, Hono)** | Self-host varianta v budoucnu |
| **Premium design** | Spond a Týmuj vypadají zastarale |

---

## 4. Killer Features — co by nás odlišilo od VŠECH

Tyto funkce by vytvořily nepřekonatelnou diferenciaci:

### KF-1: Liga Sync + Federační integrace (FAČR/ČSLH)
Přímý import rozpisu soutěžních zápasů z federace. Žádný český konkurent to nemá automatizovaný. `federation.routes.ts` je stubovaný, registrový pattern existuje.

**Proč killer:** Každý amatérský fotbalový klub v ČR řeší ruční opisování zápasů z FAČR portálu. Automatizace = okamžitá adopce bez nutnosti přesvědčování.

### KF-2: Parent App jako WhatsApp náhrada
Zjednodušené rodičovské view (mobile-first PWA nebo Expo app) s push notifikacemi, RSVP one-tap a chat. Cílíme na segment, který dnes používá WhatsApp skupinu a Excel.

**Proč killer:** Spond to dělá dobře na mobilech. My máme lepší RBAC a privacy, ale chybí nám push notifikace a offline mode. Když toto uzavřeme + přidáme `PushToken` delivery, jsme lepší než Spond pro CZ trh.

### KF-3: "Report card" pro rodiče (výkonnostní analytics)
Rodiče chtějí vědět, jak se jejich dítě rozvíjí. Měsíční PDF report s docházkou, RSVP historií, trenérovým hodnocením. Diferenciace od "pouhého diářového nástroje".

**Proč killer:** Žádný hlavní competitor to nenabízí takto vizuálně. Buduje emocionální vazbu rodiče na produkt.

### KF-4: Turnajový modul s live scoringem
Správa turnaje (pavouk, skupiny, výsledky, live score) přímo v aplikaci. Dnes trenér řeší zvlášť (Challonge, Google Sheets).

**Proč killer:** Každý turnajecký pořadatel = nový klub. Virální šíření produktu přes turnaje.

### KF-5: Certified "Safeguarding-Ready" badge
Po implementaci safeguardingu (blokace DM trenér-nezletilý, audit log, GDPR waivers) získáme certifikovatelnou feature set. Marketingový argument pro vedení klubu a rodiče.

**Proč killer:** Po českých skandálech v mládežnickém sportu jde o reputační argument, který otevírá dveře do větších klubů (AC Sparta academy, SK Slavia juniors).

---

## 5. Chybějící funkce — co uživatel očekává a nenajde

Řazeno podle frekvence frustrace (odhad z testimonials + competitor feature matice):

### Kritické (uživatel odejde bez nich):

**A. Push notifikace**
Rodič čeká notifikaci na telefon. Máme jen in-app bell + email. `PushToken` model existuje, chybí delivery. Ref: `apps/web/lib/api/routes/notifications.routes.ts`.

**B. Automatické připomenutí eventu**
"Ráno před tréninkem mi přijde push" — základní očekávání od 2026. BullMQ workers jsou stub v `apps/workers/`. Ref: `apps/workers/`.

**C. Opakující se eventy (edit série)**
`TrainingTemplate` je obejití, ale není totéž. Uživatel chce "tréninky každé úterý 17:00 po celou sezónu" jako series s možností editovat jeden nebo celou sérii.

### Důležité (snižují denní hodnotu):

**D. Hlasování/ankety k eventu**
"Kdo jede autem?" nebo "Preferujete trénink v 17:00 nebo 18:00?" — `polls.routes.ts` existuje, chybí UI. Ref: `apps/web/lib/api/routes/polls.routes.ts`.

**E. Waivers — GDPR a zdravotní souhlasy**
Při přijímání nového člena je nutný souhlas se zpracováním dat, fotodokumentací, zdravotním stavem. `waivers.routes.ts` + DB model `Waiver`/`WaiverSignature` existují. Chybí UI. Ref: `packages/db/prisma/schema.prisma`.

**F. Nemoc/zranění omluvenka (AbsenceReport)**
Rodič hlásí nemoc jednou, ne per-event. Dnes musí odmítat každý event zvlášť. Ref: `projekty/competitor-features/prioritizace.md` (F-04).

**G. Read receipts v chatu**
Trenér neví, kdo zprávu přečetl. `ConversationParticipant.lastReadAt` je v DB. Chybí UI. Ref: `packages/db/prisma/schema.prisma`.

**H. Galerie (fotky z tréninků)**
`gallery.routes.ts` stub existuje. Rodiče sdílí fotky z tréninku — dnes WhatsApp. Ref: `apps/web/app/(admin)/admin/gallery/`.

**I. Ruční evidence platby (offline)**
Klub vybírá hotovostní příspěvky. Dnes Stripe only. Admin chce označit "zaplaceno v hotovosti" bez Stripe. Ref: `apps/web/app/(admin)/admin/payments/page.tsx`.

**J. Safeguarding (DM blokace pro nezletilé)**
Právní a reputační nutnost pro kluby s mládeží U9–U15. `Member.isMinor` + `GuardianLink` v DB. Ref: `projekty/competitor-features/prioritizace.md` (F-09).

### Nice-to-have:

**K. Federační sync (FAČR zápasy)**
Import soutěžního kalendáře. `federation.routes.ts` stubováno. Ref: `apps/web/lib/api/routes/federation.routes.ts`.

**L. Zdravotní záznamy (medical notes UI)**
`Member.medicalNotes` pole existuje, bez UI. Alergie, medikace, kontaktní osoba.

**M. Event sub-tasks (carpooling)**
Přiřazení role "Doveze 3 hráče z Braníku" k eventu. Ref: `projekty/competitor-features/prioritizace.md` (F-01).

**N. Performance analytics + Report card**
Výkonnostní metriky, testy, PDF report. Ref: `projekty/competitor-features/prioritizace.md` (F-05).

---

## 6. Prioritizovaný backlog — TOP 20

Seřazeno podle: **dopad × effort × strategická hodnota**

Skóre 1–5 (5 = nejvyšší). Celkové skóre = (Dopad × 0,4) + (1/Effort × 0,3) + (Strategie × 0,3)

| # | Feature | Dopad | Effort (1=velký, 5=malý) | Strategie | Celkové skóre | Fáze |
|---|---------|-------|--------------------------|-----------|---------------|------|
| **1** | Push notifikace — web push delivery | 5 | 3 | 5 | **4.4** | 1 |
| **2** | Automatické event remindery (worker) | 5 | 2 | 4 | **3.9** | 1 |
| **3** | Read receipts v chatu | 4 | 5 | 3 | **3.7** | 1 |
| **4** | Safeguarding (DM blokace nezletilí) | 4 | 4 | 5 | **4.0** | 1 |
| **5** | Waivers UI (GDPR + zdravotní souhlas) | 4 | 4 | 4 | **3.8** | 1 |
| **6** | Pricing page + paywall (Free/Pro/Enterprise) | 5 | 3 | 5 | **4.4** | 1 |
| **7** | Ankety/hlasování UI (polls) | 4 | 4 | 3 | **3.5** | 2 |
| **8** | Nemoc/zranění omluvenka (AbsenceReport) | 4 | 4 | 3 | **3.5** | 2 |
| **9** | Offline mode + Service Worker | 4 | 2 | 4 | **3.4** | 2 |
| **10** | Ruční evidence platby (offline hotovost) | 4 | 4 | 3 | **3.5** | 2 |
| **11** | Galerie (foto upload + album) | 3 | 3 | 3 | **3.0** | 2 |
| **12** | Opakující se eventy jako série | 4 | 3 | 3 | **3.3** | 2 |
| **13** | Federační sync UI (FAČR import zápasů) | 5 | 2 | 5 | **4.1** | 2 |
| **14** | Carpooling / Event tasks | 3 | 3 | 4 | **3.3** | 2 |
| **15** | Vercel Blob pro upload (file storage) | 3 | 4 | 2 | **2.9** | 2 |
| **16** | Zdravotní záznamy UI (medical notes) | 3 | 4 | 3 | **3.1** | 3 |
| **17** | Domácí úkoly (homework) | 3 | 3 | 4 | **3.3** | 3 |
| **18** | Performance analytics + Report card PDF | 4 | 1 | 5 | **3.1** | 3 |
| **19** | Turnajový modul (bracket, live score) | 4 | 1 | 5 | **3.1** | 3 |
| **20** | Expo mobilní app (iOS/Android) | 5 | 1 | 5 | **3.5** | 3 |

---

### Detail TOP 10 položek

#### #1 Push notifikace — web push delivery
**Proč první:** Bez push notifikace je app "jen web stránka". Konkurence (Spond, Heja) je mobilní-first s push. Rodič nevidí RSVP výzvu, trenér neví že event byl potvrzený.

**Co existuje:** `PushToken` DB model, `NotificationType` enum, notification bell + in-app.
**Co chybí:** Web Push provider (VAPID keys + service worker subscribe), delivery v backend notificationService.
**Základ v kódu:** `apps/web/lib/api/routes/notifications.routes.ts` + `packages/db/prisma/schema.prisma` (PushToken model).
**Effort:** M (1 týden — VAPID + service worker subscribe + delivery integrace).

---

#### #2 Automatické event remindery (worker)
**Proč druhý:** Přímý dopad na RSVP response rate. Bez automatického připomenutí musí admin posílat ručně.

**Co existuje:** `NotificationType.RSVP_REMINDER`, `PushToken`, `apps/workers/` stub.
**Co chybí:** BullMQ job scheduler, `ScheduledReminder` model pro idempotency, CRON trigger.
**Základ v kódu:** `apps/workers/` (stub), `apps/web/lib/api/routes/notifications.routes.ts`.
**Effort:** M-L (1,5 týdne — worker infra + job scheduling + idempotency).
**Blocker:** Vyžaduje #1 (push delivery) pro plnou hodnotu.

---

#### #3 Read receipts v chatu
**Proč třetí:** Quick win — 70 % dat v DB, přidá perceived hodnotu messagingu.

**Co existuje:** `ConversationParticipant.lastReadAt` v DB, SSE stream v conversations.
**Co chybí:** UI ikona oka s počtem, tooltip se jmény, PATCH endpoint pro update.
**Základ v kódu:** `apps/web/app/(admin)/admin/messages/[conversationId]/page.tsx`, `packages/db/prisma/schema.prisma`.
**Effort:** S (3–4 dny).

---

#### #4 Safeguarding
**Proč čtvrtý:** Právní nutnost před deployment do reálných klubů s mládeží. Bez toho hrozí reputační riziko.

**Co existuje:** `Member.isMinor`, `GuardianLink`, `ConversationsService.create()`.
**Co chybí:** Guard v `conversations.routes.ts`, feature flag `safeguarding`, audit log entry.
**Základ v kódu:** `apps/web/lib/api/routes/conversations.routes.ts`, `packages/db/prisma/schema.prisma`.
**Effort:** S-M (4–6 dní).

---

#### #5 Waivers UI
**Proč pátý:** GDPR souhlas při onboardingu nového člena je zákonná povinnost. DB model + API existují.

**Co existuje:** `Waiver`, `WaiverSignature` DB modely, `waivers.routes.ts` kompletní API.
**Co chybí:** UI stránka pro admin (tvorba waivers) + člen (podpis), integrace do member invite flow.
**Základ v kódu:** `apps/web/lib/api/routes/waivers.routes.ts` (207 řádků, hotové API).
**Effort:** M (1 týden — pure FE nad existujícím API).

---

#### #6 Pricing page + paywall
**Proč šestý:** Bez pricing page nelze monetizovat. Je to kritický blocker pro jakýkoli příjem.

**Co existuje:** `limits.service.ts` (`assertMemberLimit`, `assertTeamLimit`), feature flag middleware.
**Co chybí:** Pricing page (`/pricing`), paywall UI komponenta, tier enforcement v limitsService.
**Základ v kódu:** `apps/web/lib/api/services/limits.service.ts`, `apps/web/lib/api/middleware/feature-flag.middleware.ts`.
**Effort:** M (1–1,5 týdne — FE pricing page + BE tier enforcement).

---

#### #7 Ankety/hlasování UI
**Proč sedmý:** Trenér potřebuje rychle zjistit "kolik nás přijde na sobotní trénink?". API hotové.

**Co existuje:** `polls.routes.ts` kompletní API (170 řádků, JSONB storage v `club.config`).
**Co chybí:** UI stránka + integrace do events detail (poll vázaný na event).
**Základ v kódu:** `apps/web/lib/api/routes/polls.routes.ts`.
**Effort:** S-M (3–5 dní — pure FE).

---

#### #8 Nemoc/zranění omluvenka
**Proč osmý:** Opakovaná frustrace rodičů. Dnes musí klikat NO na každý event zvlášť.

**Co existuje:** `EventAttendance`, `RSVPStatus.NO`, bulk update logika v events routes.
**Co chybí:** `AbsenceReport` DB model, `POST /members/:id/absence` endpoint, FE UI v member detail.
**Základ v kódu:** `apps/web/lib/api/routes/events.routes.ts` (bulk RSVP existuje).
**Effort:** M (1 týden — nový model + API + FE).

---

#### #9 Offline mode + Service Worker
**Proč devátý:** App je PWA (manifest existuje), ale bez SW cache je nepoužitelná bez internetu. Herna, nafukovací hala, špatný signál u hřiště.

**Co existuje:** `apps/web/app/manifest.ts`, Next.js PWA setup.
**Co chybí:** Service Worker s cache strategie pro kritická data (events, members).
**Základ v kódu:** `apps/web/app/manifest.ts`.
**Effort:** M (1 týden — next-pwa nebo custom SW).

---

#### #10 Ruční evidence platby (offline hotovost)
**Proč desátý:** Většina malých klubů v ČR vybírá hotovost. Dnes jen Stripe = digitální platba. Chybí "označit jako zaplaceno" bez Stripe.

**Co existuje:** `Fee`, `Payment`, `PaymentStatus` DB modely, `payments.routes.ts`, UI v `payments/page.tsx`.
**Co chybí:** PATCH endpoint `PATCH /payments/:id/mark-paid` pro admin, UI tlačítko "Zaplaceno v hotovosti".
**Základ v kódu:** `apps/web/app/(admin)/admin/payments/page.tsx`, `apps/web/lib/api/routes/payments.routes.ts`.
**Effort:** XS-S (1–2 dny — minimální change na existujícím kódu).

---

## 7. Monetizace — doporučený pricing model

### 7.1 Analýza současného stavu
- Stripe Connect implementovaný, checkout session funguje
- `limits.service.ts` má `assertMemberLimit` + `assertTeamLimit` — ready pro tier enforcement
- Feature flag middleware existuje — ready pro gating
- Pricing page chybí zcela

### 7.2 Doporučená tier struktura

**Zásada:** Freemium s hodnotou na Free tieru (adoptce), paywall na provozních funkcích (konverze).

```
FREE tier — "Starter"
- 1 klub
- Max 25 členů
- Max 2 týmy
- Základní eventy + RSVP
- In-app komunikace (bez push)
- Tréninková knihovna (read-only)
- Bez platební integrace
- Sport Manager branding

PRO tier — "Klub" — 490 Kč/měsíc nebo 4 490 Kč/rok
- Neomezení členové
- Neomezené týmy
- Push notifikace
- Automatické remindery
- Platby (Stripe + hotovost)
- Waivers (GDPR souhlasy)
- Ankety + hlasování
- Galerie
- CSV export
- Custom branding (white-label theme)
- Prioritní podpora

ENTERPRISE tier — "Akademie" — od 1 990 Kč/měsíc
- Vše z PRO
- Multi-klub (svaz, akademie)
- Federační sync (FAČR)
- Performance analytics + Report card PDF
- SSO (LDAP/SAML)
- Dedikovaný onboarding
- SLA 99,9 %
- Vlastní doména
```

### 7.3 Psychologie pricingu

**Free tier musí být funkční** — jinak není adopce. Limit 25 členů je reálný pro oddíl U9 (20 hráčů). Jakmile klub roste nebo chce platby a push, přejde na Pro.

**Pro = 490 Kč/měsíc** — kalkulace:
- Týmuj.cz: ~800–1500 Kč/rok za základní funkce
- Spond: zdarma (monetizuje jinak)
- TeamSnap: ~$12/měsíc
- Naše hodnota: Multi-tenant, privacy, tréninková knihovna = justifikace ceny

**Roční tarif** (4 490 Kč = 2 měsíce zdarma) — snižuje churn, zlepšuje cash flow.

**Enterprise** — kontaktní forma, custom quote. Segment: sportovní akademie, krajské svazy.

### 7.4 Implementace paywallu — doporučené paywallované funkce

| Feature | Free | Pro | Enterprise |
|---------|------|-----|------------|
| Členové | max 25 | neomezeno | neomezeno |
| Týmy | max 2 | neomezeno | neomezeno |
| Push notifikace | ne | ano | ano |
| Automatické remindery | ne | ano | ano |
| Platby (Stripe + hotovost) | ne | ano | ano |
| Waivers | ne | ano | ano |
| Ankety | ne | ano | ano |
| Galerie | ne | ano | ano |
| Custom branding (theme) | ne | ano | ano |
| CSV export | omezený | plný | plný |
| Federační sync | ne | ne | ano |
| Performance analytics | ne | ne | ano |
| Multi-klub | ne | ne | ano |

### 7.5 Revenue odhad (konzervativní)

```
Předpoklady (rok 1):
- 200 Free klubů
- 30 Pro klubů (15% konverze) = 30 × 490 = 14 700 Kč/měsíc = 176 400 Kč/rok
- 3 Enterprise kluby = 3 × 1 990 = 5 970 Kč/měsíc = 71 640 Kč/rok
- Celkem rok 1: ~250 000 Kč/rok

Rok 2 (viral growth přes turnaje, federace):
- 800 Free, 120 Pro, 10 Enterprise
- Pro: 120 × 490 = 58 800 Kč/měsíc
- Enterprise: 10 × 1 990 = 19 900 Kč/měsíc
- Celkem rok 2: ~945 000 Kč/rok
```

### 7.6 Stripe implementace paywallu

Doporučuji **Stripe Billing** (subscription) místo jednotlivých Checkout sessions pro SaaS tiery. Existující `stripe.service.ts` + `stripe.routes.ts` lze rozšířit.

---

## 8. Implementační roadmap — souhrnná

### Fáze 1 — Uzavřít kritické mezery (2–4 týdny)
**Cíl:** App bezpečná pro reálné kluby, první příjem.

1. Pricing page + paywall (Free/Pro tiers, tier enforcement)
2. Push notifikace — web push delivery (VAPID)
3. Safeguarding — DM blokace trenér-nezletilý
4. Read receipts v chatu
5. Waivers UI (nad hotovým API)

### Fáze 2 — Provozní hodnota (4–8 týdnů)
**Cíl:** Nahradit Excel, WhatsApp a Týmuj.

6. Automatické event remindery (BullMQ worker)
7. Ankety/hlasování UI
8. Nemoc/zranění omluvenka
9. Ruční evidence platby (offline hotovost)
10. Galerie (foto upload)
11. Opakující se eventy (série)
12. Federační sync UI (FAČR)
13. Offline mode + Service Worker

### Fáze 3 — Diferenciace a růst (8–16 týdnů)
**Cíl:** Platformový produkt, virální šíření přes turnaje a akademie.

14. Carpooling / Event tasks
15. Zdravotní záznamy UI
16. Domácí úkoly (homework)
17. Performance analytics + Report card PDF
18. Turnajový modul (bracket, live score)
19. Expo mobilní app (iOS/Android)

---

## 9. Klíčová rizika

| Riziko | Dopad | Pravděpodobnost | Mitigace |
|--------|-------|-----------------|----------|
| Neon free tier DB limity | Kritický | Střední | Monitorovat, upgrade plán |
| Stripe webhooks v Vercel (timeout) | Vysoký | Nízká | Edge functions nebo dedicated webhook handler |
| Push delivery spam (uživatel odhlásí) | Střední | Střední | Preference granularity, opt-out per typ |
| GDPR compliance (medical data) | Kritický | Střední | Šifrování na app layer pro `medicalNotes` |
| Spond vstup na CZ trh (bezplatný) | Vysoký | Střední | Rychlá diferenciace přes Federation sync + privacy |
| Onboarding drop-off (wizard 4 kroky) | Střední | Střední | A/B test, zjednodušit na 2 kroky |

---

## 10. Metriky úspěchu produktu

| Metrika | Aktuální baseline | Cíl 6 měsíců | Cíl 12 měsíců |
|---------|-------------------|--------------|---------------|
| Aktivní kluby | ~2 (seed data) | 50 | 200 |
| Pro konverze | 0 % | 15 % | 20 % |
| RSVP response rate | neměřeno | >70 % | >80 % |
| Týdenní aktivita (DAU/MAU) | neměřeno | >40 % | >55 % |
| Churn rate (Pro) | - | <5 %/měsíc | <3 %/měsíc |
| Push notification opt-in | 0 % | >60 % | >75 % |
| NPS skóre | neměřeno | >40 | >55 |

---

## 11. Persony (aktualizované)

### Persona 1: Martin — trenér mládeže U13
- 38 let, učitel ZŠ, trenér dobrovolník 2x týdně
- Bolesti: WhatsApp chaos, rodiče nereagují na zprávy, Excel docházka
- Dnes: WhatsApp skupina + Excel + Týmuj.cz (placený)
- Potřebuje: Rychlé RSVP, bulk remind, read receipts, tréninková příprava
- Trigger konverze: "Ráno mi přijde push se stavem RSVP na dnešní trénink"

### Persona 2: Petra — rodič (matka hráče U11)
- 35 let, pracující máma, telefon Android
- Bolesti: 15 WhatsApp skupin pro 3 sporty, zapomíná potvrdit účast
- Dnes: WhatsApp + papírový seznam docházky od trenéra
- Potřebuje: Jednoduchý push "potvrď dnešní trénink", vidět docházku syna
- Trigger konverze: Magic link RSVP z emailu — "nikdo ji nenutí registrovat se"

### Persona 3: Václav — správce klubu (admin)
- 52 let, ekonom klubu, dobrovolník
- Bolesti: Excel evidence plateb, ruční faktury, GDPR souhlasy na papíře
- Dnes: Tabulka Excel + bankovní výpisy + papírové souhlasy
- Potřebuje: Přehled plateb, export, waivers, roční uzávěrka
- Trigger konverze: Payment dashboard s exportem + waivers = eliminuje 3 nástroje

### Persona 4: Lukáš — ředitel sportovní akademie
- 44 let, profesionál, 5 týmů, 120 hráčů
- Bolesti: 5 různých aplikací pro 5 týmů, bez výkonnostního sledování, FAČR ruční
- Dnes: TeamSnap (US verze) + Sportlyzer + Google Sheets
- Potřebuje: Multi-klub, federační sync, performance analytics, white-label
- Trigger konverze: Multi-tenant + FAČR sync = "konečně vše na jednom místě"

---

## Závěrečné doporučení

**Strategická priorita #1** je pricing page + paywall — bez revenue není produkt. Infrastruktura (limits.service + feature flags) je připravena, jde o 1–1,5 týdne práce.

**Strategická priorita #2** jsou push notifikace + automatické remindery — to je jediný důvod, proč uživatel neodejde ke Spond. Toto zavře hlavní UX mezeru.

**Strategická priorita #3** je Federační sync (FAČR) — nejsilnější diferenciátor pro CZ trh, API stub existuje. Žádný přímý competitor to nemá automatizované. Otevírá segment "fotbalové kluby v soutěži" = tisíce potenciálních zákazníků.

**Doporučuji nezačínat** performance analytics, turnajovým modulem ani Expo app — jsou to velké investice s podmínkou existence zákaznické báze.

---

---HANDOFF---
OD: produktovy-manazer
KOMU: projektovy-manazer
STATUS: hotovo
VÝSTUP: /Users/tm/workspaces/projects/sport-manager/projekty/pm-analyza-2026-05/produktova-analyza.md
DALŠÍ KROK: PM přečte analýzu, potvrdí priority s Tomášem a deleguje:
  1. Business analytik — detailní spec pro Fázi 1 (pricing page, push notifikace, safeguarding, waivers UI)
  2. UX Designér — pricing page wireframe, paywall UX, push opt-in flow
  3. Backend vývojář — Stripe Billing setup, VAPID push delivery, BullMQ worker
OTÁZKY:
  1. Pricing: 490 Kč/měsíc Pro tier — souhlasíš s cenou? Nebo chceš jiný model (per-člen, per-tým)?
  2. Push provider: web push (VAPID, PWA) nebo čekáme na Expo app a děláme FCM/APNs?
  3. Federační sync priorita: FAČR jako Fáze 2 nebo až Fáze 3? Máme adaptor stub, ale scraping FAČR portálu je juridický risk.
  4. Self-host tier: chceme nabízet self-host jako Enterprise variantu, nebo jen SaaS?
---/HANDOFF---
