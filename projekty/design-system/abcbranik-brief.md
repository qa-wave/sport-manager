# BRANIK Design System — Brief pro Claude Design (verze 2)

**Účel:** Reset BRANIK DS po halucinaci agenta v první iteraci. Tento brief je **závazný a doslovný** — Claude Design NESMÍ inferovat barvy z názvu klubu, kontextu fotbalu, ani roku 1914.

---

## ❗ DŮLEŽITÉ — DO NOT INFER

Agent v předchozí iteraci dostal "ABC Braník 1914 fotbalový klub" a **vymyslel si** typický český footballový vzhled (červená + navy + zlatá + stencil fonty). To je **HALUCINACE**. Reálná abcbranik.cz nic z toho nemá.

**Pravidla pro tento DS:**
1. **NEVYMÝŠLEJ barvy.** Použij **POUZE** hodnoty níže.
2. **ŽÁDNÁ navy.** Žádná `#0B1B3A`, žádná dark blue jako primary nebo accent.
3. **ŽÁDNÁ červená.** Žádná `#D9261C`, žádná jersey red, žádná destructive jako primary.
4. **ŽÁDNÁ zlatá / `#C8A24B` / "1914 historic accent".** 
5. **ŽÁDNÉ stencil fonty** (Big Shoulders Display, Oswald, Impact). Žádný serif (Fraunces, Source Serif).
6. Pokud máš pochybnost → **ptej se uživatele**, neimplementuj.

---

## ZÁVAZNÉ TOKENY (z reálné abcbranik.cz)

### Brand colors

```css
--brand-blue:        #5F9AC6;   /* primary — abcbranik.cz nav header */
--brand-teal:        #089D9A;   /* sekundární akcent, řídký (link/hover) */
```

### Neutral / text

```css
--bg:                #FFFFFF;   /* white, dominant */
--bg-surface:        #F0F4F7;   /* light gray surface */
--text-primary:      #121619;   /* near-black, hlavní text (450× výskyt) */
--text-secondary:    #212529;   /* tmavá šedá, secondary (348× výskyt) */
--text-muted:        #878D96;   /* muted gray (135,141,150) */
--gray-mid:          #808080;   /* mid gray, oddělovače */
--black:             #000000;   /* borders, occasional text */
```

### Semantic (odvozené)

```css
--success:           #089D9A;   /* používá teal — kromě toho na webu žádný status systém není */
--info:              #5F9AC6;   /* primary blue */
--warning:           ?         /* abcbranik.cz to nemá — agent navrhne, neutral amber okolo #B87914 OK */
--danger:            ?         /* totéž — neutral amber-red, NE jersey red */
```

### Typography

```css
--font-headline:     "revolution-gothic", sans-serif;   /* 714× výskyt — DOMINANT */
--font-body:         "Inter", system-ui, -apple-system, sans-serif;   /* 240× */
--font-mono:         ui-monospace, "JetBrains Mono", monospace;   /* pro kód, není na webu */
```

**Nikdy nepoužívej:** Fraunces, Source Serif, Big Shoulders, Oswald, Impact, jakýkoli stencil/military/serif.

### Font sizes

```css
--fs-xs:    12px;
--fs-sm:    14px;
--fs-base:  16px;     /* dominantní */
--fs-md:    18px;
--fs-lg:    24px;     /* H3 */
--fs-xl:    28px;     /* H2 */
--fs-2xl:   40px;     /* H1 */
```

### Radii

```css
--r-xs:     4px;
--r-sm:     8px;
--r-tab:    0 0 8px 8px;   /* SIGNATURE: rounded bottom only — sticky-tab look (56× výskyt) */
--r-pill:   64px;          /* avatary, tags */
--r-full:   9999px;
```

### Shadows

```css
--shadow-active:   inset 0 -4px 0 #FFFFFF;   /* SIGNATURE: underline-style active state (28× výskyt) */
--shadow-sm:       0 1px 2px rgba(18,22,25,0.05), 0 2px 6px rgba(18,22,25,0.06);
--shadow-md:       0 4px 12px rgba(18,22,25,0.08), 0 12px 24px rgba(18,22,25,0.06);
```

### Spacing scale

```css
--s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
--s-5: 20px; --s-6: 24px; --s-8: 32px; --s-10: 40px;
--s-12: 48px; --s-16: 64px;
```

---

