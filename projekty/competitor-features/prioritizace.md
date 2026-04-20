# Produktová vize: Prioritizace features z konkurence
**Od:** Produktový manažer
**Pro:** Business analytik, UX Designér, Backend vývojář, tým
**Datum:** 2026-04-18
**Projekt:** Club App — Konkurencni feature gap analýza (Spond / Sportlyzer / Heja)

---

## Kontext a výchozí stav

MVP je funkční: auth + RBAC, events + RSVP, messaging (6 typů konverzací), notifications, training templates, feature flags, multi-tenant RLS. V DB schématu existují modely `Fee`, `Payment`, `Waiver`, `WaiverSignature` — bez API a bez UI.

Tato analýza porovnává 9 features z Spond, Sportlyzer a Heja, řadí je podle MoSCoW pro naši situaci a navrhuje implementační fáze.

---

## MoSCoW Prioritizace

### Rozhodovací kritéria

| Kritérium | Váha | Popis |
|-----------|------|-------|
| Dopad na retenci | 30 % | Odejde uživatel, pokud to nemáme? |
| Existuje základ v kódu | 25 % | Je DB model / service stub / feature flag hotový? |
| Effort vs. hodnota | 25 % | Poměr investice k získanému efektu |
| Diferenciace | 20 % | Odlišuje nás to od Týmuj.cz / Spond? |

---

## 1. Must Have (MVP blocker)

### F-07: Read receipts (per-message) — Heja

**Zdůvodnění:** `lastReadAt` per participant je v DB (`ConversationParticipant.lastReadAt`). Jde o 1–2 dny práce navíc. Uživatelé messaging platformy bez read receipts hodnotí jako nedodělek. Spond i Heja to mají. Riziko: bez toho trenér neví, jestli sdělení dorazilo.

**User story:**
> Jako trenér chci vidět, kdo ze skupiny přečetl mou zprávu, abych věděl, na koho se ještě obrátit osobně.

**Acceptance criteria:**
- Na každé zprávě v skupinovém chatu (TEAM, COACHES, PARENTS, ANNOUNCEMENT) se zobrazí ikona oka s počtem přečtení.
- Po rozkliknutí ikony se zobrazí seznam členů: jméno + timestamp posledního přečtení.
- DM konverzace zobrazují pouze "Přečteno" / "Doručeno" (bez jmenného seznamu — jde o 1:1).
- `lastReadAt` se aktualizuje při vstupu do konverzace (existující endpoint nebo nový PATCH).
- Pouze odesílatel a trenér vidí detail přečtení. Ostatní účastníci vidí jen svůj vlastní stav.

**Závislosti na existujícím kódu:**
- `ConversationParticipant.lastReadAt` — existuje v DB.
- `ConversationsService` — existuje, přidat metodu `getReadReceipts(conversationId, messageId)`.
- FE chat view — existuje, přidat read-receipt UI komponentu.
- Nový kontrakt v `@branik/contracts`: `ReadReceiptDto`.

**Effort:** S (3–4 dny BE + FE)

---

### F-08: Smart Reminders — Heja / Spond

**Zdůvodnění:** `RSVP_REMINDER` a `EVENT_CREATED` notifikace jsou v DB jako typy. `PushToken` model existuje. Bez automatických připomenutí musí admin posílat ručně — to je hlavní bolest rodičů ze zpětné vazby na Týmuj. Dopad na retenci = vysoký.

**User story:**
> Jako rodič chci automaticky dostat push notifikaci ráno v den tréninku, abych nezapomněl odvézt syna.

**Acceptance criteria:**
- Při každém eventu se automaticky naplánuje reminder pro každého účastníka (YES/PENDING RSVP).
- Výchozí časy: ráno v 8:00 místního času + 3 hodiny před začátkem.
- Admin může v nastavení klubu změnit výchozí časy (feature flag / config).
- Uživatel může v profilu reminder vypnout nebo změnit čas (opt-out).
- Pokud RSVP = NO, reminder se nepošle.
- Worker je idempotentní — opakované spuštění nevytváří duplikáty.

