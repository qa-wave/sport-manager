# Marketingový web: Sport Manager — Produktové stránky
**Od:** Web Designér
**Pro:** Marketér, Frontend vývojář, Projektový manažer
**Datum:** 2026-05-09
**Projekt:** Sport Manager — 12 produktových landing stránek

---

## Přehled

12 SEO-optimalizovaných stránek na `/produkt/{slug}`. Každá stránka cílí na jiný search intent (trenér hledá "správa docházky fotbal", rodič hledá "RSVP fotbalový klub appka"). Konzistentní layout, ale každá stránka má vlastní barevný akcent a vizuální téma sekce.

## Technický základ (pro vývojáře)

```
apps/web/app/(marketing)/produkt/[slug]/page.tsx     # dynamic route
apps/web/app/(marketing)/produkt/[slug]/content.ts   # per-page content config
apps/web/components/marketing/                       # sdílené marketing komponenty
  ├── ProductHero.tsx
  ├── ProblemSection.tsx
  ├── SolutionSection.tsx
  ├── HowItWorks.tsx
  ├── FeatureGrid.tsx
  ├── TestimonialBlock.tsx
  ├── ComparisonTable.tsx
  └── ProductCTA.tsx
```

**Server Components** — žádný `use client` na level stránek. Komponenty jsou čisté RSC.
**Sdílená data** definována v content config souboru per-stránka, ne hardcoded do JSX.

## Shared layout struktura

Každá produktová stránka dodržuje tento pořadí sekcí:

```
1. Hero            (headline + subheadline + CTA + hero visual)
2. Problem         (sociální proof bolesti — "Znáš to?")
3. Solution        (bullet points — jak to řešíme)
4. How it works    (3 kroky, numbered)
5. Key features    (4–6 karet s ikonami)
6. Testimonial     (1 citát + jméno + klub)
7. Comparison      (proč místo alternativy)
8. CTA final       (opakování hlavního CTA)
9. Internal links  (3 doporučené stránky)
```

## Navigace mezi produkty

Footer každé stránky obsahuje **Related products** — 3 interní linky na příbuzné funkce.
Hero sekce má breadcrumb: `Sport Manager → Funkce → {název stránky}`.

---

## Globální SEO nastavení (pro všechny stránky)

```
canonical: https://sport-manager.qawave.ai/produkt/{slug}
og:type: website
og:site_name: Sport Manager
twitter:card: summary_large_image
robots: index, follow
hreflang: cs
```

Schema.org markup: `SoftwareApplication` na každé stránce.

---

## Brand kontext (z design systému)

**Primární barva aplikace:** `#609bc6` (HSL 205 47% 55%) — Braník modrá
**Dark accent:** `#1e3a8a` — FC Hvězda modrá
**Zlatá:** `#f59e0b`
**Zelená:** `#16a34a`

Marketing web používá **Nordic Minimal** design směr (viz `projekty/design-system/5-smeru.md`):
- Font: Inter, variabilní váha
- Barvy: bílá stránka, `#0f1117` ink, `#609bc6` accent
- Radius: 8–12px
- Shadows: subtilní (0 1px 4px rgba(0,0,0,0.06))

---

# STRÁNKA 1: Kalendář & RSVP

## URL
`/produkt/kalendar`

## SEO Metadata

```
title: "Kalendář tréninků a zápasů | Sport Manager"
meta description: "Plánuj tréninky, zápasy a turnaje v jedné appce. RSVP za 2 kliknutí, automatické připomínky, online i v mobilu. Zkus zdarma."
h1: "Jeden kalendář pro celý klub"
keywords: správa kalendáře fotbalový klub, RSVP trénink appka, plánování zápasů online, sportovní tým kalendář, sport manager česky
```

## Hero sekce

**Headline:** Jeden kalendář pro celý klub
**Subheadline:** Tréninky, zápasy, turnaje — vše na jednom místě. Rodiče dostávají pozvánky a potvrzují účast za 2 kliknutí, i bez loginu.
**CTA primární:** Zkus zdarma → /signup
**CTA sekundární:** Jak to funguje → #how-it-works
**Hero visual concept:** Screenshot měsíčního kalendářního gridu s barevně odlišenými typy událostí (modrá = trénink, zelená = zápas, oranžová = turnaj). Na mobilním frame vedle desktopu je push notifikace s "RSVP: Trénink zítra v 17:30 — Zúčastním se / Nemohu".
**Barevný akcent stránky:** `#3b82f6` (modrá — kalendář/čas)

## Problem sekce

**Nadpis:** Konec chaosu s organizací
Každý trénink řešíš přes WhatsApp skupinu. Rodiče ignorují zprávy, na zápas přijde polovina hráčů. Trenér neví, kolik dětí čekat. Nikdo neví, jestli změna platí nebo ne.

## Solution — jak Sport Manager řeší

- **Jeden centrální kalendář** — trenér přidá událost jednou, všichni ji vidí okamžitě
- **RSVP za 2 kliknutí** — rodič klikne na notifikaci, potvrdí bez loginu (magic link)
- **Automatické připomínky** — appka pošle push den před tréninkem a 3 hodiny před začátkem
- **Barevné kategorie** — na první pohled víš, jde-li o trénink, zápas nebo turnaj
- **Náhled trenéra** — kdo přijde, kdo odmítl, kdo dosud neodpověděl — live přehled

## How it works

1. **Trenér vytvoří událost** — vybere typ (trénink/zápas), datum, čas, místo, tým. 30 sekund.
2. **Rodiče dostávají pozvánku** — push notifikace na mobil s přímým RSVP tlačítkem, bez loginu
3. **Trenér vidí odpovědi v reálném čase** — roster se plní, u každého hráče stav: Přijde / Nepřijde / Nevím

## Key features

| Feature | Ikona | Popis |
|---------|-------|-------|
| Měsíční / týdenní / agenda | CalendarDays | Přepínáš view podle toho, co potřebuješ. Na mobilu agenda, na desktopu měsíc. |
| Barevné typy událostí | Tag | Trénink, Zápas, Turnaj, Schůzka, Sociální — okamžitě rozlišitelné |
| RSVP bez loginu | Zap | Rodič klikne z notifikace, potvrdí jedním tapem. Žádná registrace. |
| Live RSVP roster | Users | Trenér vidí v reálném čase: 18/24 potvrzeno, 3 odmítli, 3 nevyplnili |
| Automatické připomínky | Bell | Ráno v 8:00 a 3 hodiny před začátkem — automaticky, bez práce trenéra |
| Domácí / venkovní / neutrální | MapPin | Zápasy jsou označeny H/A/N, web URL na hřiště volitelně |

## Testimonial

> "Dřív jsem musel každý týden ručně psát do skupiny 'Kdo přijde na trénink?'. Teď to řeší appka za mě. RSVP mám hotové do rána."

— **Martin Procházka**, trenér FC Hvězda Strašnice U13

## Comparison: Proč Sport Manager místo WhatsApp skupiny

| | WhatsApp | Sport Manager |
|---|---|---|
| Potvrzení účasti | Ztracené v chatu | RSVP tlačítko, live roster |
| Připomínky | Manuální | Automatické push notifikace |
| Přehled kdo přijde | Musíš počítat | Dashboard s čísly |
| Změna akce | Nová zpráva v chatu | Notifikace všem účastníkům |
| Archiv | Scrolluješ týdny zpět | Kalendář s historií |

## Final CTA

**Headline:** Začni plánovat chytřeji
**Subheadline:** Založ klub za 5 minut. První měsíc zdarma.
**CTA:** Založ klub zdarma → /signup

## Internal links (related)

- `/produkt/komunikace` — Týmová komunikace
- `/produkt/dochazka` — Docházka a statistiky
- `/produkt/treninky` — Knihovna tréninků

---

# STRÁNKA 2: Správa členů