## VIZUÁLNÍ DNA abcbranik.cz

- **Look:** clean modern web, minimalistická paleta (modrá + bílá + tmavá šedá), žádné dramatické pozadí
- **Header / Nav:** plné modré (`#5F9AC6`) s bílým textem, sticky topbar
- **Active nav state:** `inset 0 -4px 0 white` — bílý underline, ne podtržení
- **Body:** white background, dark text `#121619`
- **Surfaces:** light gray `#F0F4F7` pro karty/sekce
- **Headlines:** `revolution-gothic` — geometric, condensed, modern (NE stencil)
- **Body:** `Inter` — neutral sans
- **Vůbec:** žádné gradients, žádné glow, žádné decorative shadows. Subtle, klidné, profesionální.

---

## CONTEXT — APP, NE WEB

**Důležité rozlišení:**
- `abcbranik.cz` je **veřejný klubový web** (rosters, zápasy, statistiky, news)
- **BRANIK app** (tento DS) je **multi-tenant SaaS pro správu sportovních klubů** — ABC Braník je jeden z klientů, další je TJ Spartak Kbely
- **Brand barvy z abcbranik.cz** se v BRANIK appce použijí jako **default/Braník-tenant theme**, ale **architektura DS musí podporovat per-tenant override** (Spartak Kbely má vlastní barvu)
- **Komponenty** (Calendar, Messages, RSVP, Notifications, Role switcher) jsou **app-specific**, ne web-specific
- **Aesthetic:** clean SaaS admin, NE football club marketing site

---

## KOMPONENTY (ponech, byly v původním DS)

Tyto komponenty z předchozí iterace byly fajn, jen je předělej do nové palety:
- Avatars (sizes, initials, stack, online indicator)
- Badges (status, role pills, counts)
- Buttons (primary/secondary/outline/ghost — primary = `#5F9AC6` blue, NE červená)
- Calendar month (Czech locale, today highlighted)
- Cards (default/hero/accent — accent border-left v `#5F9AC6`)
- Event card (training/match/RSVP inline)
- Inputs (input/select/focus/error)
- Message bubble (chat bubbles, date sep, optimistic)
- Nav items (sidebar — light bg, ne dark navy; active = `#5F9AC6` background s bílým textem)
- Notification bell (per-type icons + colors, bez gold/zlaté)
- Role switcher (DEV-only topbar segmented control)

---

## ŠABLONA INSTRUKCE PRO CLAUDE DESIGN

Po resetu kvóty zadat tento přesný text:

> Hi. Důležité: tato iterace je **reset** předchozí, kde jsi halucinoval barvy ABC Braníku.
>
> **Reálná abcbranik.cz** má JEDINOU brand barvu: `#5F9AC6` modrá (nav header bg). Plus `#089D9A` teal jako řídký akcent, bílou bg, `#121619` text, `Inter` + `revolution-gothic` fonty. **Žádná navy, žádná červená, žádná zlatá, žádný stencil.**
>
> Použij doslovně tokens z `branik/projekty/design-system/abcbranik-brief.md`. Pokud tokeny pro něco chybí (např. warning/danger), drž se neutrálních hodnot — žádné jersey red.
>
> BRANIK app je multi-tenant SaaS pro správu sportovních klubů, ne klub-web. Aesthetic: clean SaaS admin.
>
> Zachovej původní seznam komponent (Avatars/Badges/Buttons/Calendar/Cards/Event card/Inputs/Message bubble/Nav/Notification bell/Role switcher), jen přepiš do nové palety.

---

## ROZHODNUTÍ UŽIVATELE (potvrzeno 22. 4. 2026)

1. **BRANIK v1 → smazat** (broken).
2. **Default font v appce → `Inter`** (čistý SaaS look, ne klub-marketing). `revolution-gothic` v DS NEPOUŽÍVAT.
3. **Teal `#089D9A` → ignorovat** (jen 4× výskyt na abcbranik.cz, marginální). Z DS úplně vynechat.

### Důsledky pro tokens

- `--font-headline` = `"Inter", system-ui, sans-serif` (stejně jako body)
- `--font-body` = `"Inter", system-ui, sans-serif`
- `--brand-teal` token **NEEXISTUJE**
- Sekundární akcent v DS: lighter shade `#5F9AC6` (např. `#A4C5DD`) nebo úplně bez sekundární barvy