**Závislosti na existujícím kódu:**
- `NotificationType.RSVP_REMINDER` a `EVENT_CREATED` — existují.
- `PushToken` model — existuje, chybí push delivery provider (FCM/APNs nebo web push).
- `NotificationsService` — existuje, přidat metodu `scheduleEventReminders(eventId)`.
- `Club.config` — existuje, přidat `reminders: { morningHour, preEventMinutes }`.
- Nový NestJS `ScheduleModule` worker nebo Bull queue — greenfield, ale malý scope.
- Nový DB model pro `ScheduledReminder` (idempotency key) — nutné.

**Effort:** M (1–1,5 týdne BE + infra)

---

### F-09: Safeguarding (blokace DM trenér ↔ nezletilý) — Heja

**Zdůvodnění:** Právní a reputační riziko číslo jedna pro sportovní kluby s mládeží. V ČR narůstají požadavky po incidentech v organizovaném sportu. `Member.isMinor` existuje. `GuardianLink` existuje. Bez ochrany nelze nasadit app u klubu s U9–U15. Pro Spartak Kbely (U9 tým) je to blocker.

**User story:**
> Jako rodič chci mít jistotu, že trenér nemůže navázat soukromou konverzaci s mým nezletilým dítětem bez mého vědomí.

**Acceptance criteria:**
- Systém blokuje vytvoření DM konverzace mezi členem s rolí COACH/HEAD_COACH a členem s `isMinor = true`.
- Povolené alternativy: GROUP konverzace s guardiany jako účastníky, nebo PARENTS kanál.
- Existující DM (pokud nějaké jsou) jsou označeny jako "vyžaduje kontrolu" při zapnutí funkce.
- Admin klubu dostane audit log každého pokusu o vytvoření blokované DM.
- Nastavení je per-klub přes feature flag `safeguarding: true`.
- Výjimky (např. starší mládeže 17–18 let) jsou konfigurovatelné přes `Club.config`.

**Závislosti na existujícím kódu:**
- `Member.isMinor` — existuje.
- `GuardianLink` — existuje.
- `ConversationsService.create()` — existuje, přidat guard.
- Feature flags `Club.features` — existuje, přidat klíč `safeguarding`.
- `ClubFeatureAudit` — existuje pro auditování admin akcí.
- Nový audit model pro `SafeguardingEvent` — malý greenfield.

**Effort:** S–M (4–6 dní BE + FE guard)

---

## 2. Should Have (Fáze 2)

### F-02: Payment dashboard — Spond

**Zdůvodnění:** `Fee`, `Payment`, `PaymentStatus` modely jsou kompletní v DB. Chybí API a UI. Bez přehledu plateb musí admin tabulkovat v Excelu — to je hlavní důvod proč kluby platí za Týmuj treasury modul. Velký business value, ale Stripe integrace zvyšuje effort.

**User story:**
> Jako správce klubu chci vidět přehled, kdo zaplatil sezónní příspěvek a kdo má dluh, abych mohl posílat výzvy k úhradě přímo z aplikace.

**Acceptance criteria:**
- Admin vidí seznam všech poplatků (Fee) s aggregátem: zaplaceno / dluženo / celkem.
- Pro každý poplatek: seznam členů s jejich stavem (PAID / PENDING / FAILED) a datem úhrady.
- Filtr: tým, stav platby, časové období.
- Akce "Připomenout" odešle push + in-app notifikaci `PAYMENT_DUE` vybranému členu.
- Payer vidí vlastní přehled plateb v profilu.
- MVP bez automatické online platby (Stripe) — pouze ruční označení "zaplaceno" adminem.
- V2: Stripe Payment Intent pro online platbu (pole `stripePaymentIntentId` je v DB připraveno).

**Závislosti na existujícím kódu:**
- `Fee`, `Payment`, `PaymentStatus` — existují v DB, nulové API.
- `NotificationType.PAYMENT_DUE` — existuje.
- `NotificationsService` — existuje.
- `GuardianLink.canViewPayments`, `canMakePayments` — existují.
- Nový `PaymentsModule` v NestJS — greenfield API.
- Nový `@branik/contracts` schéma pro `FeeDto`, `PaymentDto` — greenfield.
- Nová FE stránka `/admin/payments` — greenfield.