## URL
`/produkt/sprava-clenu`

## SEO Metadata

```
title: "Správa členů sportovního klubu | Sport Manager"
meta description: "Evidence hráčů, trenérů a rodičů na jednom místě. Členské profily, role, guardian přístup, import z CSV. Zkus zdarma."
h1: "Kompletní evidence členů bez Excelu"
keywords: správa hráčů fotbalový klub, evidence členů sportovní klub, členská databáze club app, správa fotbalového klubu software
```

## Hero sekce

**Headline:** Kompletní evidence členů bez Excelu
**Subheadline:** Všichni hráči, trenéři, rodiče — jejich role, kontakty, platby a docházka na jednom místě. Aktualizované v reálném čase, dostupné odkudkoli.
**CTA primární:** Zkus zdarma → /signup
**CTA sekundární:** Prozkoumat funkce → #features
**Hero visual concept:** Split-screen — vlevo seznam členů s avatary, rolemi (HEAD_COACH badge, PLAYER badge) a stavem (Aktivní/Neaktivní). Vpravo detail profilu hráče s tabsy: Profil | Docházka | Platby | Souhlasy.
**Barevný akcent stránky:** `#8b5cf6` (fialová — lidé/tým)

## Problem sekce

**Nadpis:** Excel nestačí na správu klubu
Máš spreadsheet s 60 jmény, ale nikdo ho neaktualizuje. Nevíš, kdo patří do jakého týmu, rodiče mají zastaralé kontakty a nový hráč čeká 2 týdny na přidání.

## Solution

- **Centrální databáze členů** — každý člen má profil s kontakty, týmem, rolí a historií
- **Role-based přístup** — trenér vidí svůj tým, admin vidí vše, rodič vidí jen své dítě
- **Guardian propojení** — rodič je napojen na hráče s definovanými právy (RSVP, platby, komunikace)
- **Statusy členů** — Aktivní, Neaktivní, Pozastavený, Archivovaný — přehled kdo je v klubu

## How it works

1. **Přidej člena** — jméno, kontakt, tým, role. Import z CSV pro hromadný přechod.
2. **Propoj rodiče s hráčem** — Guardian link s oprávněními. Máma vidí platby, táta ne (GDPR).
3. **Všichni mají správný přístup** — trenér vidí svůj tým, rodič jen své dítě, admin vše.

## Key features

| Feature | Ikona | Popis |
|---------|-------|-------|
| Člen profil | UserCircle | Jméno, foto, kontakt, datum narození, číslo hráče, tým |
| Více rolí na jedné osobě | Layers | Šimon je hráč U15 a zároveň asistent trenéra U13 — jeden účet, obě role |
| Multi-tenant (více klubů) | Building2 | Tomáš je rodič v Hvězdě a trenér v Sokolech — jeden login, přepínač klubů |
| Guardian oprávnění | Shield | Každý rodič má vlastní masku: může / nemůže vidět platby, souhlasy, zdravotní záznamy |
| Statusy a filtry | Filter | Filtruj podle týmu, role, statusu, neuhrazených plateb |
| Export | Download | Export seznamu do CSV pro pojišťovnu, FAS nebo vlastní použití |

## Testimonial

> "Dřív jsem měl 3 Excelovské soubory — kontakty, platby, docházku. Teď mám vše na jednom místě a rodič si může sám zkontrolovat, co vidí."

— **Jan Novák**, administrátor FC Hvězda Strašnice

## Comparison: Proč Sport Manager místo Excel / Google Sheets

| | Excel | Sport Manager |
|---|---|---|
| Přístup pro trenéry | Sdílený soubor, konflikty | Role-based, každý vidí své |
| Rodičovský přístup | Žádný | Vlastní profil + guardian link |
| Aktualizace v reálném čase | Ruční sync | Okamžité |
| GDPR (rozvedení rodiče) | Manuální řešení | Granulární oprávnění per guardian |
| Propojení s docházkou | Samostatný soubor | Integrované v profilu hráče |

## Final CTA

**Headline:** Přestaň spravovat klubu v Excelu
**CTA:** Založ klub zdarma → /signup

## Internal links

- `/produkt/platby` — Platby a příspěvky
- `/produkt/souhlasy` — Digitální souhlasy
- `/produkt/registrace-hracu` — Veřejný registrační formulář

---

# STRÁNKA 3: Týmová komunikace

## URL
`/produkt/komunikace`

## SEO Metadata

```
title: "Týmová komunikace pro sportovní klub | Sport Manager"
meta description: "Chat pro tým, zprávy trenér–rodiče, oznámení. Vše na jednom místě místo WhatsApp. Privacy-by-default. Zkus zdarma."
h1: "Komunikace celého klubu na jednom místě"
keywords: komunikace sportovní klub appka, chat trenér rodiče, oznámení fotbalový tým, WhatsApp náhrada sportovní klub, sport manager komunikace
```

## Hero sekce

**Headline:** Komunikace celého klubu na jednom místě
**Subheadline:** Skupinový chat pro tým, přímé zprávy trenér–rodič, oznámení pro celý klub. Každý vidí jen to, co má — privacy zabudovaná od základu.
**CTA primární:** Zkus zdarma → /signup
**CTA sekundární:** Ukázat demo → #demo
**Hero visual concept:** Mockup inbox obrazovky — seznam konverzací vlevo (Tým U13, Trenéři, Rodiče, DM: Martin P.), chat view vpravo s bublinami a timestampy. Na mobilu push notifikace: "Martin P.: Trénink posunut na 15:00".
**Barevný akcent stránky:** `#10b981` (zelená — komunikace/zprávy)

## Problem sekce

**Nadpis:** WhatsApp skupiny jsou chaos
Trenér napíše do skupiny, polovina rodičů to nečte, druhá polovina odpovídá bokem. DM s trenérem se mísí s rodinnou komunikací. A táta nemá vědět, co psala máma — ale WhatsApp to neřeší.

## Solution

- **Oddělené kanály** — tým chat, trenéři, rodiče, přímé zprávy — každý kanál pro svůj účel
- **Privacy-by-participation** — vidíš jen konverzace, kde jsi účastník. Žádné "skupinové úniky".
- **Oznámení pro celý klub** — admin pošle jeden broadcast všem aktivním členům
- **Read receipts** — trenér vidí, kdo ze skupiny přečetl zprávu (pro skupiny). Pro DM jen "Přečteno".

## How it works

1. **Trenér vybere kanál** — Team chat, COACHES kanál nebo DM s konkrétním rodičem
2. **Napíše zprávu** — text, formátování, volitelně příloha (foto z tréninku)
3. **Všichni účastníci dostávají push notifikaci** — a vidí přečtení u svých zpráv

## Key features

| Feature | Ikona | Popis |
|---------|-------|-------|
| 6 typů konverzací | MessageSquare | TEAM, COACHES, PARENTS, DM (přímá), GROUP (ad-hoc), ANNOUNCEMENT |
| Read receipts | Eye | Trenér vidí "přečetl/a 14×" u skupinové zprávy. Detail: kdo + kdy. |
| Safeguarding | ShieldCheck | Systém blokuje DM mezi trenérem a nezletilým hráčem. Ochrana klubu i dětí. |
| Oznámení pro klub | Megaphone | Admin pošle broadcast všem — přijde jako push notifikace i e-mail |
| Editace a smazání | Pencil | Zprávu lze editovat (označí se "upraveno") nebo smazat (soft-delete) |
| Inline RSVP | CalendarCheck | Z chatu trenér může přidat přímý odkaz na event s RSVP tlačítkem |

## Testimonial

> "Konečně mám oddělené trenérské zprávy od skupiny pro rodiče. A tatínek Anny nevidí naši konverzaci s mámou — to jsme potřebovali."

— **Lucie Pecková**, rodič FC Hvězda Strašnice

