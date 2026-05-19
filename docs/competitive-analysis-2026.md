# Konkurencni analyza -- Sport Manager vs. trh (kveten 2026)

## Executive Summary

Sport Manager soutezi na trhu, kde dominuji TeamSnap (USA), Spond (Evropa) a Heja (Skandinavie). Klicove zjisteni:

1. **Spond je nejvetsi hrozba** -- je kompletne zdarma, bez reklam, s vybornym UX. Popularni v Evrope.
2. **TeamSnap ztrapnuje uzivatele** monetizaci (reklamy + predplatne = double-dip). Velka prilezitost.
3. **Heja ukazuje, ze jednoduchost vyhrava** -- feed-first pristup, mobile-first design.
4. **Hudl je v jine lize** (video analyza, $400-1600/rok/tym) -- ale jejich AI features jsou inspirativni.
5. **Gamifikace a AI personalizace** jsou trendy 2026, ktere zatim zadny maly hrac neimplementoval dobre.

---

## 1. TeamSnap

**Pozice:** Nejvetsi hrac v USA (youth sports). Etablovany, ale starnouci.

### Co uzivatele milujou
1. **Integrace kalendare** -- sync s telefonnim kalendarem, viditelnost konfliktu
2. **Availability tracking** -- kdo prijde, kdo ne, na jedno misto
3. **Alerting system** -- push notifikace pro rodice o zmenach

### Co uzivatele nenavidej
1. **Double-dip monetizace** -- platici uzivatele stale vidi reklamy, pokud nezaplati KAZDY clen tymu individualne
2. **Slozite UI** -- "WAY too complicated" = citace z recenzi. Neni intuitivni bez skoleni
3. **Technicke problemy** -- pomalost, pady, nespolehlivy sync kalendare, nespolehlivy chat

### UX patterny k inspiraci
1. **Availability locking** -- zamknuti RSVP X hodin pred eventem (zabranuje last-minute zmenam)
2. **Offline mode** (Android 2025) -- pristup k rozpisam a soupiskam bez internetu
3. **CSV import/export** -- standardni pro migrace z jinych systemu

### Pricing
| Plan | Cena | Limity |
|------|------|--------|
| Free | $0 | 15 clenu, s reklamami, BEZ RSVP |
| Premium | $14/mes ($100/rok) | 40 clenu, 2GB |
| Ultra | $18/mes ($130/rok) | Neomezeno |

### Co jim chybi
- Moderni design (UI je z roku 2018)
- Ad-free free tier
- Integrace s evropskymi svazy (FACR apod.)
- AI cokoliv

### Co by mel Sport Manager ukrast
- **Availability locking** -- jednoducha feature, velky dopad. Implementace: checkbox na eventu "zamknout RSVP X hodin pred zacatkem"
- **Offline rezim** (budouci feature) -- Service Worker cache pro rozpis + soupisku

---

## 2. Spond

**Pozice:** Nejpopularnejsi v Evrope. Norsky puvod. Hlavni konkurent Sport Manageru.

### Co uzivatele milujou
1. **Kompletne zdarma a bez reklam** -- to je obrovska konkurencni vyhoda
2. **Intuitivni design** -- "neni potreba skoleni", rodice i treneri to zvladnou okamzite
3. **Mapy + RSVP** -- u kazdeho eventu mapa, rodic odpovi jednim klepnutim

### UX patterny k inspiraci
1. **Jedno klepnuti RSVP** -- zadne prihlaseni, zadne menu. Event -> ANO/NE/MOZNA
2. **Mapova integrace** -- u kazdeho eventu mapa s navigaci primo v appce
3. **Platby primo v appce** -- sbirani poplatku, prispevku, turnajovych nakladu -- BEZ externiho nastroje

### Pricing
| Plan | Cena | Model |
|------|------|-------|
| App | Zdarma | Navzdy, bez reklam |
| Spond Club (web) | Zdarma | Pro vetsi kluby |
| Platby | 3.29% + $1 | Za transakci |

### Co jim chybi
- Pokrocila analytika (zadne heatmapy, trendy, coaching stats)
- Video integrace
- Sablony treninku / cviceni
- AI funkce
- Vlastni branding/theming pro klub (Sport Manager to ma!)
- Desktop experience je slabsi nez mobile