**Effort:** L (2–3 týdny BE + FE, bez Stripe); XL (4–5 týdnů s Stripe)

---

### F-04: Illness/Injury modul — Sportlyzer

**Zdůvodnění:** Globální omluva (ne per-event) je kritická pro rodiče s nemocným dítětem. Dnes musí rodič odmítat každý trénink zvlášť. Středně vysoký dopad na retenci, nízký technický risk, střední effort. Úzce navazuje na RSVP systém.

**User story:**
> Jako rodič chci nahlásit jedním kliknutím, že je syn nemocný a bude chybět celý příští týden, aniž bych musel odmítat každý trénink zvlášť.

**Acceptance criteria:**
- Rodič/člen může vytvořit "Omluvenku" s rozsahem dat (od–do) a volitelným důvodem.
- Systém automaticky nastaví RSVP = NO pro všechny eventy v daném rozsahu pro daného hráče.
- Trenér vidí u hráče v RSVP rostu badge "Nemoc/Zranění" s daty platnosti.
- Omluvenka se automaticky ukončí po `validUntil` datu.
- Trenér dostane notifikaci při vytvoření omluvenky (nový `NotificationType.ABSENCE_REPORTED`).
- Admin může omluvenku smazat nebo zkrátit.

**Závislosti na existujícím kódu:**
- `EventAttendance` + `RSVPStatus.NO` — existují, bulk update je nový.
- `Member` — existuje, přidat vztah na nový model `AbsenceReport`.
- `NotificationsService` — existuje, přidat nový typ.
- Nový DB model `AbsenceReport` — greenfield (malý: memberId, from, until, reason, createdById).
- Nový API endpoint `POST /members/:id/absence` — greenfield.
- Nová FE komponenta v event detail + member profile.

**Effort:** M (1–1,5 týdne BE + FE)

---

### F-01: Carpooling/Tasks — Spond

**Zdůvodnění:** Logistika odvozu je reálná bolest rodičů u dětských oddílů. Spond na tom staví silnou retenci. Pro náš primary use case (Braník + Spartak) je vysoce relevantní. Technicky jde o nový modul bez přímého základu v kódu.

**User story:**
> Jako trenér chci k tréninku přidat úkol "Odvoz z Braníku" a přiřadit ho rodičům, kteří potom potvrdí, jestli mohou vzít dalšího hráče.

**Acceptance criteria:**
- K eventu lze přidat libovolný počet "úkolů" (Task) s popisem, počtem slotů a termínem.
- Konkrétní úkol lze přiřadit konkrétnímu členovi nebo nechat jako "otevřený" (kdo se přihlásí).
- Člen dostane notifikaci při přiřazení úkolu.
- Trenér vidí přehled úkolů u eventu: splněno / nesplněno / nepřiřazeno.
- Carpool specificky: zadání počtu míst v autě, systém zobrazí zbývající kapacitu.
- MVP bez geolokace — jen textový popis místa srazu.

**Závislosti na existujícím kódu:**
- `Event` — existuje, přidat vztah na nový model `EventTask`.
- `Member` — existuje.
- `NotificationsService` — existuje.
- Nový DB model `EventTask` — greenfield.
- Nový API modul `EventTasksModule` — greenfield.
- Nová FE sekce v event detail.

**Effort:** M–L (1,5–2 týdny BE + FE)

---

## 3. Could Have (Fáze 3)

### F-05: Performance analytics — Sportlyzer

**Zdůvodnění:** Vysoký "wow efekt" pro rodiče a ambiciózní hráče, ale nulový základ v DB. Vyžaduje nový datový model pro testy, metriky a časové řady. Riziko: bez kvalitních dat od trenérů je analytika prázdná. Doporučuji nejdříve vyřešit attendance statistiky (jednodušší, data máme).

**User story:**
> Jako trenér chci zaznamenat výsledky fyzických testů (sprint 30m, skok z místa) a sdílet "Report card" s rodiči po každém přezkoušení.

