# Brief pro design agenta — branik jako „nejlepší team management ever"

> Tento dokument je kompletní zadání pro `ux-designer` + `ui-designer` agenty. Načti si ho celý, pak začni výstupy. Repo cesty jsou relativní ke kořeni `branik/`.

---

## 1. Co je branik

Multi-tenant SaaS pro řízení sportovních klubů. Stavíme primárně pro:
- **ABC Braník** (mládežnický fotbal, 35 členů, 9 týmů)
- **TJ Spartak Kbely U9** (mládežnický fotbal, 32 členů, 1 tým)

Cílová pozice: **náhrada za Týmuj.cz / TeamSnap / Spond**, ale lepší v UX a „self-hostable white-label" pro libovolný klub. Top 15 feature backlog vychází z analýzy Týmuj.

Aplikace pokrývá: **kalendář tréninků a zápasů, RSVP, attendance, komunikace (chat per tým / per role / DM), notifikace, členská evidence, platební přehled, tréninkové šablony, dashboard.**

---

## 2. Persony

| Persona | Příklad | Co řeší denně |
|---|---|---|
| **Club Admin / Owner** | Jan Novák (ABC Braník) | Účtuje členům, dělá audity, sleduje obsazenost tréninků |
| **Head Coach** | Martin Procházka | Plánuje tréninky, dělá attendance, komunikuje s rodiči |
| **Parent** | Lucie Pecková (Mom), Tomáš Mertin (Dad) | RSVP za dítě, čte oznámení, platí příspěvky |
| **Player (teenager)** | Alex Mertin (16) — *zároveň* hráč U18 v Braníku **a** asistent trenéra U9 v Kbelích | RSVP sám za sebe, kouká na rozpis |
| **Guest** | Trial / pozvaný | Read-only kalendář |

**Kritické UX případy, které musí design vyřešit:**

1. **Multi-role na jedné osobě.** Alex je `PLAYER` v jednom týmu **a** `ASSISTANT_COACH` v jiném. Topbar má DEV role-switcher (Admin/Coach/Parent), ale produkčně musí UI inteligentně přepínat mode podle kontextu obrazovky, ne podle globálního přepínače.
2. **Multi-tenant na jedné osobě.** Alex je v Braníku **i** v Kbelích. Potřebuje plynulé přepínání klubů (jako Slack workspaces).
3. **Privacy-by-participation.** Dad nesmí vidět DM mezi Mom + Coach, i když jsou ve stejném klubu. Konverzace zobrazuj jen pokud je user `ConversationParticipant`.
4. **Rozvedení rodiče.** Mom a Dad mají oba `GuardianLink` na Alexe, každý s jinou permission maskou (Mom: payments=true, Dad: payments=false). UI musí každému ukazovat jen to, na co má právo, **bez** toho aby druhý rodič věděl, že druhá strana něco vidí navíc.
5. **Hráč 16+ je polo-self-managing.** Může RSVPnout sám za sebe, ale rodič to taky vidí a může to přepsat.

---

## 3. Aktuální stav implementace (co existuje, co lze měnit)

### Hotová UI (v `apps/web/app/(admin)/admin/`)
- `page.tsx` — Dashboard: This Week + Needs Attention + Quick Actions + Recent Activity
- `events/` — list + **calendar view** (month grid, čeština, today highlight) + event detail s RSVP roster + create form
- `members/` — list + detail (tabs: profil, attendance, platby, waivery)
- `teams/` — list
- `messages/` — inbox + chat view (bubliny, date separators, optimistic updates)
- `account/` — profil
- `payments/` — placeholder
- `design-preview/` — **5 vizuálních směrů** k výběru, prozkoumat než navrhneš novou identitu

### Komponenty
- `apps/web/components/` — sidebar (left, role-aware), topbar (s notification bell, role switcher, theme toggle), shadcn/ui primitives
- Brand: **modrá ABC Braník `#609bc6`** (HSL `205 47% 55%`), light + dark přes `next-themes`
- Tailwind + shadcn/ui

### Co ještě chybí FE (BE už hotové)
- **Training Templates UI** — `/admin/training-templates` stránka
- **Bulk RSVP** — coach zaškrtne celý tým → YES/NO za všechny najednou
- **Attendance statistiky** — heatmap / chart kdo chodí
- **Notifikační inbox** (bell otevírá dropdown, ale plnohodnotná stránka chybí)
- **Per-tenant feature flag UI** pro platform admin
- **Mobile app (Expo)** — zatím stub, čeká na design

---

## 4. Co znamená „nejlepší team management ever"

Definice (v pořadí priority):

1. **Rychlejší než Týmuj v RSVP flow.** Coach pošle pozvánku, rodič musí RSVPnout do 2 kliknutí na mobilu. **Žádný login, pokud má magic link v notifikaci.**
2. **Jediné místo, kde rodič hledá info o dítěti.** Příští trénink, kolik dluží, kdo trénuje, fotky z víkendu, podepsané souhlasy. Nesmí muset chodit na FB skupinu / WhatsApp / mail.
3. **Trenér nemusí být IT specialista.** Plánovat 4 týdny tréninků = 1 obrazovka, šablona Út+Čt 16:30, hotovo.
4. **Privacy serious.** Žádný „leak" mezi rozvedenými rodiči, žádné cross-club info. Default = nejstriktnější. UI ukazuje user, co vidí ostatní (transparency).
5. **Look & feel**: ne nudný admin dashboard. Sport, energie, ale **klidná typografie**, ne hřejivé „motivační" hlášky. Vibe = Linear / Notion, ne Yahoo Mail.