## Comparison: Proč Sport Manager místo WhatsApp

| | WhatsApp | Sport Manager |
|---|---|---|
| Oddělení kanálů | Více skupin, chaos | Strukturované kanály v jedné appce |
| Privacy (rozvedení rodiče) | Žádná | Granulární — každý vidí jen svou konverzaci |
| Read receipts ve skupině | Ano, ale nestrukturované | Kdo přesně přečetl + kdy |
| Propojení s kalendářem | Žádné | Zpráva přímo odkazuje na event s RSVP |
| Safeguarding | Žádný | Blokace DM trenér–nezletilý s audit logem |

## Final CTA

**Headline:** Komunikuj jako profesionální klub
**CTA:** Zkus zdarma → /signup

## Internal links

- `/produkt/kalendar` — Kalendář & RSVP
- `/produkt/souhlasy` — Digitální souhlasy (GDPR)
- `/produkt/sprava-clenu` — Správa členů

---

# STRÁNKA 4: Docházka a statistiky

## URL
`/produkt/dochazka`

## SEO Metadata

```
title: "Docházka sportovního týmu | Sport Manager"
meta description: "Zaznamenej docházku 20 hráčů za 30 sekund. Statistiky účasti, heatmapy, přehled kdo chodí. Trenér i rodič vidí historii. Zkus zdarma."
h1: "Docházka celého týmu za 30 sekund"
keywords: docházka fotbalový tým, evidence přítomnosti sportovní klub, attendance tracker tým, trénink docházka appka česky
```

## Hero sekce

**Headline:** Docházka celého týmu za 30 sekund
**Subheadline:** Po tréninku zaškrtneš 20 jmen jedním pohybem. Statistiky se počítají samy. Rodič vidí, kolik tréninků jeho dítě zvládlo.
**CTA primární:** Zkus zdarma → /signup
**CTA sekundární:** Jak to funguje → #how-it-works
**Hero visual concept:** Mobilní obrazovka s bulk attendance UI — seznam hráčů se zaškrtávacími políčky, „Vybrat vše" tlačítko, progress bar "18/24 zaznamenáno". Pod ním heatmap calendar (GitHub-style contribution grid) zobrazující docházku konkrétního hráče za sezónu — tmavší zelená = přítomen.
**Barevný akcent stránky:** `#16a34a` (zelená — docházka/přítomnost)

## Problem sekce

**Nadpis:** Papírový arch nebo čekání na pamět
Po tréninku někdo zapomene zapsat, kdo byl. Za měsíc nevíš, jestli Marek chodí nebo ne. Rodič se zeptá "Proč syn nehrál?" a ty nemáš data.

## Solution

- **Bulk attendance** — trenér zaškrtne celý tým najednou, pak odznačí absentující — hotovo za 30 sekund
- **Automatické napojení na RSVP** — kdo potvrdil účast, je předvybrán. Ušetříš 80 % kliknutí.
- **Statistiky per hráč** — procento účasti za sezónu, výjimky, trend
- **Rodič vidí historii svého dítěte** — žádné spekulace, čísla mluví za sebe

## How it works

1. **Po tréninku otevřeš appku** — Bulk attendance obrazovka načte tým s RSVP předvybranými
2. **Zaškrtáš přítomné** — odznačíš ty, co nepřišli bez omluvy. 30 sekund pro 20 hráčů.
3. **Uzavřeš tréninku** — statistiky se aktualizují, každý rodič vidí výsledek v profilu svého dítěte

## Key features

| Feature | Ikona | Popis |
|---------|-------|-------|
| Bulk zaznamenávání | CheckSquare | Zaškrtni celý tým, pak odznač absentující — nejrychlejší způsob |
| RSVP předvyplnění | Zap | Kdo řekl "Přijdu", je automaticky předvybrán. Šetříš 80 % kliknutí. |
| Heatmap docházky | BarChart2 | GitHub-style calendar: na první pohled vidíš vzory — kdo chodí pravidelně |
| Statistiky za sezónu | TrendingUp | % účasti, počet tréninků, zápasů — exportovatelné |
| Rodičovský přístup | Eye | Rodič vidí historii svého dítěte v profilu — transparentnost bez telefonu |
| Omluvenky | FileText | Hráč může zadat nemoc/zranění s rozsahem dat — systém automaticky nastaví RSVP=NE |

## Testimonial

> "Dřív mi trvalo zaznamena docházku 10 minut na papír a pak přepisovat do Excelu. Teď to mám za 30 sekund přímo v telefonu."

— **Martin Procházka**, trenér FC Hvězda Strašnice U13

## Comparison: Proč Sport Manager místo papíru / Excelu

| | Papír + Excel | Sport Manager |
|---|---|---|
| Zaznamenání 20 hráčů | 5–10 minut | 30 sekund |
| Statistiky za sezónu | Ruční výpočet | Automatické |
| Přístup rodiče | Musíš volat | Profil dítěte v appce |
| Propojení s RSVP | Žádné | Předvyplněné z potvrzení |
| Omluvenky | Ústně nebo SMS | Digitální s datem platnosti |

## Final CTA

**Headline:** Ušetři 10 minut po každém tréninku
**CTA:** Zkus zdarma → /signup

## Internal links

- `/produkt/kalendar` — Kalendář & RSVP
- `/produkt/sprava-clenu` — Správa členů
- `/produkt/treninky` — Knihovna tréninků

---

# STRÁNKA 5: Knihovna tréninků

## URL
`/produkt/treninky`

## SEO Metadata

```
title: "Knihovna tréninků pro sportovní klub | Sport Manager"
meta description: "30+ připravených cvičení s videi. Drag-and-drop plánování, šablony pro opakující se tréninky. Přestaneš plánovat z hlavy. Zkus zdarma."
h1: "Přestaň plánovat tréninky z hlavy"
keywords: plánování tréninků fotbal, šablony tréninků mládežnický fotbal, cvičení trénink appka, tréninkový plán U13 U15 fotbal
```

## Hero sekce

**Headline:** Přestaň plánovat tréninky z hlavy
**Subheadline:** Knihovna cvičení s videi, drag-and-drop sestavení plánu, opakující se šablony. Čtyři týdny naplánováš za hodinu.
**CTA primární:** Zkus zdarma → /signup
**CTA sekundární:** Prohlédnout ukázkovou knihovnu → #features
**Hero visual concept:** Training template builder — vlevo seznam cvičení s miniaturami (kreslené taktické diagramy, bez stock fotek), vpravo timeline tréninkového plánu s drag-and-drop. Nahoře "Šablona Út+Čt 16:30" s počtem vygenerovaných tréninků.
**Barevný akcent stránky:** `#f59e0b` (zlatá — příprava/cvičení)

## Problem sekce

**Nadpis:** Každý trénink znovu vymýšlíš od nuly
Sedíš večer před tréninkem a hledáš v paměti, co jste dělali minule. Opakuješ stále stejná cvičení. Nový asistent trenér neví, jak trénink vést. Kontinuita tréninkového procesu závisí na tvé paměti.

## Solution

- **30+ připravených cvičení** — rozcvička, technická cvičení, taktika, herní situace, kondice
- **Drag-and-drop sestavení** — přetáhni cvičení do časové osy, nastav délku, přidej poznámku
- **Šablony pro opakující se tréninky** — "Standardní Út+Čt" šablona vygeneruje celý měsíc najednou
- **Video a popis** — každé cvičení má text, taktický diagram a odkaz na demo video

## How it works

1. **Prohlédneš knihovnu** — filtruj podle fáze tréninku, věkové kategorie, zaměření (technika / kondice / taktika)
2. **Sestavíš plán tréninku** — přetáhni cvičení do časové osy, každé má délku a pokyny
3. **Uložíš jako šablonu a vygeneruješ série** — "Opakovat každé Úterý a Čtvrtek po 8 týdnů" → 16 tréninků vytvořeno