**Acceptance criteria:**
- Trenér může vytvořit testový protokol (sada metrik s měrnými jednotkami).
- Pro každého hráče lze zadat naměřené hodnoty per test.
- Hráč/rodič vidí vlastní výsledky s grafem vývoje v čase.
- Porovnání s průměrem týmu (anonymní).
- Export do PDF pro rodiče (Report card).
- Přístup přísně per-GuardianLink (rodič vidí jen své dítě).

**Závislosti na existujícím kódu:**
- `Member`, `Team`, `GuardianLink` — existují.
- Nové DB modely: `TestProtocol`, `TestSession`, `TestResult` — greenfield.
- Nový API modul — greenfield.
- Nová FE stránka + grafy (recharts / nivo).

**Effort:** XL (4–6 týdnů BE + FE + UX)

---

### F-06: Domácí úkoly (Homework) — Sportlyzer

**Zdůvodnění:** Diferenciace od Týmuj, ale nízká okamžitá poptávka u tradičních fotbalových klubů. Vhodné pro akademie a kluby se silným rozvojovým programem. Přidá hodnotu v V3.

**User story:**
> Jako trenér chci přiřadit hráčům video cvičení na driblink a oni mi potvrdí splnění před příštím tréninkem.

**Acceptance criteria:**
- Trenér vytvoří "úkol" s popisem, volitelným URL videa a termínem odevzdání.
- Úkol lze přiřadit celému týmu nebo jednotlivým hráčům.
- Hráč označí úkol jako "Splněno" s volitelným komentářem.
- Trenér vidí přehled splnění per hráč.
- Integrace do kalendářního view (homework jako samostatný typ eventu nebo attachment k PRACTICE).
- Notifikace při přiřazení a den před termínem.

**Závislosti na existujícím kódu:**
- `TrainingTemplate` / `Event` — existují, možná integrace.
- `NotificationsService` — existuje.
- Nový DB model `Homework` — greenfield.
- Nová FE sekce.

**Effort:** L (2–3 týdny)

---

## 4. Won't Have (nyní)

### F-03: Coaches Corner — Spond

**Zdůvodnění:** `ConversationType.COACHES` je v DB i API hotový. Jde pouze o UX/UI práci — přidat dedikovaný vstupní bod v navigaci pro trenéry a vizuálně odlišit kanál. Toto není feature gap, je to UI polish. Vyřeší se v rámci messaging UI upgradu, ne jako samostatný projekt.

**Akce:** Přidat do backlogu UI polish spolu s messaging redesignem. Effort: XS.

---

## Souhrn MoSCoW tabulka

| # | Feature | Platforma | MoSCoW | Effort | DB základ | Fáze |
|---|---------|-----------|--------|--------|-----------|------|
| F-07 | Read receipts | Heja | Must | S | Ano (`lastReadAt`) | 1 |
| F-08 | Smart Reminders | Heja/Spond | Must | M | Částečný (`PushToken`, `NotificationType`) | 1 |
| F-09 | Safeguarding | Heja | Must | S–M | Ano (`isMinor`, `GuardianLink`) | 1 |
| F-02 | Payment dashboard | Spond | Should | L (bez Stripe) | Kompletní (`Fee`, `Payment`) | 2 |
| F-04 | Illness/Injury | Sportlyzer | Should | M | Ne (nový model) | 2 |
| F-01 | Carpooling/Tasks | Spond | Should | M–L | Ne (nový model) | 2 |
| F-05 | Performance analytics | Sportlyzer | Could | XL | Ne (3 nové modely) | 3 |
| F-06 | Domácí úkoly | Sportlyzer | Could | L | Ne (nový model) | 3 |
| F-03 | Coaches Corner | Spond | Won't | XS | Kompletní | — |

---

## Implementační fáze

### Fáze 1 — Bezpečnost a komunikační základ (2–3 týdny)

**Cíl:** Uzavřít kritické právní a UX mezery před nasazením v klubech s mládeží.

**Pořadí:**
1. **F-09 Safeguarding** — první, protože blokuje nasazení u Spartak Kbely U9. Čistý guard v existujícím kódu. Nízké riziko regrese.
2. **F-07 Read receipts** — využívá existující `lastReadAt`, rychlé vítězství. Zvýší adoption messagingu.
3. **F-08 Smart Reminders** — nutné rozhodnutí o push delivery provideru (FCM vs. web push). Navazuje na `PushToken` model. Paralelně s F-07 pokud máme dva vývojáře.