### Co by mel Sport Manager ukrast
- **Jednoduchost RSVP flow** -- Sport Manager uz ma magic link RSVP, ale muzeme zjednodusit in-app flow na minimum kliknuti
- **Integrovane platby bez frikcni bariery** -- Stripe Connect uz mame, ale UX muze byt jednodussi
- **Ad-free jako princip** -- nikdy nepridavat reklamy, to je konkurencni vyhoda vuci TeamSnapu

---

## 3. Heja

**Pozice:** Skandinavie, komunikacne orientovana appka. "Instagram pro sportovni tymy."

### Co uzivatele milujou
1. **Cisty feed** -- vsechno v jednom proudu (eventy, zpravy, fotky, videa)
2. **Sdileni fotek a videi** -- rodice sdili momenty ze zapasu, treneri training highlights
3. **Ochrana nezletilych (SafeSport)** -- prevence privatni komunikace dospely-dite bez vedomi rodice

### UX patterny k inspiraci
1. **Feed-first architektura** -- ne dashboard s cisly, ale chronologicky proud jako socialni sit
2. **Mobile-first az k extremu** -- desktop je az sekundarni (Pro plan). Vsechno je optimalizovane pro telefon
3. **Highlight reels** -- automaticke sestavy z nahrannych fotek/videi

### Pricing
| Plan | Cena |
|------|------|
| Free | Zakladni funkce, s reklamami |
| Pro | $8.33/mes (treneri) |

### Co jim chybi
- Platby / sbirani poplatku
- Pokrocila sprava clenu (CSV import, statusy, role)
- Multi-tenant (vice klubu)
- Takticky planovac treninku
- Analytika / statistiky

### Co by mel Sport Manager ukrast
- **Activity feed jako primarni pohled** -- uz mame `/admin/activity`, ale mohl by byt prominentnejsi a bohatsi (fotky, videa, RSVP zmeny)
- **Fotogalerie / media sharing** -- mame gallery stub (feature-flagged), tohle je prilezitost k aktivaci
- **SafeSport compliance** -- komunikacni pravidla pro nezletile. Privacy-by-participation uz mame (Dad nevidi DM Mom+Coach), muzeme to marketovat explicitne

---

## 4. Sportlyzer

**Pozice:** Estonsky startup. Zameren na rozvoj hracu a analyzu treninku.

### Co uzivatele milujou
1. **Automaticka treninková historie** -- z dochazky se automaticky generuje zaznam treninku
2. **Sync s heart rate monitory** (Garmin, Polar, Suunto)
3. **Vykonnostni testy** -- digitalizace testu, sledovani progresu, prevence zraneni

### UX patterny k inspiraci
1. **Progresni grafy** -- vizualizace vyvoje hrace v case
2. **Test management** -- standardizovane testy s historii vysledku
3. **Automatizace dat** -- minimum manualni prace, maximum automatickeho sberu

### Pricing
Od $7.50/mes.

### Co jim chybi
- Komunikace (zadny chat, zpravy)
- Platby
- Kalendar/scheduling
- Moderni UI (pusobi utilitarne)

### Co by mel Sport Manager ukrast
- **Player development tracking** -- sledovani vyvoje hrace (testy, metriky, grafy v case). Muzeme pridat do member detail page
- **Automaticka treninková historie z dochazky** -- uz mame attendance data, staci je vizualizovat jako "treninky absolvovane" v profilu hrace

---

## 5. PlayyOn

**Pozice:** USA, zameren na registrace a online platby pro ligy.

### Co uzivatele milujou
1. **Snadna registrace** -- custom formulare embeddovatelne na web/socialni site
2. **Databaze hracu** -- automaticky kompiluje historii pro outreach/marketing
3. **Snadne nastaveni** -- "setup in minutes"

### UX patterny k inspiraci
1. **Embeddable registracni formulare** -- widget na web klubu pro prihlasovani novych clenu
2. **Social feed na homepage** -- obsah pro zapojeni komunity
3. **Marketing CRM** -- cilene emaily dle segmentu (aktivni/neaktivni/byvali hraci)