## Key features

| Feature | Ikona | Popis |
|---------|-------|-------|
| Knihovna cvičení | BookOpen | 30+ cvičení rozdělených po fázích tréninku a věkových kategoriích |
| Taktické diagramy | Shapes | SVG diagramy hřiště pro každé cvičení — bez nutnosti kreslit |
| Drag-and-drop plán | GripVertical | Přetáhni cvičení, nastav délku, přeuspoř pořadí |
| Šablony s opakováním | RefreshCw | Pondělí–Středa–Pátek každé 2 týdny → systém vygeneruje všechny eventy |
| Sdílení s asistentem | Share2 | Asistent trenér vidí plán a může trénovat podle něj i bez vedoucího trenéra |
| Poznámky po tréninku | StickyNote | Trenér přidá poznámku "Příště více pracovat na levé noze" — zůstane v historii |

## Testimonial

> "Mám šablonu pro U13 a U15 zvlášť. Na začátku sezóny kliknu 'Generovat 16 tréninků' a mám celý říjen–listopad připravený. Zabere to 5 minut."

— **Martin Procházka**, trenér FC Hvězda Strašnice

## Comparison: Proč Sport Manager místo poznámkového bloku / YouTube

| | Poznámky + YouTube | Sport Manager |
|---|---|---|
| Kontinuita tréninku | Závisí na trenérovi | Šablony přežijí výměnu trenéra |
| Asistent trenér | Musí improvizovat | Přístup k plánu v appce |
| Opakující se tréninky | Ruční vytváření | Automatická generace série |
| Taktické diagramy | Kreslíš na tabuli | Připravené SVG diagramy |
| Historie | Ztratí se | Každý trénink archivován |

## Final CTA

**Headline:** Trénuj jako klub s profesionálním zázemím
**CTA:** Zkus zdarma → /signup

## Internal links

- `/produkt/kalendar` — Kalendář & RSVP
- `/produkt/dochazka` — Docházka a statistiky
- `/produkt/sestava` — Lineup builder

---

# STRÁNKA 6: Platby a příspěvky

## URL
`/produkt/platby`

## SEO Metadata

```
title: "Správa plateb sportovního klubu | Sport Manager"
meta description: "Sleduj členské příspěvky, pošli výzvu k úhradě, online platba přes Stripe. Přestaň honit platby přes WhatsApp. Zkus zdarma."
h1: "Přestaň honit platby přes WhatsApp"
keywords: členské příspěvky sportovní klub, správa plateb fotbalový klub, online platba sport klub, evidence poplatků tým
```

## Hero sekce

**Headline:** Přestaň honit platby přes WhatsApp
**Subheadline:** Přehled kdo zaplatil a kdo dluží, připomínky jedním kliknutím, online platba kartou nebo převodem. Bez Excelu, bez ostychu.
**CTA primární:** Zkus zdarma → /signup
**CTA sekundární:** Ukázat přehled plateb → #features
**Hero visual concept:** Payment dashboard — tabulka s hráči, stav platby (zelená = PAID, oranžová = PENDING, červená = FAILED), datum úhrady, tlačítko "Připomenout". Nahoře aggregate: 42 zaplaceno / 8 čeká / 2 po splatnosti.
**Barevný akcent stránky:** `#059669` (emerald — peníze/platby)

## Problem sekce

**Nadpis:** Správa příspěvků v Excelu bolí
Spravuješ platby v tabulce, ale nikdo ji neaktualizuje. Nevíš, kdo zaplatil sezónní příspěvek. Připomínky posíláš ručně přes WhatsApp a cítíš se trapně. Účetní požaduje doklady, které nemáš.

## Solution

- **Jeden přehled** — všichni členové, jejich platby, stavy, datumy — live, bez Excelu
- **Připomínka jedním kliknutím** — vyber dlužníky, klikni "Připomenout" — appka pošle push a mail
- **Online platba (Stripe Connect)** — hráč nebo rodič zaplatí kartou přímo v appce
- **Guardian oprávnění** — táta s `canViewPayments: false` nevidí platby, máma s právy ano

## How it works

1. **Admin vytvoří poplatek** — "Sezónní příspěvek 2025/26", 2 500 Kč, splatnost 30.9.
2. **Systém přiřadí poplatek členům** — automaticky dle týmu nebo ručně
3. **Hráči platí online nebo admin označí jako zaplaceno** — stav se aktualizuje v reálném čase

## Key features

| Feature | Ikona | Popis |
|---------|-------|-------|
| Dashboard plateb | LayoutDashboard | Agregát: zaplaceno / čeká / po splatnosti. Tabulka s filtry. |
| Hromadná připomínka | Send | Vyber dlužníky → klikni Připomenout → push + mail odesláno |
| Online platba (Stripe) | CreditCard | Hráč/rodič zaplatí kartou v appce. Admin dostane notifikaci. |
| Guardian výměna | Lock | Otec bez platebních práv nevidí stav plateb. GDPR-ready. |
| Historie plateb | History | Každá platba s datem, způsobem a statusem — pro účetní |
| Export | FileSpreadsheet | Export do CSV pro daňové přiznání nebo registraci svazu |

## Testimonial

> "Dřív jsem posílal připomínky na platby ručně každý měsíc a cítil se blbě. Teď kliknu jedno tlačítko a appka to udělá za mě — formálně a slušně."

— **Jan Novák**, administrátor FC Hvězda Strašnice

## Comparison: Proč Sport Manager místo Excel + WhatsApp

| | Excel + WhatsApp | Sport Manager |
|---|---|---|
| Přehled dlužníků | Ruční aktualizace | Live, automaticky |
| Připomínka | Osobní zpráva, trapné | Automatická notifikace z appky |
| Online platba | Bankovní převod, ztráta přehledu | Stripe inline, okamžité potvrzení |
| GDPR (přístup rodiče) | Nikdo to neřeší | Granulární per-guardian oprávnění |
| Export pro účetní | Formátování v Excelu | Klikni Export, hotovo |

## Final CTA

**Headline:** Mít přehled o platbách není luxus
**CTA:** Založ klub zdarma → /signup

## Internal links

- `/produkt/sprava-clenu` — Správa členů
- `/produkt/souhlasy` — Digitální souhlasy
- `/produkt/registrace-hracu` — Registrační formulář

---

# STRÁNKA 7: Liga Sync

## URL
`/produkt/liga-sync`

## SEO Metadata

```
title: "Automatická synchronizace s ligou FAČR | Sport Manager"
meta description: "Stáhni rozpis zápasů z FAČR jedním kliknutím. AI najde tvůj tým ve svazu, synchronizuje výsledky automaticky. Zkus zdarma."
h1: "Rozpis zápasů z FAČR automaticky"
keywords: FAČR synchronizace appka, stažení rozpisu zápasů fotbal, automatický rozpis fotbalový klub, FAČR API klub management
```

## Hero sekce

**Headline:** Rozpis zápasů z FAČR automaticky
**Subheadline:** Zadej název týmu, AI ho najde ve svazu a stáhne celý rozpis. Výsledky se synchronizují samy. Žádné ruční přepisování.
**CTA primární:** Zkus zdarma → /signup
**CTA sekundární:** Jak sync funguje → #how-it-works
**Hero visual concept:** Onboarding wizard — krok 2: "Najít tým ve FAČR". Input pole s "FC Hvězda Strašnice U13", pod ním AI výsledky: tři návrhy s logem týmu, ligou a počtem hráčů. Tlačítko "Potvrdit — FC Hvězda Strašnice U13 / Praha, ČFL U13 Skupina A". Po potvrzení: animovaný progress "Stahuji 18 zápasů... ✓ Hotovo".
**Barevný akcent stránky:** `#ef4444` (červená — liga/soutěž)

## Problem sekce