**Výstup fáze:** App bezpečná pro nasazení v klubech s mládeží, messaging s read receipts, automatické připomenutí.

---

### Fáze 2 — Provozní funkce (4–6 týdnů)

**Cíl:** Odstranit nutnost externích nástrojů (Excel pro platby, WhatsApp skupiny pro odvoz).

**Pořadí:**
1. **F-02 Payment dashboard** — největší business value, DB je kompletní. Bez Stripe MVP = ruční evidence. Generuje příjem (SaaS tier nebo za platební integraci).
2. **F-04 Illness/Injury** — malý greenfield model, velká UX úleva pro rodiče. Doporučuji jako "quick win" v polovině fáze pro udržení momentum.
3. **F-01 Carpooling/Tasks** — největší greenfield v této fázi. Silná diferenciace. Doporučuji na konec fáze, kdy tým má rytmus.

**Výstup fáze:** Klub může provozovat finance, rodiče hlásí absence jedním kliknutím, logistika odvozu v appce.

---

### Fáze 3 — Diferenciace a rozvoj (6–10 týdnů)

**Cíl:** Přidat funkce, které z aplikace dělají platformu pro rozvoj hráče — a tím se odlišit od Týmuj i Spond.

**Pořadí:**
1. **F-06 Domácí úkoly** — jednodušší než analytics, ale buduje návyk hráčů a trenérů pracovat s appkou mimo trénink. Připraví půdu pro analytics data.
2. **F-05 Performance analytics** — vyžaduje data (testy, attendance historii). Dává smysl až po F-06 a po 2–3 měsících provozu.

**Výstup fáze:** Platforma pro rozvoj hráče, "Report card" pro rodiče, diferenciace od Týmuj.

---

## Existující základ vs. Greenfield

### Rozšíření existujícího kódu (nízké riziko)

