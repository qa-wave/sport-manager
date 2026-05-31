# 07 — Konkurenční analýza & gap list

> Rešerše k 2026-05-31. Projeto 19 konkurentů napříč US/EU/UK/CZ/SK. Cíl: co sport-manageru chybí.
> Gapy ověřené proti aktuálnímu kódu (`apps/web/app/(admin)/admin/`), ne jen proti paměti.

## Projetí konkurenti

| Skupina | Hráči |
|---|---|
| **US enterprise** | TeamSnap (+ONE), SportsEngine (NBC), Stack Sports (+PlayMetrics merger) |
| **EU grassroots** | Spond, Heja, SportEasy, Teamer |
| **UK kluby** | Pitchero, myClubhouse |
| **US mid** | TeamLinkt, Clubspot, PlayMetrics, Jersey Watch, Crossbar, LeagueApps |
| **CZ/SK (náš trh)** | Týmuj.cz, EOS, Sportnet/SFZ, FAČR (IS/FotbalCZ), Sportlyzer |

## Co už MÁME silného (moaty — neztratit)

- **Tréninkový obsah** — 30+ drillů se SVG schématy, AI-generovaná videa, drag-to-calendar plánovač, fyzio modul, strategie, exercise editor, lineup-builder. **Žádný konkurent (vč. EOS, Týmuj) tohle nemá na téhle úrovni.**
- **Privacy-by-participation** — oddělené účty rodičů, táta nevidí konverzaci máma+trenér. Unikát.
- **Per-club theming** — 3 barvy × 10 stylů. Hlubší než kdokoli.
- **SSE real-time chat, QR docházka, magic-link RSVP bez loginu, multi-tenant RLS.**
- **Federation-sync** zadrátovaný (FAČR adapter) + **lineup-builder** v adminu.

## Gapy — prioritizováno pro ČESKÝ trh

### 🔴 P0 — Kritické pro CZ (bez nich nás EOS/Týmuj přebijí)
1. **Bankovní párování plateb (VS) + virtuální konta + fakturace** — máme jen Stripe (zahraniční model). EOS má API na 10 CZ/SK bank (Fio, KB, ČS, ČSOB, Raiffeisen, Moneta…), automatické párování dle variabilního symbolu, virtuální konta členů, fakturaci. **Na CZ trhu (převody, klubové účetnictví, dotace) je Stripe nedostatečný.**
2. **Plná FAČR/svaz integrace** — adapter máme zadrátovaný, ale prohloubit: import soupisek, rozpisů, oficiálních výsledků; rozšířit na ČSLH/ČBF/florbal/házená (EOS pokrývá 8 sportů, Sportnet má nativní SFZ/ISSF). Největší lokální diferenciátor proti globálům. Pozor: IS FAČR nemá veřejné API → scraper (Scortes).
3. **Nativní mobilní app** — máme jen Expo stub. Všichni konkurenti (vč. Týmuj, EOS) mají nativní app; čeští rodiče ji očekávají.
4. **GDPR/souhlasy + evidence pro dotace** — registrace se souhlasy, export do NSA rejstříku sportovců a ČUS/ISCUS (kvůli dotacím). Máme waivers, ale ne plný dotační flow. EOS má GDPR modul.

### 🟠 P1 — Vysokohodnotné diferenciátory
5. **AI asistent** (à la TeamLinkt „Emi" — jediný na trhu s reálným generativním AI): AI plánovač rozpisů (conflict-free), AI rozdělení hráčů do týmů dle skillu, AI shrnutí/obsah/reporty. **Nikdo v EU/CZ to nemá.** Máme náskok přes AI drill videa → rozšířit na asistenta. Stack přes Vercel AI Gateway.
6. **Veřejný website builder klubu + vlastní doména** — máme jen `/k/{slug}` showcase. Pitchero/Jersey Watch/myClubhouse to mají jako core (klubový web, vlastní doména, klubové emaily, auto-aktualizace skóre/rozpisu).
7. **Fundraising** — druhý příjmový kanál. Spond (Spot the Ball, stírací losy, Superdraw, 75% revenue share), Pitchero (Club Lottery). Žádný team-tool kromě Spondu to nemá.
8. **Online registrace/nábor členů** — veřejné signup formuláře, waitlist s auto-povýšením, family/multi discounts. Máme invite, ne veřejný nábor. Mají všichni (Pitchero, PlayMetrics, Jersey Watch, LeagueApps).

### 🟡 P2 — Parita funkcí
9. **Live match scoring + statistiky** — góly/asistence/MVP/ratingy hráčů, real-time match tracking s časovými razítky. SportEasy je na tohle nejsilnější; PlayMetrics má depth charts. Máme lineup-builder → dodělat zápasový live mód.
10. **SMS notifikace** — máme jen email/push. Teamer má SMS zabudované (vzácné, ceněné rodiči).
11. **Tournament/bracket management** — round-robin, brackety, standings. TeamSnap Tournaments, Stack Tourney, Crossbar playoff brackets.
12. **E-shop / merch** — prodej dresů/zboží členům. myClubhouse (loyalty body, sklad), LeagueApps, Stack Team Store.
13. **Sponzorský prostor v appce** — SportEasy „Sponsors" plan (prostor pro sponzory), TeamLinkt sponsorship matching.

### 🔵 P3 — Niche / později
14. **Rezervace sportovišť/kurtů** — myClubhouse, PlayMetrics (field plans), Crossbar, LeagueApps (owned + rented).
15. **Officials/rozhodčí management + výplaty** — Stack Officials (scheduling + certifikace + výplata rozhodčích, synced s rozpisem). Lepkavé pro ligy.
16. **Live streaming + AI auto-highlights** — TeamSnap×XbotGo (AI kamera), SportsEngine×Pixellot (per-sport AI, zdarma venues). Nová high-end linie, žádný menší hráč nemá.
17. **Direct Debit / GoCardless** recurring — myClubhouse. Pro EU opakované platby.
18. **Background screening / SafeSport** — SportsEngine NCSI. **US-only, pro CZ irelevantní.**

## Cenové modely (k inspiraci)

- **Reklamní free tier validovaný** — TeamLinkt (zdarma + in-app reklama + premium bez reklam) = přesně náš model. Pitchero má reklamu na free tieru taky. Pozor: LeagueApps reklamu odmítá jako „levný" signál.
- TeamLinkt processing **2.7 % + $0.30** (industry-low), Spond **0,20 € + 2,5 %** (EU). Náš „zdarma s reklamou / placené bez reklam" je jednodušší než vrstvené team-capy TeamSnapu.

## Doporučení — kam dál

**Top 3 pro CZ trh (rozhodují o tom, jestli nás EOS/Týmuj přebijí):**
1. Bankovní párování plateb + fakturace (P0 #1)
2. Prohloubit FAČR sync + rozšířit na další sporty (P0 #2)
3. Nativní mobilní app (P0 #3)

**Globální diferenciátor:** AI asistent (P1 #5) — nikdo v EU/CZ ho nemá, my máme náskok v AI obsahu.

**Náš trvalý moat:** tréninkový obsah + privacy modely — držet a prohlubovat, je to jediné, co nám konkurence nezkopíruje rychle.