**Nadpis:** Přepisuješ rozpis z webu FAČR ručně
Na začátku sezóny sedíš u počítače a opisuješ 18 zápasů z webu svazu do Excelu nebo do jiné appky. A když FAČR změní termín, musíš to přepsat znovu.

## Solution

- **AI Smart Linker** — zadáš název týmu, AI najde správný záznam ve FAČR databázi
- **Jednorázový import** — stáhne celý rozpis najednou: datum, soupeř, místo, domácí/venkovní
- **Automatický sync** — jednou za den zkontroluje FAČR na změny termínů nebo výsledků
- **Idempotentní** — opakovaný sync nevytváří duplicity, pouze aktualizuje změny

## How it works

1. **V onboardingu zadáš název klubu a týmu** — "FC Hvězda Strašnice U13"
2. **AI najde tým ve FAČR** — zobrazí potvrzovací kartu se jménem ligy a počtem zápasů
3. **Potvrdíš a sync proběhne** — 18 zápasů přibyde do kalendáře jako eventy s typem MATCH

## Key features

| Feature | Ikona | Popis |
|---------|-------|-------|
| AI Smart Linker | Sparkles | Fuzzy match na název týmu — najde tým i s překlepy nebo zkratkami |
| FAČR adapter | Zap | Přímé napojení na dokumentovaná FAČR API (žádný scraping) |
| Automatický denní sync | RefreshCw | Změna termínu od svazu = automatická notifikace a update v kalendáři |
| Historická data | History | Import předchozí sezóny pro statistiky a docházkový přehled |
| Více svazů (roadmap) | Globe | FAČR fotbal first, ČFbU florbal a ČSLH hokej v přípravě |
| Soupeř scouting (roadmap) | Search | AI shrnutí soupeře z výsledků posledních 5 zápasů |

## Testimonial

> "Ušetřil jsem hodinu práce na začátku každé sezóny. A když FAČR změnila termín zápasu, appka mi poslala notifikaci ještě dřív, než jsem si to všiml na webu."

— **Tomáš Mertin**, trenér TJ Sokol Měcholupy U11

## Comparison: Proč Sport Manager místo ručního přepisování

| | Ruční přepis | Sport Manager |
|---|---|---|
| Zadání rozpisu | 1–2 hodiny | 30 sekund (AI najde tým) |
| Aktualizace termínů | Manuální kontrola FAČR webu | Automatická notifikace |
| Přesnost | Chyby při přepisu | Přímo z FAČR databáze |
| Historická data | Žádná | Import předchozí sezóny |

## Final CTA

**Headline:** Ušetři hodinu na začátku každé sezóny
**CTA:** Zkus Liga Sync zdarma → /signup

## Internal links

- `/produkt/kalendar` — Kalendář & RSVP
- `/produkt/live-skore` — Živý výsledek
- `/produkt/sestava` — Lineup builder

---

# STRÁNKA 8: Registrační formulář

## URL
`/produkt/registrace-hracu`

## SEO Metadata

```
title: "Veřejný registrační formulář pro klub | Sport Manager"
meta description: "Zveřejni registrační formulář, nový hráč vyplní jméno a kontakty, ty schválíš. Žádné papíry, žádné emaily. Zkus zdarma."
h1: "Registrace hráčů bez papírů"
keywords: registrace hráče sportovní klub online, přihláška do fotbalového klubu, online registrace mládežnický fotbal, sportovní klub přihlášení
```

## Hero sekce

**Headline:** Registrace hráčů bez papírů
**Subheadline:** Zveřejníš odkaz na registrační formulář, rodiče vyplní vše online, ty schválíš členství jedním kliknutím. Bez e-mailů, bez tisknutí.
**CTA primární:** Zkus zdarma → /signup
**CTA sekundární:** Ukázat formulář → #features
**Hero visual concept:** Veřejný registrační formulář — čistý form s logem klubu, poli: Jméno hráče, Datum narození, Tým (dropdown), Kontakt rodiče, E-mail. Pod formulářem admin panel s pending registracemi: "Jan Novák Jr. — U13 — čeká na schválení" + tlačítka Schválit / Zamítnout.
**Barevný akcent stránky:** `#6366f1` (indigo — formulář/registrace)

## Problem sekce

**Nadpis:** PDF přihláška je zbytečná práce
Rodič přijde na nábor, dostane papírový formulář, vyplní ho doma, přinese příště (nebo přinese za 3 týdny). Ty přepisuješ data do databáze. A pak zjistíš, že je špatně napsaný email.

## Solution

- **Veřejný odkaz** — sdílíš URL na webu klubu, sociálních sítích nebo na nástěnce
- **Rodič vyplní online** — jméno hráče, datum, tým, kontakt, souhlas s podmínkami — 2 minuty
- **Admin schválí nebo odmítne** — v přehledu čekajících registrací, jedním kliknutím
- **Hráč přibyde do systému** — automaticky se vytvoří Member profil a guardian link

## How it works

1. **Admin sdílí link** — `sport-manager.qawave.ai/k/hvezda-stranice/registrace` nebo QR kód na hřišti
2. **Rodič vyplní formulář** — jméno hráče, rok, tým, kontaktní e-mail + telefon, odsouhlasí GDPR
3. **Admin schválí v appce** — čeká ho notifikace "Nová registrace", jedním kliknutím přijme

## Key features

| Feature | Ikona | Popis |
|---------|-------|-------|
| Veřejný URL bez loginu | Globe | Kdokoli vyplní, bez nutnosti mít účet předem |
| Branding klubu | Palette | Formulář zobrazuje logo a barvy konkrétního klubu |
| Volitelné políčka | Settings | Admin zapne/vypne: zdravotní záznamy, číslo hráče, tým, sourozenci |
| Admin schvalovací fronta | Inbox | Přehled čekajících registrací s filtry, bulk schválení |
| Automatický guardian link | Link | Po schválení se rodič propojí s hráčem (guardian permissions) |
| Notifikace rodiči | Mail | Po schválení dostane e-mail s přihlašovacími údaji a prvními kroky |

## Testimonial

> "Na náborovém dnu jsme dali na plakát QR kód. 12 rodičů vyplnilo registraci na místě přes telefon. Druhý den jsem schválil vše najednou. Žádné papíry."

— **Jan Novák**, administrátor FC Hvězda Strašnice

## Comparison: Proč Sport Manager místo papírového formuláře

| | Papírový formulář | Sport Manager |
|---|---|---|
| Vyplnění | Rodiče nosí papír | Online odkaz nebo QR kód |
| Přepis dat | Ručně do systému | Automaticky po schválení |
| GDPR souhlas | Papírový podpis | Digitální s timestampem |
| Chybné údaje | Zjistíš pozdě | Validace při vyplňování |
| Notifikace rodiči | E-mail ručně | Automatický e-mail po schválení |

## Final CTA

**Headline:** Modernizuj nábor hráčů
**CTA:** Založ klub a sdílej registrační formulář → /signup

## Internal links

- `/produkt/sprava-clenu` — Správa členů
- `/produkt/souhlasy` — Digitální souhlasy
- `/produkt/platby` — Platby a příspěvky

---

# STRÁNKA 9: Lineup builder

## URL
`/produkt/sestava`

## SEO Metadata

```
title: "Sestavování sestav pro sportovní tým | Sport Manager"
meta description: "Drag-and-drop lineup builder. Vlož hráče na hřiště, ulož sestavu, sdílej s týmem před zápasem. Zkus zdarma."
h1: "Sestava na hřišti, ne v hlavě"
keywords: sestavení fotbalové sestavy appka, lineup builder futbal, sestava fotbalový tým online, sports lineup software
```

## Hero sekce