| Feature | Co rozšiřujeme |
|---------|----------------|
| F-07 Read receipts | `ConversationParticipant.lastReadAt` + `ConversationsService` + FE chat |
| F-08 Smart Reminders | `NotificationsService` + `PushToken` + `Club.config` |
| F-09 Safeguarding | `ConversationsService.create()` guard + `Club.features` |
| F-02 Payment dashboard | Kompletní DB (`Fee`, `Payment`) → nový API module + FE |
| F-03 Coaches Corner | Pouze UI/nav change (Won't) |

### Greenfield modely (vyšší risk, nutná architektura)

| Feature | Nový DB model | Poznámka |
|---------|---------------|----------|
| F-08 Smart Reminders | `ScheduledReminder` | Idempotency key, worker job |
| F-04 Illness/Injury | `AbsenceReport` | Jednoduchý model, malé riziko |
| F-01 Carpooling/Tasks | `EventTask`, `TaskAssignment` | Střední komplexita |
| F-09 Safeguarding | `SafeguardingAuditEvent` | Volitelné, doporučuji |
| F-06 Homework | `Homework`, `HomeworkCompletion` | Střední komplexita |
| F-05 Performance analytics | `TestProtocol`, `TestSession`, `TestResult` | Vysoká komplexita, časové řady |

---

## Klíčové závislosti a rizika

### Riziko 1: Push provider (F-08)
Smart Reminders vyžadují rozhodnutí o push delivery: FCM (Android), APNs (iOS), nebo web push pro PWA. Pokud je MVP pouze web appka, postačí web push s `@web-push` library. Doporučuji rozhodnout před startem Fáze 1.

**Akce pro BA:** Specifikovat cílové platformy (web / nativní app).

### Riziko 2: Stripe integrace (F-02)
MVP payment dashboard bez Stripe = ruční evidence s "Označit jako zaplaceno". To je akceptovatelné pro V1. Stripe přidá 2–3 týdny navíc + compliance overhead (PCI DSS). Doporučuji oddělit jako samostatný projekt v plánu.

**Akce pro BA:** Definovat, jestli V1 payment dashboard potřebuje online platbu nebo stačí offline evidence.

### Riziko 3: Attendance historická data pro analytics (F-05)
Performance analytics v Fázi 3 bude prázdná, pokud nemáme data. `EventAttendance.attended` (coach marks) je v DB — nutné zajistit, aby trenéři toto pole skutečně vyplňovali od Fáze 1. Doporučuji přidat coach-side "Uzavřít docházku" flow jako prerequisitu.

### Riziko 4: GDPR a medical data (F-04)
`AbsenceReport` s důvodem může obsahovat zdravotní informace. `Member.medicalNotes` je v DB s poznámkou "encrypted at app layer" — stejné pravidlo musí platit pro `AbsenceReport.reason`. Nutná konzultace se security specialistou před implementací.

---

## Metriky úspěchu (per fáze)

### Fáze 1
- **Read receipts:** 70 % trenérů ověří přečtení zprávy do 24h od nasazení.
- **Smart Reminders:** RSVP response rate vzroste z X % na X+15 % (měřit baseline před nasazením).
- **Safeguarding:** 0 DM konverzací trenér–nezletilý v audit logu po nasazení.

### Fáze 2
- **Payments:** 80 % plateb evidováno v appce (ne v Excelu) do 60 dní.
- **Illness/Injury:** Počet "ručních" RSVP=NO per event klesne o 40 % (omluvenky nahradí opakované klikání).
- **Carpooling:** 50 % eventů s dojíždějícími hráči má vytvořený aspoň jeden carpool task.

### Fáze 3
- **Homework:** Průměrně 3 úkoly/tým/měsíc do 3 měsíců od nasazení.
- **Performance analytics:** 60 % týmů má zapsanou aspoň jednu testovací session za sezónu.

---

## Závěrečné doporučení

Strategická priorita č. 1 je uzavřít bezpečnostní a komunikační mezery (Fáze 1) před jakýmkoliv marketingem nebo novými uživateli. Bez Safeguardingu nelze zodpovědně nasadit appku u U9 Spartak Kbely.

Strategická priorita č. 2 je Payment dashboard — jako jediná feature má přímý dopad na byznys model (SaaS tier "Finance"). DB je kompletní, value je okamžitá.

Performance analytics je jediná feature, kde doporučuji explicitně počkat — data pro analytics musí nejdřív existovat. Spustit dříve = prázdné grafy = frustrace uživatelů.

---

## Další kroky pro tým

| Role | Akce |
|------|------|
| Business analytik | Specifikovat F-09, F-07, F-08 do detailních funkčních požadavků (user flows, edge cases) |
| Business analytik | Rozhodnout: push provider pro Smart Reminders (web push vs. FCM) |
| Business analytik | Rozhodnout: Payment V1 s online platbou nebo bez (Stripe scope) |
| Softwarový architekt | Navrhnout `ScheduledReminder` DB model a worker architektura |
| Softwarový architekt | Navrhnout `AbsenceReport` model + bulk RSVP update logiku |
| UX Designér | Navrhnout read receipt UI (ikona, detail panel, mobil-first) |
| UX Designér | Navrhnout Safeguarding UX (error state, alternative suggestion) |
| Security specialista | Review GDPR dopadů pro `AbsenceReport.reason` a health data |

---

---HANDOFF---
OD: produktovy-manazer
KOMU: projektovy-manazer
STATUS: hotovo
VÝSTUP: /Users/tm/workspaces/projects/branik/projekty/competitor-features/prioritizace.md
DALŠÍ KROK: PM přečte dokument, potvrdí priority s uživatelem a deleguje Fázi 1 na: business-analytik (detailní spec F-09/F-07/F-08) + softwarovy-architekt (DB modely pro F-08/F-09) + ux-designer (read receipts UI, safeguarding UX).
OTÁZKY:
  1. Push provider: chceme web push (PWA only) nebo plánujeme nativní app → FCM/APNs? Ovlivní effort F-08 o 1–2 týdny.
  2. Payment V1: ruční evidence "zaplaceno" adminem stačí, nebo chceme Stripe hned? Stripe = +3 týdny a compliance overhead.
  3. Safeguarding výjimky: blokovat DM pro všechny nezletilé (isMinor=true) nebo jen do 15 let? Upřesní scope F-09.
---/HANDOFF---