---

## 5. Konkrétní deliverables — co chci od tebe

### Fáze 1 — UX (ux-designer)
1. **User flow diagrams** pro 4 hot path scénáře:
   - Rodič RSVPuje na trénink z notifikace (ideálně bez loginu)
   - Coach plánuje 4 týdny tréninků pomocí šablony
   - Admin dělá bulk attendance po tréninku (40 dětí, 30 sekund)
   - Hráč 16+ vidí svůj rozvrh + RSVPuje sám
2. **Information architecture** — finální left-nav struktura (3 mode: Admin / Coach / Parent / Player)
3. **Wireframes** (low-fi, jen layout) pro chybějící obrazovky:
   - `/admin/training-templates` (list + create + edit)
   - Bulk attendance UI (vyber tým → tabulka s checkboxy → save)
   - Bulk RSVP UI (coach pro tým, rodič pro děti)
   - Notification inbox (plnohodnotná stránka, ne dropdown)
4. **Mobile flow** — Expo app primárně Player + Parent. Co se liší od webu, co stejné.

Výstup: `projekty/team-management-redesign/ux/*.md` + ASCII / Mermaid wireframy nebo odkaz na Figma.

### Fáze 2 — Vizuální identita (ui-designer + brand-designer)
1. **Vyber 1 z 5 směrů v `/admin/design-preview/`** (nebo navrhni 6.) a zdůvodni
2. **Design tokeny** — barevný systém, typografická škála, spacing, radius, shadow, motion principles. Light + Dark.
3. **Component library spec** — všechny shadcn primitives převedené na branik tokeny: Button, Card, Input, Table, Badge, Dialog, DropdownMenu, Tabs, Avatar, Toast. Každý 3+ stavy.
4. **Hi-fi mockupy** klíčových obrazovek (light + dark):
   - Dashboard (Admin / Coach / Parent verze)
   - Calendar (month + week + agenda)
   - Event detail s RSVP roster
   - Messages chat
   - Member detail
   - Mobile RSVP flow

Výstup: `projekty/team-management-redesign/ui/*.md` + obrázky / Figma link.

### Fáze 3 — Handoff developerům (ui-designer)
- Pro každou obrazovku: layout grid, breakpointy, spacing, copy (česky), edge cases (empty / loading / error / offline), a11y poznámky (kontrast, keyboard nav, screen reader labels).

---

## 6. Co **nedělej**

- ❌ Neotvírej nové barevné palety bez kotvy v `#609bc6`. Brand modrá Braník je daná.
- ❌ Žádné stock motivační fotky sportovců na hero. Jsme nástroj, ne fitness app.
- ❌ Žádné AI chat-bot maskoty.
- ❌ Nedělej landing page / marketing web — to řeší `web-designer` separátně.
- ❌ Nepíš code. Tvůj výstup jsou specifikace, ne PR.
- ❌ Nepiš anglicky — produkt je česky, copy + popisky stavů česky.

---

## 7. Kontext souborů, které stojí za prozkoumání

```
apps/web/app/(admin)/admin/             # Existující obrazovky
apps/web/app/(admin)/admin/design-preview/  # 5 směrů k výběru
apps/web/components/                    # Komponenty + topbar/sidebar
apps/web/app/globals.css                # CSS variables (brand modrá)
apps/web/tailwind.config.ts             # Theme extension
projekty/design-system/                 # Existující design rozhodnutí
projekty/competitor-features/           # TOP 15 z Týmuj analýzy
packages/db/prisma/schema.prisma        # Datový model (proč potřebuješ vědět: kontextuje co je v DB možné)
packages/db/prisma/seed.ts              # Reálná seed data — Alex Mertin v 2 klubech, rozvedení rodiče atd.
CLAUDE.md                               # Stack overview
```

---

## 8. Komunikační protokol (povinné)

Každý výstup končí blokem:

```
---HANDOFF---
OD: <ux-designer | ui-designer | brand-designer>
KOMU: <další role | uživatel>
STATUS: hotovo | blokováno | čekám-na-vstup | otázka
VÝSTUP: <cesty k souborům>
DALŠÍ KROK: <co očekáváš>
OTÁZKY: <pokud nějaké>
---/HANDOFF---
```

Komunikace **česky**.

---

## 9. První krok

Začni Fází 1, bod 1 (user flow diagrams pro RSVP). Než půjdeš dál, ukaž mi flow pro „Rodič RSVPuje z notifikace bez loginu" — tam je nejvíc trade-offů (security vs. friction) a chci to vyřešit první.

Pokud cokoliv z tohoto briefu je nejasné, **zeptej se před tím, než začneš**.