**Headline:** Sestava na hřišti, ne v hlavě
**Subheadline:** Drag-and-drop rozestavení hráčů na taktickém hřišti. Uložíš sestavu, sdílíš s týmem před zápasem — každý ví, kde hraje.
**CTA primární:** Zkus zdarma → /signup
**CTA sekundární:** Ukázat builder → #features
**Hero visual concept:** Taktické hřiště (top-down view, zelené SVG) s hráči jako kruhy s příjmením. Formace 4-3-3 rozložená. Na pravé straně panel "Dostupní hráči" — hráči s RSVP=ANO jsou zelení, RSVP=NE přeškrtnutí. Sdílet tlačítko s "Odeslat sestavu hráčům".
**Barevný akcent stránky:** `#22c55e` (zelená trávník — sport)

## Problem sekce

**Nadpis:** Sestava na papírku se ztratí
Napíšeš sestavu na papír nebo do SMS, polovina hráčů si to nepřečte, jeden přijde na špatnou pozici. A pak zjistíš, že 2 hráči z RSVP nepřišli a musíš improvizovat.

## Solution

- **Drag-and-drop na taktickém hřišti** — přetáhni hráče na pozici, formace se uloží
- **Propojení s RSVP** — systém zobrazí pouze hráče, kteří potvrdili účast
- **Sdílení před zápasem** — hráči dostanou push notifikaci se sestavou
- **Historie sestav** — vidíš, jak jsi rozhodl v minulých zápasech

## How it works

1. **Otevřeš event detail zápasu** — záložka "Sestava"
2. **Přetáháš hráče na pozice** — pouze ti, kdo potvrdili RSVP, jsou k dispozici
3. **Sdílíš s týmem** — kliknutím na "Odeslat sestavu" dostanou všichni notifikaci

## Key features

| Feature | Ikona | Popis |
|---------|-------|-------|
| Drag-and-drop hřiště | Move | Interaktivní top-down hřiště, přetáhni hráče na pozici |
| RSVP filter | UserCheck | Zobrazuj pouze hráče s potvrzenou účastí — žádná překvapení |
| Přednastavené formace | Grid3X3 | 4-4-2, 4-3-3, 3-5-2 a další — vyber a rozmísti hráče |
| Náhradníci | Users | Bench sekce pro hráče bez startovní pozice |
| Sdílení před zápasem | Share2 | Push notifikace hráčům: "Zde je tvoje pozice na dnešní zápas" |
| Taktické poznámky | StickyNote | Přidej pokyny ke konkrétní pozici nebo hráči |

## Testimonial

> "Minulý zápas jsem sdílel sestavu 30 minut před výkopem. Hráči věděli, kde hrají, a maminka Karlíka mi nevolala s otázkou 'co hraje syn?'."

— **Martin Procházka**, trenér FC Hvězda Strašnice U13

## Comparison: Proč Sport Manager místo SMS / tabulí

| | SMS nebo tabule | Sport Manager |
|---|---|---|
| Dostupnost | Musí přijít včas nebo schovat mobil | V appce kdykoliv před zápasem |
| RSVP propojení | Žádné — může chybět hráč | Pouze potvrzení hráči |
| Historie | Žádná | Každá sestava archivována |
| Aktualizace | Nová SMS = chaos | Push update, vše aktuální |

## Final CTA

**Headline:** Připrav tým jako profesionální trenér
**CTA:** Zkus zdarma → /signup

## Internal links

- `/produkt/kalendar` — Kalendář & RSVP
- `/produkt/treninky` — Knihovna tréninků
- `/produkt/live-skore` — Živý výsledek

---

# STRÁNKA 10: Živý výsledek

## URL
`/produkt/live-skore`

## SEO Metadata

```
title: "Živý výsledek pro sportovní klub | Sport Manager"
meta description: "Aktualizuj skóre zápasu v reálném čase. Rodiče, kteří nemohou přijít, sledují výsledek živě. Góly, střelci, průběh. Zkus zdarma."
h1: "Rodiče sledují zápas živě, i z práce"
keywords: živý výsledek fotbal mládežnický, live score sportovní klub, aktuální skóre fotbalový tým appka, sport live výsledky
```

## Hero sekce

**Headline:** Rodiče sledují zápas živě, i z práce
**Subheadline:** Asistent trenér aktualizuje skóre v telefonu, rodiče na druhé straně republiky vidí výsledek v reálném čase. Góly, střelci, průběh.
**CTA primární:** Zkus zdarma → /signup
**CTA sekundární:** Jak live skóre funguje → #how-it-works
**Hero visual concept:** Dvě obrazovky — vlevo trenérský telefon s "Přidat gól" / "Přidat gól soupeře" tlačítky, skóre 2:1 ve 34. minutě. Vpravo rodičovský telefon s push notifikací "GOOOOL! FC Hvězda 2:1 v 34. min — Pavel Novák". Pod tím live view s timeline gólů.
**Barevný akcent stránky:** `#dc2626` (červená — live/urgentní)

## Problem sekce

**Nadpis:** Rodiče, kteří nemůžou přijet, jsou v temnotě
Máma je v práci, táta na služební cestě. Dítě hraje zápas, ale rodiče nevědí výsledek dokud se dítě nevrátí domů. A pak zjistí, že prohráli 0:4 a zůstali to nevědět celé odpoledne.

## Solution

- **Asistent trenér aktualizuje skóre z telefonu** — dvě tlačítka, 3 sekundy per gól
- **Rodiče dostávají push při každém gólu** — s jménem střelce a minutou
- **Live timeline** — průběh zápasu s góly a komentáři trenéra
- **Finální výsledek** — automatická notifikace po konci zápasu

## How it works

1. **Trenér otevře event detail zápasu** — záložka "Live skóre"
2. **Po každém gólu klikne "Přidat gól"** — vybere střelce ze sestavy, appka zaznamená minutu
3. **Rodiče dostávají push v reálném čase** — vidí live timeline s průběhem zápasu

## Key features

| Feature | Ikona | Popis |
|---------|-------|-------|
| Jednoduché zadávání | Plus | Dvě tlačítka: Náš gól / Gól soupeře. Střelec z dropdownu. |
| Push při gólu | Bell | Okamžitá notifikace rodičům s jménem střelce a minutou |
| Live timeline | Activity | Průběh zápasu — góly, žluté karty, komentáře trenéra |
| Sdílitelný link | Link | Veřejná URL s live skóre pro babičku bez appky |
| Post-match recap | FileText | Po konci: souhrn s výsledkem, střelci, krátký komentář trenéra |
| Archiv výsledků | Archive | Historie všech zápasů s výsledky a střelci |

## Testimonial

> "Mám dceru v práci a syn hraje. Teď dostávám push při každém gólu. Minulý týden jsem mohla slavit 3:2 výhru živě, přestože jsem byla 50 km daleko."

— **Lucie Pecková**, rodič FC Hvězda Strašnice

## Comparison: Proč Sport Manager místo SMS skupiny

| | SMS skupinová | Sport Manager |
|---|---|---|
| Aktualizace skóre | Trenér píše ručně do skupiny | Dvě kliknutí v appce |
| Push při gólu | SMS na celou skupinu | Strukturovaná notifikace s detaily |
| Sdílení s rodinou | Další skupiny, chaos | Sdílitelný veřejný link |
| Historie výsledků | Scrollování ve WhatsApp | Archiv v appce |

## Final CTA

**Headline:** Drž rodiče v obraze, i když nemůžou přijet
**CTA:** Zkus zdarma → /signup

## Internal links

- `/produkt/sestava` — Lineup builder
- `/produkt/kalendar` — Kalendář & RSVP
- `/produkt/liga-sync` — Liga Sync

---

# STRÁNKA 11: Digitální souhlasy

## URL
`/produkt/souhlasy`

## SEO Metadata