### Co jim chybi
- Zastarale UI ("a bit dated")
- Moderni komunikace (zadny real-time chat)
- Analytics/statistiky
- Mobile native app

### Co by mel Sport Manager ukrast
- **Embeddable widget** pro registraci na web klubu -- verejny join link uz mame (`/join`), ale embeddable iframe by byl dalsi krok
- **CRM/marketing funkce** -- segmentovane emaily pro clenskou zakladnu (budouci feature)

---

## 6. Hudl

**Pozice:** Absolutni lider ve video analyze pro sporty. Premium segment ($400-1600/rok).

### Co uzivatele milujou
1. **AI Insights** -- automaticke shrnuti zapasu, utocna/obranna analyza, set-piece rozbor -- vse propojene s videem
2. **Assist+ tracking** -- sledovani pozice a akci kazdeho hrace, personalizovane playlisty
3. **Automaticke playlisty** -- hraci dostanou sve klipy automaticky, bez prace trenera

### UX patterny k inspiraci
1. **AI-generated game summaries** -- treneri nemuseji psat, AI udela shrnuti z dat
2. **Filtrovani podle lokace na hristi** -- kliknout na misto na hristi a videt vsechny akce
3. **Personalizovane obsah pro hrace** -- kazdy hrac vidi jen SVE klipy a data

### Pricing
| Plan | Cena/rok |
|------|----------|
| Bronze | $400/tym |
| Silver | $1,000/tym |
| Gold | $1,600/tym |

### Co jim chybi
- Team management (scheduling, komunikace)
- Platby
- Rodicovsky portal
- Pristupna cena pro male kluby

### Co by mel Sport Manager ukrast
- **AI shrnuti** -- po eventu automaticky vygenerovat shrnuti (kdo prisel, vysledek, klicove momenty) pomoci AI
- **Personalizovany dashboard pro hrace** -- kazdy hrac/rodic vidi jen sve statistiky, svou dochazku, sve tymy prominentne

---

## 7. Nike Training Club / Freeletics

**Pozice:** Individualni fitness, ne tymovy sport. Ale UX patterny jsou priklady best-in-class.

### UX patterny k inspiraci
1. **Layered complexity** -- zacni jednoduse, pokrocili uzivatele odemknout hlubsi nastaveni. Ne vse naraz
2. **Progress visualization** -- grafy, progress bary, gamifikovane milniky s odznaky
3. **Velka tlacitka, minimum taps** -- behem aktivity (treninku) jednoduche UI, zadne slosite menu
4. **Video cviceni s casovym prubehem** -- vizualni instrukce, ne text
5. **Freemium → engagement** -- NTC dal premium obsah zdarma a ziskal 60% novy aktivnich uzivatelu

### Co by mel Sport Manager ukrast
- **Drill library s video nahledama** -- uz mame SVG diagramy (30+ cviceni), ale video/animace by byly dalsi uroven
- **Gamifikace dochazky** -- odznaky za "10 treninku v rade", "100% dochazka mesic" apod.
- **Layered UI** -- rodic vidi zjednoduseny pohled, trener pokrocily, admin kompletni

---

## Trendova analyza 2026

### Co rodicce chtejou
1. **Jedina appka na vse** -- konec zonglovani 6 platformami
2. **Jednoduche platby** -- poplatky, turnaje, dresy -- vse na jednom miste
3. **Multi-family management** -- vice deti, vice sportu, vice klubu v jednom uctu
4. **Live obsah** -- fotky, videa, streamy ze zapasu

### Trendy v UX sportovnich appek 2026
1. **AI personalizace** -- doporuceni, shrnuti, predikce
2. **Gamifikace** -- odznaky, body, zebriccky, vyzvy (challenges)
3. **Dark mode** jako standard
4. **Micro-interactions** -- animace pri RSVP, pri dosazeni milniku
5. **Real-time vseho** -- SSE/WebSocket pro chat, notifikace, live updaty
6. **SafeSport / ochrana nezletilych** -- regulatorni tlak roste

### Must-have features pro coaching app
1. Kalendar se self-scheduling
2. Platebni zpracovani
3. Klientsky/rodicovsky portal
4. Automaticke pripominky
5. AI asistence (shrnuti, doporuceni)
6. Group coaching capabilities
7. Sablony a workflow automatizace