```
title: "Digitální souhlasy a GDPR pro sportovní klub | Sport Manager"
meta description: "GDPR, zdravotní záznamy, souhlas s focením — vše digitálně podepsané s timestampem. Konec papírových formulářů. Zkus zdarma."
h1: "Konec papírových souhlasů"
keywords: GDPR sportovní klub souhlas, digitální souhlas zdravotní záznamy, souhlas s focením mládežnický sport, GDPR fotbalový klub
```

## Hero sekce

**Headline:** Konec papírových souhlasů
**Subheadline:** GDPR, zdravotní záznamy, souhlas s focením — vše digitálně podepsané s datem a IP adresou. Žádné šanony, žádné ztracené papíry.
**CTA primární:** Zkus zdarma → /signup
**CTA sekundární:** Jaké typy souhlasů → #features
**Hero visual concept:** Admin přehled souhlasů — tabulka s typy (GDPR | ZDRAVOTNÍ | ODPOVĚDNOST | MÉDIA), za každým typem procento podepsaných (67/80 podepsáno), sloupec s filtrem "Nepodepsali". Detail souhlas-karty: "GDPR souhlas — Podepsáno 12.9.2025 v 14:32, IP: 82.x.x.x, Lucie Pecková".
**Barevný akcent stránky:** `#7c3aed` (fialová — právní/dokumenty)

## Problem sekce

**Nadpis:** Papírové souhlasy se ztrácejí
Začátkem sezóny rozdáš papírové formuláře, polovina se ztratí cestou z tréninku, druhá polovina leží v šanonu v garáži. Pojišťovna požaduje podepsaný souhlas pro soustředění. Kde je ten od Karla?

## Solution

- **4 typy digitálních souhlasů** — GDPR, zdravotní záznamy, odpovědnostní prohlášení, souhlas s médii
- **Rodič podepíše online** — kliknutím potvrdí souhlas, systém zaznamená timestamp a IP
- **Admin vidí kdo nepodepsal** — filter "nepodepsali" → připomínka jedním kliknutím
- **Právně platný audit trail** — každý souhlas s časovým razítkem a identifikací

## How it works

1. **Admin aktivuje typ souhlasu** — "GDPR souhlas pro sezónu 2025/26" s textem a platností
2. **Rodiče dostávají notifikaci** — "Čeká na podpis: GDPR souhlas"
3. **Rodič podepíše v appce** — přečte text, klikne "Souhlasím" — zaznamenáno s timestampem

## Key features

| Feature | Ikona | Popis |
|---------|-------|-------|
| 4 typy souhlasů | FileCheck | GDPR, ZDRAVOTNÍ, ODPOVĚDNOST (LIABILITY), MÉDIA — každý s vlastním textem |
| Digital timestamp | Clock | Každý souhlas s datem, časem a IP adresou — právně platný záznam |
| Přehled nepodepsaných | AlertCircle | Filtr "kdo dosud nepodepsal" → hromadná připomínka |
| Platnost souhlas | CalendarX | Nastav expiraci: "Souhlas platí do konce sezóny" |
| Guardian podpis | UserCheck | Rodič podepisuje za nezletilého — guardian link zajišťuje správné propojení |
| Export PDF | Download | Export podepsaného souhlasu pro pojišťovnu nebo svaz |

## Testimonial

> "Pro soustředění jsem potřeboval zdravotní souhlas od všech 22 hráčů. Poslal jsem notifikaci, za 3 dny měl jsem 20 podpisů digitálně. 2 jsem připomněl, mám vše."

— **Jan Novák**, administrátor FC Hvězda Strašnice

## Comparison: Proč Sport Manager místo papíru

| | Papírový souhlas | Sport Manager |
|---|---|---|
| Distribuce | Tisknout a rozdávat | Notifikace v appce |
| Podpis | Fyzický podpis, ztráta | Digitální s timestampem a IP |
| Přehled kdo podepsal | Ruční kontrola šanonu | Automatický přehled v appce |
| Ztracené souhlasy | Reálné riziko | Uloženo v cloudu |
| Export pro pojišťovnu | Kopírování + skenování | Kliknutí Export PDF |

## Final CTA

**Headline:** Splň GDPR bez šanonů
**CTA:** Zkus zdarma → /signup

## Internal links

- `/produkt/sprava-clenu` — Správa členů
- `/produkt/platby` — Platby
- `/produkt/registrace-hracu` — Registrační formulář

---

# STRÁNKA 12: Import z konkurence

## URL
`/produkt/import`

## SEO Metadata

```
title: "Přejdi z TeamSnap, Spond nebo Týmuj.cz | Sport Manager"
meta description: "Přechod z TeamSnap, Spond nebo Týmuj.cz za 15 minut. Import členů, událostí a dat bez ztráty. Pomůžeme s přechodem. Zkus zdarma."
h1: "Přejdi z Týmuj, TeamSnap nebo Spond za 15 minut"
keywords: přechod z Týmuj.cz alternativa, TeamSnap alternativa česky, Spond alternativa fotbalový klub, import sportovního klubu
```

## Hero sekce

**Headline:** Přejdi z Týmuj, TeamSnap nebo Spond za 15 minut
**Subheadline:** Export ze starého systému, import do Sport Manageru, zkontroluj data — hotovo. Členové, události, platby. Nepřijdeš o nic.
**CTA primární:** Začít přechod → /signup
**CTA sekundární:** Jak import funguje → #how-it-works
**Hero visual concept:** 3-krokový wizard — Krok 1: "Odkud přecházíš?" s ikonami TeamSnap / Spond / Týmuj.cz / CSV. Krok 2: Upload souboru s progress barem "Zpracovávám 67 členů..." Krok 3: Preview tabulky před finálním importem se zelenou checkmarkou "Vše vypadá dobře. Import?".
**Barevný akcent stránky:** `#0ea5e9` (sky blue — migrace/přesun)

## Problem sekce

**Nadpis:** Změnit appku se zdá složité
Máš data v TeamSnapu nebo Týmuju — 80 členů, historii plateb, staré události. Přechod vypadá jako měsíce práce. Tak zůstáváš u starého systému, i když tě štvě.

## Solution

- **Import z CSV** — export z jakéhokoliv systému, import do Sport Manageru
- **Předdefinované mapování** — pro TeamSnap, Spond a Týmuj.cz máme připravené šablony
- **Preview před importem** — vidíš, co se importuje, a můžeš opravit chyby
- **Asistovaný přechod** — pro větší kluby (50+ členů) nabízíme asistenci zdarma

## How it works

1. **Exportuješ z původní appky** — TeamSnap: Members → Export CSV. Spond: Settings → Export. Týmuj: Admin → Export.
2. **Nahraješ soubor do Sport Manageru** — systém automaticky rozpozná formát
3. **Zkontroluj preview a potvrď** — vidíš, co se importuje, jedním kliknutím dokončíš

## Key features

| Feature | Ikona | Popis |
|---------|-------|-------|
| TeamSnap import | Upload | Předdefinované mapování pro TeamSnap CSV export |
| Spond import | Upload | Předdefinované mapování pro Spond export |
| Týmuj.cz import | Upload | Předdefinované mapování pro Týmuj export |
| Generic CSV | FileText | Vlastní CSV se sloupci: jméno, email, tým, role — mapuješ ručně |
| Import preview | Eye | Vidíš tabulku dat před importem, opravíš chyby před potvrzením |
| Asistovaný přechod | HeadphonesIcon | Pro kluby 50+ členů: 30minutový onboarding call zdarma |

## Testimonial

> "Přecházel jsem z Týmuju. Export, upload, preview — 15 minut a měl jsem všechny členy v Sport Manageru. Čekal jsem horší."

— **Tomáš Mertin**, trenér TJ Sokol Měcholupy

## Comparison: Sport Manager vs. zůstat u starého systému

| | Zůstat u starého | Přejít na Sport Manager |
|---|---|---|
| Přechod | Žádná práce | 15 minut importu |
| Funkce navíc | Stávající | FAČR sync, safeguarding, per-tenant theming |
| Cena | Platíš za stávající | Free tier, pak 990 Kč/měsíc |
| Podpora v češtině | Závisí na produktu | Nativní čeština, česká podpora |
| Customizace | Žádná | Barvy, logo, styl per klub |

## Final CTA

**Headline:** Přechod je jednodušší, než si myslíš
**Subheadline:** Nezávazný import — data si prohlédneš před potvrzením. Kdykoliv.
**CTA:** Začít zdarma → /signup

## Internal links

- `/produkt/sprava-clenu` — Správa členů
- `/produkt/registrace-hracu` — Registrační formulář
- `/produkt/platby` — Platby

---

# Technická implementace — souhrn pro vývojáře

## File structure

```
apps/web/app/(marketing)/
├── layout.tsx                        # Marketing layout (bez admin sidebar)
├── produkt/
│   ├── page.tsx                      # /produkt — přehled všech features
│   └── [slug]/
│       ├── page.tsx                  # Dynamic route pro product pages
│       └── not-found.tsx             # 404 pro neexistující slug
├── components/marketing/
│   ├── ProductHero.tsx               # Hero sekce
│   ├── ProblemSection.tsx            # Bolest zákazníka
│   ├── SolutionBullets.tsx           # 4-5 bullet pointů
│   ├── HowItWorks.tsx                # 3 kroky (numbered)
│   ├── FeatureGrid.tsx               # 4-6 feature karet
│   ├── TestimonialBlock.tsx          # Citát + jméno + klub
│   ├── ComparisonTable.tsx           # Side-by-side tabulka
│   ├── ProductCTA.tsx                # Final CTA sekce
│   └── RelatedProducts.tsx           # 3 interní linky
└── lib/marketing/
    └── product-pages.ts              # Content config pro všechny stránky
```

## SEO implementace (Next.js metadata API)

```typescript
// apps/web/app/(marketing)/produkt/[slug]/page.tsx
import { type Metadata } from 'next'
import { getProductPage } from '@/lib/marketing/product-pages'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const page = getProductPage(params.slug)
  return {
    title: page.seo.title,
    description: page.seo.metaDescription,
    keywords: page.seo.keywords,
    openGraph: {
      title: page.seo.title,
      description: page.seo.metaDescription,
      url: `https://sport-manager.qawave.ai/produkt/${params.slug}`,
      type: 'website',
    },
    alternates: {
      canonical: `https://sport-manager.qawave.ai/produkt/${params.slug}`,
    },
  }
}

export function generateStaticParams() {
  return PRODUCT_SLUGS.map(slug => ({ slug }))
}
```

## Schema.org markup (per stránka)

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Sport Manager",
  "applicationCategory": "SportsApplication",
  "operatingSystem": "Web, iOS, Android",
  "description": "[per-page description]",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "CZK",
    "description": "Zdarma pro první tým"
  },
  "url": "https://sport-manager.qawave.ai"
}
</script>
```

## Performance požadavky

- **LCP < 2.5s** — hero visual jako inline SVG nebo optimalizovaný next/image
- **CLS < 0.1** — žádné layout shifty, fixní výšky pro hero ilustrace
- **No heavy images** — ilustrace jako SVG, žádné stock fotky
- **Static generation** — `generateStaticParams()` pre-generuje všech 12 stránek v build time

## Sitemap entries (přidat do sitemap.xml)

```xml
<url><loc>https://sport-manager.qawave.ai/produkt/kalendar</loc><priority>0.8</priority></url>
<url><loc>https://sport-manager.qawave.ai/produkt/sprava-clenu</loc><priority>0.8</priority></url>
<url><loc>https://sport-manager.qawave.ai/produkt/komunikace</loc><priority>0.8</priority></url>
<url><loc>https://sport-manager.qawave.ai/produkt/dochazka</loc><priority>0.8</priority></url>
<url><loc>https://sport-manager.qawave.ai/produkt/treninky</loc><priority>0.8</priority></url>
<url><loc>https://sport-manager.qawave.ai/produkt/platby</loc><priority>0.8</priority></url>
<url><loc>https://sport-manager.qawave.ai/produkt/liga-sync</loc><priority>0.7</priority></url>
<url><loc>https://sport-manager.qawave.ai/produkt/registrace-hracu</loc><priority>0.7</priority></url>
<url><loc>https://sport-manager.qawave.ai/produkt/sestava</loc><priority>0.7</priority></url>
<url><loc>https://sport-manager.qawave.ai/produkt/live-skore</loc><priority>0.7</priority></url>
<url><loc>https://sport-manager.qawave.ai/produkt/souhlasy</loc><priority>0.7</priority></url>
<url><loc>https://sport-manager.qawave.ai/produkt/import</loc><priority>0.6</priority></url>
```

---

# Vizuální konzistence — shrnutí

## Barevné akcenty per stránka

| Slug | Funkce | Akcent HEX | Tailwind třída |
|------|--------|-----------|----------------|
| `kalendar` | Kalendář & RSVP | `#3b82f6` | `blue-500` |
| `sprava-clenu` | Správa členů | `#8b5cf6` | `violet-500` |
| `komunikace` | Komunikace | `#10b981` | `emerald-500` |
| `dochazka` | Docházka | `#16a34a` | `green-600` |
| `treninky` | Tréninky | `#f59e0b` | `amber-400` |
| `platby` | Platby | `#059669` | `emerald-600` |
| `liga-sync` | Liga Sync | `#ef4444` | `red-500` |
| `registrace-hracu` | Registrace | `#6366f1` | `indigo-500` |
| `sestava` | Sestava | `#22c55e` | `green-500` |
| `live-skore` | Live skóre | `#dc2626` | `red-600` |
| `souhlasy` | Souhlasy | `#7c3aed` | `violet-600` |
| `import` | Import | `#0ea5e9` | `sky-500` |

## CTA tlačítka

- **Primární:** "Zkus zdarma" nebo "Založ klub zdarma" → `/signup`
- **Sekundární:** "Jak to funguje" → `#how-it-works` (anchor scroll na stránce)
- Obě tlačítka přítomna v Hero i v Final CTA sekci

## Interní prolinky (strategie)

Každá stránka linkuje na 3 příbuzné funkce. Vazby jsou bidirektionální (A linkuje B, B linkuje A). Nejfrekventovanější linky: `kalendar ↔ dochazka`, `sprava-clenu ↔ platby ↔ souhlasy`, `sestava ↔ live-skore ↔ liga-sync`.

---

---HANDOFF---
OD: web-designer
KOMU: frontend-vyvojar, projektovy-manazer
STATUS: hotovo
VÝSTUP: /Users/tm/workspaces/projects/sport-manager/projekty/marketing-web/produkt-stranky-brief.md
DALŠÍ KROK: Frontend vývojář implementuje:
  1. Marketing layout v `apps/web/app/(marketing)/layout.tsx`
  2. Dynamic route `apps/web/app/(marketing)/produkt/[slug]/page.tsx`
  3. Content config `apps/web/lib/marketing/product-pages.ts` (typovaný objekt ze všech 12 stránek v tomto briefu)
  4. Sdílené marketing komponenty (ProductHero, FeatureGrid, HowItWorks, TestimonialBlock, ComparisonTable)
  5. Přidat sitemap entries do stávajícího sitemap.xml
OTÁZKY:
  1. Existuje již `/signup` route? Pokud ne, kamkoliv CTA odkazuje je `?waitlist=true` vhodná fallback alternativa.
  2. Hero visual concepts — jsou to SVG ilustrace nebo screenshot mockupy? Kdo je dodá: Brand Designér nebo generujeme jako inline SVG/CSS?
  3. Marketing layout — sdílí topbar se stávající (admin) aplikací nebo má vlastní jednodušší header s jen logem + CTA?
---/HANDOFF---