---

## SWOT Sport Manageru vs. konkurence

### Silne stranky (uz mame)
- **Per-club theming** (10 stylu, 3 barvy) -- to NIKDO jiny nema
- **Multi-tenant architektura** -- vice klubu v jednom uctu (Spond/Heja to nemaji)
- **Privacy-by-participation** -- rozvedeni rodice, role-based pristup (unikatni)
- **30+ cviceni s SVG diagramy** -- Spond/TeamSnap nic takoveho
- **Real-time SSE chat** -- Heja to ma, TeamSnap ne
- **QR dochazka + magic link RSVP** -- pokrocile vs. konkurence
- **5 jazyku** -- TeamSnap je jen EN, Spond ma EN/NO/SV/DA
- **Self-service onboarding** -- 4-krokovy wizard

### Slabiny
- **Zadna mobilni nativni app** (Expo stub existuje, ale neni hotova)
- **Zadny offline mode**
- **Zadna video integrace**
- **Zadna galerie** (stub, feature-flagged)
- **Mene znama znacka** -- novy hrac na trhu

### Prilezitosti
1. **AI features** -- shrnuti, doporuceni, automaticke reporty (zadny konkurent to nema na urovni tymu)
2. **Gamifikace** -- body za dochazku, odznaky, vyzvy mezi tymy
3. **FACR/svazova integrace** -- unikatni pro cesky trh (AI Liga Sync)
4. **Embeddable widgety** -- registrace na webu klubu
5. **Player development tracking** -- progresni grafy, testy
6. **Fotogalerie / media** -- aktivace existujiciho stubu

### Hrozby
- **Spond je zdarma** -- tezke soutezit s "free + ad-free"
- **TeamSnap ma brand recognition** v USA
- **Heja roste** v Skandinavii (popr. expanduje)

---

## Akccni plan -- co implementovat

### Priorita 1 (vysoka hodnota, nizka narocnost)
| Feature | Inspirace | Odhad |
|---------|-----------|-------|
| Availability locking (zamknuti RSVP pred eventem) | TeamSnap | 2-4h |
| Gamifikace dochazky (odznaky, streaky) | Nike/Freeletics | 4-8h |
| AI shrnuti po eventu | Hudl | 4-6h |
| Activity feed obohaceni (fotky v feedu) | Heja | 3-5h |

### Priorita 2 (vysoka hodnota, stredni narocnost)
| Feature | Inspirace | Odhad |
|---------|-----------|-------|
| Player development tracking (grafy progresu) | Sportlyzer | 8-12h |
| Mapova integrace u eventu | Spond | 4-6h |
| SafeSport compliance marketing | Heja | 2-3h (marketing copy) |
| Galerie aktivace | Heja | 6-10h |

### Priorita 3 (vysoka hodnota, vysoka narocnost)
| Feature | Inspirace | Odhad |
|---------|-----------|-------|
| Mobilni app (Expo) | Vsichni | 40-80h |
| Offline mode | TeamSnap | 16-24h |
| Video integrace (upload + playback) | Hudl/Heja | 20-30h |
| Embeddable registracni widget | PlayyOn | 8-12h |

---

## Pricing strategie -- doporuceni

Na zaklade analyze konkurence:

| Tier | Cena | Cil |
|------|------|-----|
| **Free** | $0 | Neomezeni clenove, BEZ reklam (jako Spond), zakladni funkce |
| **Pro** | $9.99/mes nebo $79/rok | Pokrocila analytika, AI shrnuti, gamifikace, prioritni podpora |
| **Club** | $29.99/mes nebo $249/rok | Multi-tym, custom branding, Stripe Connect, audit log, API pristup |

**Klicove odliseni od TeamSnapu:** Free tier je opravdu free (bez reklam, bez limitu na cleny, s RSVP).
**Klicove odliseni od Spondu:** Pokrocila analytika, AI, theming, cviceni, player development.

---

*Zpracovano: 12. kveten 2026*
*Zdroje: GetApp, Capterra, G2, SoftwareAdvice, oficailni stranky konkurentu, Hudl Blog, UX trendy 2026*
