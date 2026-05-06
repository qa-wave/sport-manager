# UI Design: 5 Designových Směrů — ABC Braník Club App

**Od:** UI Designér
**Pro:** Frontend vývojář, Mobilní vývojář
**Datum:** 2026-04-18
**Projekt:** ABC Braník — Club App Design System
**Status:** Kompletní specifikace, připraveno k implementaci

---

## Kontext a rozhodnutí

Stávající 5 variant na `/admin/design-preview` sdílí identický layout pattern (sidebar + content area) a liší se jen barvami a typografií. Tento dokument definuje 5 **zásadně odlišných** architektur — každá má jiný mental model, jiný způsob organizace informací a jiné interakční vzory.

---

## SMĚR 1: "BROADCAST"

**Concept:** TV sportovní přenos. Uživatel sleduje klub jako živý broadcast — ticker, live stavy, velká čísla, dramatický přechod světla a stínu. Mental model: ESPN / Sky Sports dashboard.

### Barevná paleta

| Název | Hex | HSL | Použití |
|-------|-----|-----|---------|
| `--bc-void` | `#080c14` | 225 40% 6% | Pozadí stránky (pitch black) |
| `--bc-surface` | `#0e1420` | 225 38% 9% | Karty, panely |
| `--bc-surface-raised` | `#141c2e` | 225 36% 13% | Hover stav karet |
| `--bc-border` | `#1e2a3d` | 225 33% 18% | Linky, oddělovače |
| `--bc-neon` | `#3de8a0` | 155 78% 56% | Live indikátor, primary CTA |
| `--bc-neon-glow` | `#3de8a020` | 155 78% 56% / 12% | Glow efekt za neon prvky |
| `--bc-blue` | `#609bc6` | 205 47% 55% | Braník brand, secondary accent |
| `--bc-amber` | `#f0a020` | 38 86% 53% | Warning, score changes |
| `--bc-red` | `#e83d3d` | 0 78% 57% | Prohraný zápas, critical alert |
| `--bc-ink` | `#e8eef8` | 220 40% 94% | Primární text |
| `--bc-ink-dim` | `#6b7f9a` | 215 20% 51% | Sekundární text, timestamps |
| `--bc-ticker-bg` | `#0a1420` | 215 42% 8% | Ticker bar pozadí |

### Typografie

| Styl | Font | Size | Weight | Line-height | Letter-spacing |
|------|------|------|--------|-------------|----------------|
| `score-hero` | Oswald | 72px | 700 | 72px | -1px |
| `score-label` | Oswald | 48px | 600 | 48px | 0px |
| `headline` | Oswald | 28px | 600 | 32px | 0px |
| `stat-number` | `"JetBrains Mono", monospace` | 36px | 700 | 40px | -0.5px |
| `stat-label` | Oswald | 10px | 500 | 12px | 2px uppercase |
| `body` | `"Inter", sans-serif` | 14px | 400 | 20px | 0px |
| `ticker` | Oswald | 12px | 500 | 16px | 1px uppercase |
| `meta` | `"JetBrains Mono", monospace` | 11px | 400 | 16px | 0px |

**Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500&display=swap');
```

### Spacing systém (8px base grid)

```
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-5: 20px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

Broadcast používá hustší spacing než ostatní — informační density je klíčová.

### Layout pattern

```
┌─────────────────────────────────────────────────────────────┐
│  TICKER BAR (40px, fixed top, scrolling text + live dots)   │
├──────────┬──────────────────────────────────────────────────┤
│          │  HERO PANEL (full bleed, 320px height)           │
│ VERTICAL │  Score / Next Match / Live status                │
│  NAV     ├──────────────────────────────────────────────────┤
│ (56px    │  HORIZONTAL SCROLL ROW — STAT CARDS              │
│  wide,   │  [────] [────] [────] [────] →                   │
│  icons   ├──────────────────────────────────────────────────┤
│  only)   │  2-COLUMN GRID                                   │
│          │  Left (60%): Event feed / Activity stream        │
│  Active  │  Right (40%): Team roster + quick actions        │
│  state:  │                                                  │
│  neon    │                                                  │
│  left    │                                                  │
│  border  └──────────────────────────────────────────────────┤
│  +       │  BOTTOM BAR (mobile only, 56px, 5 tab icons)     │
│  bg glow └──────────────────────────────────────────────────┘
└──────────┘
```

**Grid:** 12 sloupců, gutters 16px, max-width 1440px
**Breakpoints:**

| Název | Min-width | Změna layoutu |
|-------|-----------|---------------|
| mobile | 0px | 1 sloupec, tab bar dole, no sidebar |
| tablet | 640px | sidebar 56px icon-only, 1 main column |
| desktop | 1024px | sidebar 56px + 2-column content grid |
| wide | 1400px | sidebar rozbalitelný na 200px hover |

### CSS Variables (kompletní theme)

```css
:root[data-theme="broadcast"] {
  /* Colors */
  --bc-void: #080c14;
  --bc-surface: #0e1420;
  --bc-surface-raised: #141c2e;
  --bc-border: #1e2a3d;
  --bc-neon: #3de8a0;
  --bc-neon-glow: rgba(61, 232, 160, 0.12);
  --bc-blue: #609bc6;
  --bc-amber: #f0a020;
  --bc-red: #e83d3d;
  --bc-ink: #e8eef8;
  --bc-ink-dim: #6b7f9a;
  --bc-ticker-bg: #0a1420;

  /* Typography */
  --font-display: 'Oswald', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-body: 'Inter', sans-serif;

  /* Shadows */
  --shadow-card: 0 0 0 1px var(--bc-border), 0 4px 24px rgba(0,0,0,0.4);
  --shadow-neon: 0 0 16px var(--bc-neon-glow), 0 0 32px rgba(61,232,160,0.06);
  --shadow-blue: 0 0 16px rgba(96,155,198,0.15);

  /* Borders */
  --radius-card: 4px;
  --radius-badge: 2px;
  --radius-button: 3px;

  /* Transitions */
  --transition-fast: 80ms ease-out;
  --transition-normal: 150ms ease-out;
}
```

### Komponenty

#### 1. Event Card (Broadcast style)

```
┌─────────────────────────────────────────────────────┐
│ •LIVE  TRÉNINK  · STŘEDA 14:30        ČÍSLO HRÁČŮ  │  ← ticker-style header row
├─────────────────────────────────────────────────────┤
│ A-TÝM vs. B-TÝM                                    │
│ ████████████████████░░░░░░░░  18/24 POTVRZENO      │  ← progress bar
│ Stadion Braník · Hřiště 2                          │
├─────────────────────────────────────────────────────┤
│ [RSVP ANO]  [RSVP NE]          Zbývá: 4h 23m       │  ← CTA + countdown
└─────────────────────────────────────────────────────┘
```

**Specifikace:**
- `background: var(--bc-surface)`
- `border: 1px solid var(--bc-border)`
- `border-radius: var(--radius-card)` (4px — sharp, TV-style)
- `border-left: 3px solid var(--bc-blue)` (kategorie barva)
- Live state: `border-left-color: var(--bc-neon)` + neon glow shadow
- Header row: `background: rgba(255,255,255,0.03)`, Oswald 10px uppercase
- Progress bar: výška 4px, `border-radius: 2px`, track `var(--bc-border)`, fill gradient `var(--bc-blue)` → `var(--bc-neon)`
- Countdown: JetBrains Mono 11px, `color: var(--bc-amber)`
- Hover: `background: var(--bc-surface-raised)`, `transform: translateY(-1px)`, `transition: 150ms`

#### 2. Stat Card (Broadcast style)

```
┌──────────────┐
│    247       │  ← číslo: Oswald 48px Bold
│  ▲ +12       │  ← delta: neon green 12px
│  CELKEM KM   │  ← label: Oswald 9px uppercase
│  ████████░░  │  ← sparkline (mini line chart)
└──────────────┘
```

**Specifikace:**
- Šířka: 160px, výška: 140px, `flex-shrink: 0` (horizontal scroll container)
- `background: var(--bc-surface)`
- `border-top: 2px solid var(--bc-blue)` (accent top border)
- Číslo: `font-family: var(--font-display)`, 48px, `#e8eef8`
- Delta nahoru: `color: var(--bc-neon)` + `▲` prefix, 12px
- Delta dolů: `color: var(--bc-red)` + `▼` prefix
- Label: 9px uppercase, `letter-spacing: 2px`, `color: var(--bc-ink-dim)`
- Sparkline: SVG `polyline`, stroke `var(--bc-blue)`, opacity 0.7, výška 28px

#### 3. Message Bubble (Broadcast style)

Místo klasických bublin: **feed-style záznamy** jako sportovní live komentář.

```
14:32  coach@  →  A-TÝM          ┐
       "Trénink posunut na 15:00" │  jeden řádek, monospace timestamp
       [Přečteno 12×]             ┘
```

**Specifikace:**
- Layout: `display: flex`, `gap: 12px`
- Timestamp: JetBrains Mono 11px, `color: var(--bc-ink-dim)`, `width: 40px`, `flex-shrink: 0`
- Sender badge: Oswald 10px uppercase, `color: var(--bc-blue)`, `border: 1px solid var(--bc-border)`, `padding: 2px 6px`, `border-radius: 2px`
- Text: Inter 14px, `color: var(--bc-ink)`
- Read count: JetBrains Mono 10px, `color: var(--bc-ink-dim)`, `opacity: 0.6`
- Vlastní zpráva: `border-left: 2px solid var(--bc-neon)`, `padding-left: 10px`

### Navigace

**Ticker bar (top, fixed, 40px):**
```css
.ticker-bar {
  background: var(--bc-ticker-bg);
  border-bottom: 1px solid var(--bc-neon);
  font-family: var(--font-display);
  font-size: 11px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--bc-ink-dim);
  overflow: hidden;
}
.ticker-content {
  animation: ticker-scroll 30s linear infinite;
  white-space: nowrap;
}
@keyframes ticker-scroll {
  from { transform: translateX(100vw); }
  to { transform: translateX(-100%); }
}
```

**Vertical nav sidebar (56px, icon-only):**
```css
.sidebar-broadcast {
  width: 56px;
  background: var(--bc-void);
  border-right: 1px solid var(--bc-border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
  gap: 4px;
}
.sidebar-item {
  width: 40px; height: 40px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 4px;
  color: var(--bc-ink-dim);
  transition: 80ms;
}
.sidebar-item.active {
  color: var(--bc-neon);
  background: var(--bc-neon-glow);
  box-shadow: inset 3px 0 0 var(--bc-neon);  /* left border inside */
}
.sidebar-item:hover:not(.active) {
  background: rgba(255,255,255,0.04);
  color: var(--bc-ink);
}
```

### Animace a mikrointerakce

- **Live dot:** `animation: live-pulse 1.4s ease-in-out infinite`
  `@keyframes live-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.8); } }`
- **Stat update:** Číslo se změní s `animation: count-flip 300ms cubic-bezier(0.34, 1.56, 0.64, 1)` — krátké scale-up + fade
- **Card hover:** `transform: translateY(-2px)`, `box-shadow: var(--shadow-card), 0 8px 32px rgba(0,0,0,0.4)`, `transition: 120ms`
- **Ticker pause:** `:hover` na ticker kontejneru pausuje animaci
- **RSVP button:** po kliknutí krátký `scale(0.95)` → `scale(1.02)` → `scale(1)` (100ms celkem)

---

## SMĚR 2: "NORDIC MINIMAL"

**Concept:** Skandinávský minimalismus inspirovaný Dieter Ramsem a švédským designem. Forma sleduje funkci. Žádné dekorace. Jen typografie, whitespace a jemné stíny. Mental model: Framer / Linear / Things 3.

### Barevná paleta

| Název | Hex | HSL | Použití |
|-------|-----|-----|---------|
| `--nm-white` | `#ffffff` | 0 0% 100% | Pozadí stránky |
| `--nm-snow` | `#f7f8fa` | 220 20% 97% | Sekundární pozadí, input bg |
| `--nm-mist` | `#eceef2` | 220 15% 93% | Hover bg, dividers |
| `--nm-fog` | `#d1d5de` | 220 12% 84% | Borders (barely visible) |
| `--nm-steel` | `#8b93a4` | 220 10% 60% | Placeholder, disabled text |
| `--nm-slate` | `#4a5162` | 222 13% 34% | Sekundární text |
| `--nm-ink` | `#0f1117` | 225 7% 8% | Primární text |
| `--nm-blue` | `#609bc6` | 205 47% 55% | Primary accent (Braník) |
| `--nm-blue-pale` | `#e8f1f9` | 205 47% 94% | Accent pozadí, hover bg |
| `--nm-blue-dark` | `#4a7fa8` | 205 39% 47% | Hover stav blue prvků |
| `--nm-success` | `#2d9975` | 158 56% 39% | Confirmed, positive |
| `--nm-warn` | `#c47b1a` | 34 76% 44% | Warning, needs attention |

**Dark mode:**
```
--nm-white → #0f1117
--nm-snow → #141720
--nm-mist → #1c2029
--nm-fog → #2a2f3d
--nm-steel → #5a6278
--nm-slate → #9aa0b4
--nm-ink → #ebedf2
--nm-blue → #609bc6 (stejná)
--nm-blue-pale → #0d1f2f
```

### Typografie

Jeden font family, variabilní váha. Absolutní typografická čistota.

| Styl | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|---------|
| `display` | Inter (var) | 48px | 300 | 52px | -1.5px |
| `h1` | Inter | 32px | 400 | 40px | -0.8px |
| `h2` | Inter | 24px | 400 | 32px | -0.4px |
| `h3` | Inter | 18px | 500 | 26px | -0.2px |
| `body-l` | Inter | 16px | 400 | 26px | 0px |
| `body` | Inter | 14px | 400 | 22px | 0px |
| `body-s` | Inter | 13px | 400 | 20px | 0px |
| `caption` | Inter | 11px | 500 | 16px | 0.2px |
| `label` | Inter | 11px | 600 | 14px | 0.6px uppercase |
| `mono` | `"JetBrains Mono", monospace` | 13px | 400 | 20px | 0px |

**Typografické pravidlo:** Headings nikdy tučně nad weight 500. Síla vychází z velikosti a prostoru, ne z tučnosti.

### Spacing systém (4px base, velkorysé whitespace)

```
--space-1: 4px    --space-2: 8px    --space-3: 12px
--space-4: 16px   --space-5: 20px   --space-6: 24px
--space-8: 32px   --space-10: 40px  --space-12: 48px
--space-16: 64px  --space-20: 80px  --space-24: 96px
--space-32: 128px
```

Nordic Minimal záměrně používá `--space-16` a větší pro oddělení sekcí.

### Layout pattern

```
┌──────────────────────────────────────────────────────────────┐
│  TOPBAR (60px, jen logo + search + avatar, žádný jiný UI)   │
├───────────────────┬──────────────────────────────────────────┤
│                   │                                          │
│  LEFT NAV         │   CONTENT AREA                          │
│  (220px)          │                                          │
│                   │   OFFSET HEADER                         │
│  Plain text       │   ┌──────────────────┐                  │
│  links, no        │   │ Page title       │  ← left-aligned, │
│  icons initially  │   │ (H1, light)      │    offset -16px  │
│                   │   └──────────────────┘    from content  │
│  ─────────────    │                                          │
│                   │   ASYMMETRIC 2-COL GRID                 │
│  Section          │   Main (65%) + Aside (35%)              │
│  Sub-item         │                                          │
│  Sub-item         │   Velký padding: 48px 64px              │
│                   │                                          │
│  ─────────────    │                                          │
│                   │                                          │
│  Section          │                                          │
└───────────────────┴──────────────────────────────────────────┘
```

**Klíčové layout pravidlo:** Content area má `max-width: 880px` a je vycentrovaná s velkými sideways paddingsy. Na desktopu >1280px se aside panel floatuje doprava mimo main flow (CSS Grid s named areas).

**Grid:**
```css
.nm-layout {
  display: grid;
  grid-template-columns: 220px 1fr;
  grid-template-rows: 60px 1fr;
  min-height: 100vh;
}
.nm-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 64px;
  padding: 48px 64px;
  max-width: 1200px;
}
```

**Breakpoints:**

| Název | Min-width | Layout |
|-------|-----------|--------|
| mobile | 0px | No sidebar, hamburger menu, 24px padding |
| tablet | 768px | Sidebar collapses to 56px icon strip |
| desktop | 1024px | Full 220px sidebar, single content column |
| wide | 1280px | Asymmetric 2-col (65/35) |

### CSS Variables

```css
:root[data-theme="nordic"] {
  --nm-white: #ffffff;
  --nm-snow: #f7f8fa;
  --nm-mist: #eceef2;
  --nm-fog: #d1d5de;
  --nm-steel: #8b93a4;
  --nm-slate: #4a5162;
  --nm-ink: #0f1117;
  --nm-blue: #609bc6;
  --nm-blue-pale: #e8f1f9;
  --nm-blue-dark: #4a7fa8;
  --nm-success: #2d9975;
  --nm-warn: #c47b1a;

  /* Shadows — extremely subtle */
  --shadow-xs: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-sm: 0 1px 4px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05);

  /* Border radius */
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Transitions — slow and deliberate */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --transition-slow: 300ms var(--ease-out);
  --transition-normal: 200ms var(--ease-out);
  --transition-fast: 120ms ease-out;
}
```

### Komponenty

#### 1. Event Card (Nordic style)

Žádný border. Jen minimální shadow. Bílá karta na sněhobílém pozadí — karta je rozlišena jen stínem.

```
 April 17 — Wednesday
 ─────────────────────────────────────────────────────
 Trénink A-tým                               14:30 →
 Braník — Hřiště 1                    18 z 24 účastní

                                              RSVP ↗
```

**Specifikace:**
- `background: var(--nm-white)`
- `border-radius: var(--radius-md)` (8px)
- `box-shadow: var(--shadow-sm)` (jen na hover rozšíří na `--shadow-md`)
- **Žádný visible border** v default stavu
- Datum: Inter 11px, weight 500, uppercase, `letter-spacing: 0.6px`, `color: var(--nm-steel)`
- Tenká `border-top: 1px solid var(--nm-fog)` pod datem
- Název: Inter 16px, weight 400, `color: var(--nm-ink)`
- Metadata: Inter 13px, `color: var(--nm-slate)`
- Čas: Inter 13px, `color: var(--nm-blue)`, right-aligned
- RSVP link: Inter 11px, weight 600, uppercase, `color: var(--nm-blue)`, `text-underline-offset: 3px`
- Padding: `24px`
- Hover: `box-shadow: var(--shadow-md)`, `transform: translateY(-2px)`, `transition: var(--transition-normal)`

#### 2. Stat Card (Nordic style)

Čísla jako typografická socha — velká, lehká, prostorná.

```
 POTVRZENÉ ÚČASTI
 ─────────────────
       18
       z 24 celkem


```

**Specifikace:**
- `background: var(--nm-white)`
- `box-shadow: var(--shadow-xs)`
- `border-radius: var(--radius-lg)` (12px)
- Label: Inter 10px, weight 600, uppercase, `letter-spacing: 1px`, `color: var(--nm-steel)`, `margin-bottom: 16px`
- Číslo: Inter 64px, weight 300, `color: var(--nm-ink)`, `line-height: 1`
- Subtext: Inter 14px, weight 400, `color: var(--nm-slate)`
- Padding: `32px`
- Prázdný prostor je záměr — žádné sparklines, žádné gradienty

#### 3. Message Bubble (Nordic style)

Konverzace jako editorial dialog — žádné bubliny, jen typografie.

```
Martin P.              14:32
Trénink je posunutý na 15:00 z důvodu úpravy
hřiště. Vezměte si s sebou náhradní dresy.

                               Tomáš M.  14:35
        Ok, budeme tam. Přijdeme i s Alexem.

```

**Specifikace:**
- Kontejner: `padding: 16px 24px`, žádný vizuální oddělovač
- Cizí zpráva: vlevo, žádná bublina, jen text. Sender: Inter 12px weight 500 ink. Timestamp: Inter 11px steel. Text: Inter 15px, `line-height: 26px`
- Vlastní zpráva: vpravo-zarovnaná, text také plaintext, ale `color: var(--nm-blue-dark)`
- Oddělovač dne: tenká linka `var(--nm-fog)` s datem uprostřed, Inter 11px
- Unread badge: jen tečka `6px`, `background: var(--nm-blue)`, u jména

### Navigace

**Left nav (220px):**
```css
.nm-nav {
  padding: 40px 24px;
  border-right: 1px solid var(--nm-mist);
  background: var(--nm-white);
}
.nm-nav-section-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: var(--nm-steel);
  margin-bottom: 8px;
  padding-left: 12px;
}
.nm-nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 400;
  color: var(--nm-slate);
  text-decoration: none;
  transition: var(--transition-fast);
}
.nm-nav-item:hover {
  background: var(--nm-mist);
  color: var(--nm-ink);
}
.nm-nav-item.active {
  background: var(--nm-blue-pale);
  color: var(--nm-blue-dark);
  font-weight: 500;
}
```

### Animace a mikrointerakce

- **Žádné bouncy animace** — vše `ease-out` nebo `linear`
- **Page transition:** `opacity: 0 → 1`, `translateY: 8px → 0`, `duration: 300ms`
- **Input focus:** border `var(--nm-fog)` → `var(--nm-blue)`, `box-shadow: 0 0 0 3px var(--nm-blue-pale)`, `transition: 200ms`
- **Button press:** `transform: scale(0.98)`, `opacity: 0.9` — velmi subtilní
- **Skeleton loading:** `background: linear-gradient(90deg, var(--nm-snow) 25%, var(--nm-mist) 50%, var(--nm-snow) 75%)`, `background-size: 200% 100%`, `animation: shimmer 1.5s infinite`
- **Modal enter:** `transform: scale(0.97) translateY(4px) → scale(1) translateY(0)`, `300ms ease-out`

---

## SMĚR 3: "EDITORIAL / MAGAZINE"

**Concept:** Jako Sports Illustrated nebo The Athletic v tištěné podobě. Obsah je king. Typografická hierarchie dominuje. Fotografie jsou velké a dýchají. Sidebar je obsah, ne navigace. Mental model: Čtenář časopisu, ne uživatel aplikace.

### Barevná paleta

| Název | Hex | HSL | Použití |
|-------|-----|-----|---------|
| `--ed-paper` | `#faf8f4` | 40 30% 97% | Pozadí — teplá bílá (papír) |
| `--ed-cream` | `#f2eee6` | 38 30% 92% | Sekundární pozadí, aside bg |
| `--ed-border` | `#d8d0c4` | 35 15% 81% | Borders, column rules |
| `--ed-rule` | `#a89880` | 30 18% 58% | Dekorativní linky |
| `--ed-ink` | `#141210` | 20 7% 8% | Primární text |
| `--ed-byline` | `#5a5040` | 30 18% 30% | Autor, meta informace |
| `--ed-caption` | `#786858` | 28 17% 40% | Popisky, timestamps |
| `--ed-accent` | `#609bc6` | 205 47% 55% | Braník modrá — střídmě |
| `--ed-drop` | `#1a2e45` | 210 45% 18% | Drop cap barva |
| `--ed-pullquote` | `#0d1b2a` | 210 50% 11% | Pull quote pozadí |

**Barevné pravidlo:** Černobílá + jeden accent. Barva je vzácná — použije se jen pro CTA, aktivní stav, Braník brand element.

### Typografie

Dvě rodiny, kontrastní proporce — serif pro editorial autoritu, sans pro metadata.

| Styl | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|---------|
| `headline-xl` | Playfair Display | 64px | 700 italic | 68px | -1px |
| `headline-l` | Playfair Display | 40px | 700 | 46px | -0.5px |
| `headline-m` | Playfair Display | 28px | 600 | 36px | -0.3px |
| `headline-s` | Playfair Display | 22px | 600 | 30px | 0px |
| `subhead` | Playfair Display | 18px | 400 italic | 28px | 0px |
| `drop-cap` | Playfair Display | 80px | 700 | 64px | 0px |
| `body` | `"Source Serif 4", serif` | 17px | 400 | 30px | 0px |
| `body-s` | `"Source Serif 4", serif` | 15px | 400 | 26px | 0px |
| `byline` | `"Inter", sans-serif` | 12px | 500 | 16px | 0.5px |
| `label` | `"Inter", sans-serif` | 10px | 700 | 14px | 2px uppercase |
| `caption` | `"Inter", sans-serif` | 11px | 400 | 18px | 0.2px |

**Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400;1,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;1,8..60,400&family=Inter:wght@400;500;700&display=swap');
```

### Spacing systém (body text-based)

Spacing vychází z typografického rytmu (line-height = 30px).

```
--space-quarter: 8px   (¼ line)
--space-half:    15px  (½ line)
--space-1:       30px  (1 line)
--space-2:       60px  (2 lines)
--space-3:       90px  (3 lines)
--space-4:       120px (4 lines)
```

Toto zajišťuje, že obsah je vždy na "mřížce".

### Layout pattern

```
┌────────────────────────────────────────────────────────────────┐
│  MASTHEAD (88px, logo vlevo + název sekce + datum vpravo)      │
│  ═══════════════════════════════════════════════════════════  │  ← double rule
├────────────────────────────────────────────────────────────────┤
│  SECTION HEADER (32px uppercase label + thin rule)             │
├─────────────────────────────────┬──────────────────────────────┤
│                                 │                              │
│  MAIN EDITORIAL COLUMN          │  SIDEBAR                     │
│  (640px max, centered)          │  (240px, cream bg)           │
│                                 │                              │
│  Headline XL                    │  TOC (obsah, sticky)         │
│                                 │  ─────────────────          │
│  ─────────── by Martin P. ──   │  1. Tréninky                 │
│                                 │  2. Zápasy                   │
│  Body text, multi-column        │  3. Zprávy                   │
│  when content is long           │  4. Tým                      │
│                                 │  ─────────────────          │
│  "Pull quote in a wider         │  STAT BOX                   │
│   display size like             │  ┌──────────────┐           │
│   this — dramatic"              │  │ 18 účastníků  │          │
│                                 │  │ z 24 pozváno  │          │
│  Body text continues...         │  └──────────────┘           │
│                                 │                              │
│  ═══════════════════════════   │  NEXT EVENT                  │
│  RELATED EVENTS (horizontal)    │  (mini card)                 │
└─────────────────────────────────┴──────────────────────────────┘
```

**Grid:**
```css
.ed-layout {
  display: grid;
  grid-template-columns: 1fr 240px;
  gap: 0;
  max-width: 960px;
  margin: 0 auto;
  padding: 0 24px;
}
.ed-main {
  padding-right: 48px;
  border-right: 1px solid var(--ed-border);
}
.ed-sidebar {
  padding-left: 32px;
  background: var(--ed-cream);
  padding-top: 30px;
}
```

**Navigace:** Masthead s horizontálními text-linkami (ne ikony), magazine-style. Na mobilu collapse do hamburger → drawer s vertikálním menu.

**Breakpoints:**

| Název | Min-width | Layout |
|-------|-----------|--------|
| mobile | 0px | 1 col, no sidebar, 20px padding |
| tablet | 640px | 1 col + floating sidebar (240px) |
| desktop | 960px | Fixed 2-col s column rule |
| wide | 1200px | Content wider, larger typography |

### CSS Variables

```css
:root[data-theme="editorial"] {
  --ed-paper: #faf8f4;
  --ed-cream: #f2eee6;
  --ed-border: #d8d0c4;
  --ed-rule: #a89880;
  --ed-ink: #141210;
  --ed-byline: #5a5040;
  --ed-caption: #786858;
  --ed-accent: #609bc6;
  --ed-drop: #1a2e45;
  --ed-pullquote: #0d1b2a;

  --font-serif: 'Playfair Display', 'Georgia', serif;
  --font-body: 'Source Serif 4', 'Georgia', serif;
  --font-sans: 'Inter', sans-serif;

  /* No box-shadows in editorial — borders only */
  --rule-width: 1px;
  --rule-double: 3px; /* double rule = 1px + gap + 1px */

  --radius-none: 0px;    /* Editorial cards mají sharp corners */
  --radius-sm: 2px;      /* Jen pro obrázky na mobilních zařízeních */

  --transition: 200ms ease;
}
```

### Komponenty

#### 1. Event Card (Editorial style)

Navržená jako novinový "listing" — žádné kulaté rohy, žádné stíny.

```
TRÉNINK · STŘEDA 17. DUBNA · 14:30 — 16:00
─────────────────────────────────────────────
Trénink A-týmu
Stadion Braník, Hřiště 1

Martin Procházka (trenér) · 18 z 24 potvrzeno

Potvrdit účast →
```

**Specifikace:**
- `background: var(--ed-paper)`
- `border-top: 2px solid var(--ed-ink)` (silná linka nahoře — magazínový styl)
- `border-radius: 0` (žádné zaoblení)
- Typ + datum: Inter 10px, weight 700, uppercase, `letter-spacing: 2px`, `color: var(--ed-byline)`
- Tenká linka pod: `border-bottom: 1px solid var(--ed-border)`, `margin-bottom: 12px`
- Název: Playfair Display 22px, weight 600, `color: var(--ed-ink)`
- Metadata: Inter 12px, weight 400, `color: var(--ed-caption)`, `margin-top: 8px`
- CTA: Inter 12px, weight 700, uppercase, `letter-spacing: 1px`, `color: var(--ed-accent)`, `text-decoration: underline`, `text-underline-offset: 4px`
- Padding: `20px 0` (jen vertikální — grid se stará o horizontální)

#### 2. Stat Card (Editorial style)

Stat box — jako sidebar statistiky v novinách.

```
┌─────────────────────────┐
│  TENTO MĚSÍC            │
│  ─────────────────────  │
│                         │
│          18             │  ← číslo velké, Playfair 56px
│     potvrzených         │
│     z 24 pozvaných      │
│                         │
│  ─────────────────────  │
│  ▲ o 3 více než minulý  │
└─────────────────────────┘
```

**Specifikace:**
- `border: 1px solid var(--ed-border)` (tenký rámeček)
- `border-top: 3px solid var(--ed-ink)` (silná horní linka)
- `border-radius: 0`
- `background: var(--ed-cream)`
- `padding: 24px`
- Header label: Inter 9px, weight 700, uppercase, `letter-spacing: 2px`, `color: var(--ed-byline)`
- Číslo: Playfair Display 56px, weight 700, center-aligned, `color: var(--ed-ink)`
- Subtext: Source Serif 4, 14px, italic, `color: var(--ed-byline)`, center-aligned
- Linka: `border-bottom: 1px solid var(--ed-border)`, `margin: 16px 0`
- Delta: Inter 11px, `color: var(--ed-byline)`

#### 3. Message Bubble (Editorial style)

Konverzace jako dopis — přísně typografická, časopisová korespondence.

```
────────────────────────────────────────────
  MARTIN PROCHÁZKA · STŘEDA 14:32
────────────────────────────────────────────

  Trénink je posunutý na 15:00 z důvodu
  úpravy hřiště. Vezměte si s sebou
  náhradní dresy.

────────────────────────────────────────────
  TY · STŘEDA 14:35
────────────────────────────────────────────

  Ok, budeme tam. Přijdeme i s Alexem.
```

**Specifikace:**
- Kontejner: `padding: 0`, `max-width: 640px`
- Každá zpráva oddělená `border-top: 1px solid var(--ed-border)`
- Sender header: Inter 10px, weight 700, uppercase, `letter-spacing: 1.5px`, `color: var(--ed-byline)`, `padding: 12px 0 8px`
- Text: Source Serif 4, 15px, `line-height: 26px`, `color: var(--ed-ink)`, `padding: 0 0 16px`
- Vlastní zpráva: sender label `color: var(--ed-accent)`, text odsazen `padding-left: 24px` s `border-left: 2px solid var(--ed-accent)`

### Navigace

**Masthead (88px, fixed):**
```css
.ed-masthead {
  background: var(--ed-paper);
  border-bottom: 3px double var(--ed-ink); /* double rule CSS trick */
  padding: 0 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ed-masthead-logo {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 700;
  color: var(--ed-ink);
  letter-spacing: -0.5px;
}
.ed-nav-links {
  display: flex;
  gap: 32px;
  list-style: none;
}
.ed-nav-link {
  font-family: var(--font-sans);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  color: var(--ed-byline);
  text-decoration: none;
  border-bottom: 2px solid transparent;
  padding-bottom: 4px;
  transition: 200ms;
}
.ed-nav-link.active,
.ed-nav-link:hover {
  color: var(--ed-ink);
  border-bottom-color: var(--ed-ink);
}
```

### Animace a mikrointerakce

- **Stránka se načítá**: Obsah se odkrývá shora dolů jako se tiskne — `clip-path: inset(0 0 100% 0) → inset(0 0 0% 0)`, `duration: 400ms`, staggered po 60ms na sekce
- **Pull quote:** na scroll-into-view se quote zvětší z `scale(0.98)` na `scale(1)` s `opacity: 0.6 → 1`
- **Link hover:** `border-bottom-color` transition, `color` transition — žádný scale, žádný shadow
- **TOC sidebar:** sticky s `position: sticky; top: 88px`, aktuální sekce zvýrazněna tuklejším textem
- **Žádné mikrointerakce na kartách** — editorial design je klidný, čtenář nechce být rušen

---

## SMĚR 4: "GLASSMORPHISM + GRADIENT"

**Concept:** Apple Vision Pro meets iOS 17 meets Figma gradients. Hloubka přes blur vrstvy. Vibrantní gradient mesh pozadí. Frosted glass navigace. Floating action buttons. Mental model: Uživatel se cítí jako na prémiové iOS aplikaci.

### Barevná paleta

| Název | Hex | HSL | Použití |
|-------|-----|-----|---------|
| `--gl-bg-from` | `#0f1628` | 225 41% 11% | Gradient mesh start |
| `--gl-bg-mid` | `#1a2040` | 228 40% 18% | Gradient mesh middle |
| `--gl-bg-to` | `#0e1f35` | 210 58% 13% | Gradient mesh end |
| `--gl-mesh-1` | `#2040a0` | 228 67% 38% | Mesh blob 1 |
| `--gl-mesh-2` | `#609bc6` | 205 47% 55% | Mesh blob 2 (Braník) |
| `--gl-mesh-3` | `#7040c0` | 270 50% 50% | Mesh blob 3 (violet) |
| `--gl-mesh-4` | `#1060b0` | 210 74% 38% | Mesh blob 4 (deep blue) |
| `--gl-glass` | `rgba(255,255,255,0.06)` | — | Glass card bg |
| `--gl-glass-hover` | `rgba(255,255,255,0.10)` | — | Glass hover bg |
| `--gl-glass-border` | `rgba(255,255,255,0.14)` | — | Glass border |
| `--gl-glass-strong` | `rgba(255,255,255,0.16)` | — | Navbars, prominent UI |
| `--gl-ink` | `#ffffff` | — | Primární text |
| `--gl-ink-secondary` | `rgba(255,255,255,0.65)` | — | Sekundární text |
| `--gl-ink-tertiary` | `rgba(255,255,255,0.40)` | — | Placeholder, disabled |
| `--gl-accent` | `#609bc6` | 205 47% 55% | Braník modrá |
| `--gl-accent-glow` | `rgba(96,155,198,0.30)` | — | Glow za accent prvky |
| `--gl-green` | `#34d399` | 160 62% 52% | Success, confirmed |
| `--gl-amber` | `#fbbf24` | 43 96% 56% | Warning |
| `--gl-red` | `#f87171` | 0 91% 71% | Error, rejected |

### Typografie

Čistá, moderní — systémový font stack doplněný display fontem pro nadpisy.

| Styl | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|---------|
| `display` | SF Pro Display / `"Mona Sans"` | 40px | 700 | 44px | -0.8px |
| `h1` | SF Pro Display / `"Mona Sans"` | 28px | 600 | 34px | -0.4px |
| `h2` | SF Pro Display / `"Mona Sans"` | 22px | 600 | 28px | -0.2px |
| `h3` | SF Pro Text | 17px | 600 | 24px | 0px |
| `body` | SF Pro Text | 15px | 400 | 22px | 0px |
| `body-s` | SF Pro Text | 13px | 400 | 18px | 0px |
| `caption` | SF Pro Text | 11px | 400 | 16px | 0.1px |
| `label` | SF Pro Text | 11px | 600 | 14px | 0.3px uppercase |
| `mono` | `"SF Mono", monospace` | 13px | 400 | 20px | 0px |

**System font stack:**
```css
--gl-font-display: "Mona Sans", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
--gl-font-body: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;
```

### Spacing systém (8px base)

```
--gl-space-1: 4px    --gl-space-2: 8px    --gl-space-3: 12px
--gl-space-4: 16px   --gl-space-5: 20px   --gl-space-6: 24px
--gl-space-8: 32px   --gl-space-10: 40px  --gl-space-12: 48px
--gl-space-16: 64px
```

Glassmorphism má **velkorysý vnitřní padding** — karty jsou `24px`, velké hero sekce `48px`.

### Layout pattern

```
┌─────────────────────────────────────────────────────────────────┐
│  FROSTED GLASS TOPBAR (68px, blur=20px, sticky)                 │
│  ○ Logo  ·  Hledat  ·  Notifikace (glass pill)  ·  Avatar      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GRADIENT MESH BACKGROUND (animated, fixed attachment)          │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  HERO GLASS CARD (full width, 200px tall)               │   │
│  │  "Dobré ráno, Martin. Máš trénink za 2 hodiny."         │   │
│  │                        [Zobrazit →]  [RSVP hned]        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  GRID: 3 sloupce (rovnoměrné), gap 16px                         │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐                │
│  │ Glass card │  │ Glass card │  │ Glass card │                │
│  └────────────┘  └────────────┘  └────────────┘                │
│                                                                  │
│  ┌───────────────────────┐  ┌──────────────────────────┐       │
│  │  Events (2/3 width)   │  │  Messages (1/3 width)    │       │
│  └───────────────────────┘  └──────────────────────────┘       │
│                                                                  │
│  FAB (floating action button) — pravý dolní roh, 56px kruh     │
├─────────────────────────────────────────────────────────────────┤
│  FROSTED GLASS BOTTOM NAV (mobile, 80px + safe area)            │
└─────────────────────────────────────────────────────────────────┘
```

**Gradient mesh background:**
```css
.gl-bg {
  background:
    radial-gradient(ellipse 80% 60% at 10% 20%, rgba(32,64,160,0.5) 0%, transparent 60%),
    radial-gradient(ellipse 60% 80% at 90% 10%, rgba(96,155,198,0.4) 0%, transparent 60%),
    radial-gradient(ellipse 70% 50% at 50% 80%, rgba(112,64,192,0.35) 0%, transparent 60%),
    radial-gradient(ellipse 90% 70% at 20% 90%, rgba(16,96,176,0.4) 0%, transparent 60%),
    #0f1628;
  position: fixed;
  inset: 0;
  z-index: -1;
}
```

**Glass card mixin:**
```css
.gl-card {
  background: var(--gl-glass);
  backdrop-filter: blur(16px) saturate(180%);
  -webkit-backdrop-filter: blur(16px) saturate(180%);
  border: 1px solid var(--gl-glass-border);
  border-radius: 20px;
}
```

**Breakpoints:**

| Název | Min-width | Layout |
|-------|-----------|--------|
| mobile | 0px | 1 col, bottom tab nav (glass) |
| tablet | 640px | 2 col grid, no sidebar |
| desktop | 1024px | 3 col grid, FAB visible |
| wide | 1280px | Wider hero, more breathing room |

### CSS Variables

```css
:root[data-theme="glass"] {
  --gl-bg-from: #0f1628;
  --gl-bg-mid: #1a2040;
  --gl-bg-to: #0e1f35;
  --gl-glass: rgba(255,255,255,0.06);
  --gl-glass-hover: rgba(255,255,255,0.10);
  --gl-glass-border: rgba(255,255,255,0.14);
  --gl-glass-strong: rgba(255,255,255,0.16);
  --gl-ink: #ffffff;
  --gl-ink-secondary: rgba(255,255,255,0.65);
  --gl-ink-tertiary: rgba(255,255,255,0.40);
  --gl-accent: #609bc6;
  --gl-accent-glow: rgba(96,155,198,0.30);
  --gl-green: #34d399;
  --gl-amber: #fbbf24;
  --gl-red: #f87171;

  --font-display: "Mona Sans", -apple-system, BlinkMacSystemFont, sans-serif;
  --font-body: -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif;

  /* Shadows */
  --shadow-glass: 0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1);
  --shadow-glass-lg: 0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.12);
  --shadow-glow-blue: 0 0 24px var(--gl-accent-glow);
  --shadow-fab: 0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);

  /* Border radius */
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-xl: 28px;
  --radius-full: 9999px;

  /* Blur */
  --blur-sm: blur(8px);
  --blur-md: blur(16px);
  --blur-lg: blur(24px);
  --blur-xl: blur(40px);

  --transition: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-spring: 400ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

### Komponenty

#### 1. Event Card (Glass style)

```
┌──────────────────────────────────────────────────┐  ← glass, blur 16px
│  🔵 TRÉNINK        za 2 hodiny  ·  ●LIVE RSVP   │
│                                                  │
│  Trénink A-týmu                                  │
│  14:30 — 16:00  ·  Hřiště 1                     │
│                                                  │
│  ████████████████░░░░░  18/24 potvrzeno          │  ← gradient progress bar
│                                                  │
│         [Zúčastním se]      [Nemohu]             │  ← pill buttons
└──────────────────────────────────────────────────┘
```

**Specifikace:**
- `background: var(--gl-glass)` + `backdrop-filter: blur(16px) saturate(180%)`
- `border: 1px solid var(--gl-glass-border)`
- `border-radius: var(--radius-lg)` (20px)
- `box-shadow: var(--shadow-glass)`
- `padding: 20px 24px`
- Typ badge: `background: rgba(96,155,198,0.2)`, `border: 1px solid rgba(96,155,198,0.3)`, `border-radius: 9999px`, Inter 11px weight 600 uppercase, `color: #a0c8e8`, `padding: 3px 10px`
- Countdown: Inter 12px, `color: var(--gl-ink-secondary)`, right side
- Název: System font 18px, weight 600, `color: var(--gl-ink)`
- Metadata: 13px, `color: var(--gl-ink-secondary)`
- Progress bar: `height: 4px`, `border-radius: 9999px`, track `rgba(255,255,255,0.1)`, fill `linear-gradient(90deg, var(--gl-accent), #34d399)`
- Tlačítka: `border-radius: 9999px`, `padding: 9px 20px`, primary `background: var(--gl-accent)`, `box-shadow: var(--shadow-glow-blue)`, secondary glass pill
- Hover celá karta: `background: var(--gl-glass-hover)`, `transform: translateY(-3px) scale(1.005)`, `box-shadow: var(--shadow-glass-lg)`, `transition: var(--transition-spring)`

#### 2. Stat Card (Glass style)

```
┌──────────────────┐
│  Potvrzení       │  ← label 11px
│                  │
│    18            │  ← číslo 48px, bold
│    z 24          │  ← subtext 13px secondary
│                  │
│  ↑ +3 vs. min.   │  ← delta, green 12px
│                  │
└──────────────────┘
```

**Specifikace:**
- Vše viz Event Card glass base
- `border-radius: var(--radius-xl)` (28px) — větší zaoblení pro stats
- `padding: 28px`
- Číslo: 48px, weight 700, bílá
- Malé glow za číslem: `text-shadow: 0 0 20px rgba(96,155,198,0.4)`
- Delta pozitivní: `color: var(--gl-green)`, `↑` ikona
- Ambient glow na aktivní stat kartě: `box-shadow: var(--shadow-glass), 0 0 40px rgba(96,155,198,0.15)`

#### 3. Message Bubble (Glass style)

```
   [M]  Trénink je posunutý na 15:00...           14:32 ✓✓
        ┌──────────────────────────────────────┐
        │ Trénink je posunutý na 15:00 z důvodu│  ← glass bubble, cizí
        │ úpravy hřiště.                       │
        └──────────────────────────────────────┘

                ┌──────────────────────────┐
                │ Ok, budeme tam. Přijdeme │  ← silnější glass, vlastní
                │ i s Alexem.             │
                └──────────────────────────┘
                                    14:35 ✓✓
```

**Specifikace:**
- Cizí bublina: `background: var(--gl-glass)`, `backdrop-filter: blur(12px)`, `border: 1px solid var(--gl-glass-border)`, `border-radius: 18px 18px 18px 4px`, `padding: 12px 16px`, `max-width: 75%`
- Vlastní bublina: `background: rgba(96,155,198,0.25)`, `border: 1px solid rgba(96,155,198,0.35)`, `border-radius: 18px 18px 4px 18px`, `box-shadow: 0 0 20px rgba(96,155,198,0.15)`
- Text: 14px, `color: var(--gl-ink)`, `line-height: 20px`
- Timestamp + status: Inter 11px, `color: var(--gl-ink-tertiary)`
- Hover bublina: `background` o 4% světlejší, `transition: 150ms`

### Navigace

**Frosted glass topbar:**
```css
.gl-topbar {
  background: rgba(15, 22, 40, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border-bottom: 1px solid rgba(255,255,255,0.08);
  height: 68px;
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  padding: 0 24px;
  gap: 16px;
}
```

**Floating Action Button:**
```css
.gl-fab {
  position: fixed;
  bottom: 24px; right: 24px;
  width: 56px; height: 56px;
  border-radius: 9999px;
  background: var(--gl-accent);
  box-shadow: var(--shadow-fab), var(--shadow-glow-blue);
  display: flex; align-items: center; justify-content: center;
  border: none; cursor: pointer;
  transition: var(--transition-spring);
}
.gl-fab:hover {
  transform: scale(1.08) translateY(-2px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.5), 0 0 32px rgba(96,155,198,0.4);
}
.gl-fab:active { transform: scale(0.95); }
```

**Bottom tab nav (mobile):**
```css
.gl-tab-bar {
  background: rgba(15,22,40,0.85);
  backdrop-filter: blur(32px);
  border-top: 1px solid rgba(255,255,255,0.08);
  height: 80px;
  padding-bottom: env(safe-area-inset-bottom);
  position: fixed;
  bottom: 0; left: 0; right: 0;
  display: flex;
}
```

### Animace a mikrointerakce

- **Gradient mesh:** `animation: mesh-drift 20s ease-in-out infinite alternate` — blobs se pomalé posouvají (subtilní, ne rušivé)
  ```css
  @keyframes mesh-drift {
    0%   { background-position: 0% 0%, 100% 0%, 50% 100%, 0% 100%; }
    100% { background-position: 5% 10%, 95% 5%, 55% 95%, 5% 95%; }
  }
  ```
- **Card appear:** `transform: translateY(20px) scale(0.97)` → `translateY(0) scale(1)`, `opacity: 0 → 1`, `duration: 400ms`, `cubic-bezier(0.34, 1.56, 0.64, 1)`, stagger `60ms` per karta
- **Glass hover:** `backdrop-filter` nelze animovat plynule — místo toho animuj `background-color` (rgba hodnotu)
- **Button press:** spring animace `scale(0.93)` → `scale(1.03)` → `scale(1)`, `duration: 300ms`
- **Modal backdrop:** `backdrop-filter: blur(0px) → blur(8px)`, `background: transparent → rgba(0,0,0,0.5)`, `300ms`

---

## SMĚR 5: "DASHBOARD PRO / DATA-DENSE"

**Concept:** Bloomberg Terminal meets Vercel Dashboard meets Linear. Maximální informační hustota. Monospace čísla. Kompaktní spacing. Sidebar s tree navigací. Dark nebo light, vždy high-contrast. Mental model: Power user, admin, trenér co chce vše najednou.

### Barevná paleta

| Název | Hex | HSL | Použití |
|-------|-----|-----|---------|
| `--dp-bg` | `#0a0a0b` | 240 7% 4% | Pozadí stránky |
| `--dp-surface-1` | `#111113` | 240 6% 7% | Hlavní karty, panely |
| `--dp-surface-2` | `#18181c` | 240 8% 10% | Hover, raised surface |
| `--dp-surface-3` | `#222228` | 240 9% 14% | Input bg, active states |
| `--dp-border` | `#2a2a35` | 240 12% 18% | Borders, table lines |
| `--dp-border-focus` | `#444455` | 240 11% 30% | Hover borders |
| `--dp-ink` | `#ededf0` | 240 10% 93% | Primární text |
| `--dp-ink-2` | `#9898a8` | 240 8% 63% | Sekundární text |
| `--dp-ink-3` | `#5a5a6a` | 240 8% 39% | Dimmed text, placeholders |
| `--dp-accent` | `#609bc6` | 205 47% 55% | Braník modrá — primary CTA |
| `--dp-accent-dim` | `#1e3a52` | 205 45% 22% | Accent bg, hover states |
| `--dp-green` | `#3fb950` | 127 47% 46% | Positive delta, confirmed |
| `--dp-green-dim` | `#0d2a14` | 127 52% 11% | Green bg |
| `--dp-red` | `#f85149` | 3 93% 63% | Negative delta, critical |
| `--dp-red-dim` | `#2a0d0c` | 3 52% 11% | Red bg |
| `--dp-amber` | `#d29922` | 40 71% 48% | Warning |
| `--dp-amber-dim` | `#2a1e08` | 40 52% 10% | Amber bg |
| `--dp-purple` | `#8b5cf6` | 258 90% 66% | Highlight, premium |

**Light mode:**
```
--dp-bg → #f8f9fa
--dp-surface-1 → #ffffff
--dp-surface-2 → #f1f3f5
--dp-surface-3 → #e9ecef
--dp-border → #dee2e6
--dp-border-focus → #adb5bd
--dp-ink → #1a1b1e
--dp-ink-2 → #495057
--dp-ink-3 → #868e96
(accenty zůstávají stejné)
```

### Typografie

Monospace pro čísla a kódy, systémový sans pro labels a texty. Hierarchie přes velikost a weight, ne dekorace.

| Styl | Font | Size | Weight | Line-height | Tracking |
|------|------|------|--------|-------------|---------|
| `page-title` | Inter | 16px | 600 | 24px | -0.1px |
| `section-title` | Inter | 12px | 600 | 16px | 0.4px uppercase |
| `body` | Inter | 13px | 400 | 20px | 0px |
| `body-s` | Inter | 12px | 400 | 18px | 0px |
| `label` | Inter | 11px | 500 | 16px | 0px |
| `caption` | Inter | 10px | 400 | 14px | 0.2px |
| `num-xl` | `"JetBrains Mono"` | 32px | 700 | 36px | -0.5px |
| `num-l` | `"JetBrains Mono"` | 24px | 600 | 28px | -0.3px |
| `num-m` | `"JetBrains Mono"` | 18px | 600 | 24px | 0px |
| `num-s` | `"JetBrains Mono"` | 13px | 500 | 20px | 0px |
| `code` | `"JetBrains Mono"` | 12px | 400 | 18px | 0px |

**Typografické pravidlo:** Čísla VŽDY JetBrains Mono s `font-variant-numeric: tabular-nums` — zarovnávají se v tabulkách a sparklines.

### Spacing systém (4px base, kompaktní)

```
--dp-space-1: 4px    --dp-space-2: 8px    --dp-space-3: 12px
--dp-space-4: 16px   --dp-space-6: 24px   --dp-space-8: 32px
--dp-space-12: 48px
```

Standardní padding karet: `12px`. Tabulky: `8px 12px` per buňka. Sidebar items: `6px 8px`.

### Layout pattern

```
┌──────────────────────────────────────────────────────────────────┐
│  TOPBAR (44px — minimal, just breadcrumb + actions + avatar)    │
├──────────────┬───────────────────────────────────────────────────┤
│              │  PAGE HEADER (32px, page title + last-updated)   │
│  TREE NAV    ├───────────────────────────────────────────────────┤
│  (200px,     │  METRICS ROW (compact stat cards, horizontal)     │
│  resizable)  │  [────────] [────────] [────────] [────────]     │
│              ├───────────────────────────────────────────────────┤
│  ▾ Klub      │  MAIN CONTENT AREA                                │
│    Dashboard │                                                   │
│    Tréninky  │  Tabs: [Tréninky] [Zápasy] [Docházka] [Platby]  │
│    Zápasy    │  ─────────────────────────────────────────────   │
│    Hráči     │                                                   │
│              │  DATA TABLE (compact, 36px rows)                  │
│  ▾ Týmy      │  ┌──────┬──────────┬───────┬────────┬────────┐  │
│    A-tým     │  │ Hráč │ Přítomen │  Abs. │ Plat.  │  RTG   │  │
│    B-tým     │  ├──────┼──────────┼───────┼────────┼────────┤  │
│    U19       │  │ ...  │   ███░   │  2    │ ✓ 2024 │  ████  │  │
│              │  └──────┴──────────┴───────┴────────┴────────┘  │
│  ─────────   │                                                   │
│  ▾ Admin     │  ACTIVITY FEED (right, 280px)                    │
│    Nastavení │  [slim, timestamp + action + entity]              │
│    Platby    │                                                   │
└──────────────┴───────────────────────────────────────────────────┘
```

**Grid layout:**
```css
.dp-layout {
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: 44px 1fr;
  min-height: 100vh;
  background: var(--dp-bg);
}
.dp-content {
  display: grid;
  grid-template-columns: 1fr 280px;
  overflow: hidden;
}
.dp-main {
  overflow-y: auto;
  padding: 0;
}
.dp-activity {
  border-left: 1px solid var(--dp-border);
  overflow-y: auto;
  padding: 12px;
}
```

**Breakpoints:**

| Název | Min-width | Layout |
|-------|-----------|--------|
| mobile | 0px | Bottom nav, no tree, card layout |
| tablet | 768px | Collapsible tree (hamburger) |
| desktop | 1024px | Full 200px tree, no activity sidebar |
| wide | 1280px | Full layout se vším |

### CSS Variables

```css
:root[data-theme="dashboard-pro"] {
  --dp-bg: #0a0a0b;
  --dp-surface-1: #111113;
  --dp-surface-2: #18181c;
  --dp-surface-3: #222228;
  --dp-border: #2a2a35;
  --dp-border-focus: #444455;
  --dp-ink: #ededf0;
  --dp-ink-2: #9898a8;
  --dp-ink-3: #5a5a6a;
  --dp-accent: #609bc6;
  --dp-accent-dim: #1e3a52;
  --dp-green: #3fb950;
  --dp-green-dim: #0d2a14;
  --dp-red: #f85149;
  --dp-red-dim: #2a0d0c;
  --dp-amber: #d29922;
  --dp-amber-dim: #2a1e08;

  --font-sans: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Shadows — subtle, mostly borders */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.4);
  --shadow-focus: 0 0 0 2px rgba(96,155,198,0.35);

  /* Border radius — tight */
  --radius-xs: 3px;
  --radius-sm: 5px;
  --radius-md: 6px;
  --radius-lg: 8px;

  /* Table */
  --table-row-h: 36px;
  --table-cell-px: 12px;
  --table-cell-py: 8px;

  --transition: 120ms ease-out;
}
```

### Komponenty

#### 1. Event Card (Dashboard Pro style)

Žádná karta — events jsou ŘÁDKY v tabulce nebo kompaktní list items.

```
┌─────────────────────────────────────────────────────────────────┐
│ ● TRÉNINK  │  Út 17.4.  │  14:30  │  A-tým  │  18/24  │  RSVP │
├─────────────────────────────────────────────────────────────────┤
│ ○ ZÁPAS    │  So 20.4.  │  10:00  │  A-tým  │   6/24  │  RSVP │
├─────────────────────────────────────────────────────────────────┤
│ ● TRÉNINK  │  Út 24.4.  │  14:30  │  B-tým  │  20/22  │  RSVP │
└─────────────────────────────────────────────────────────────────┘
```

**Specifikace:**
- Kontejner: `border: 1px solid var(--dp-border)`, `border-radius: var(--radius-md)`, `overflow: hidden`
- Každý řádek: `height: 36px`, `display: flex`, `align-items: center`
- Alternating rows: sudé `background: var(--dp-surface-1)`, liché `background: var(--dp-surface-2)`
- Status dot: `width: 8px; height: 8px; border-radius: 50%`, live `background: var(--dp-green)`, upcoming `background: var(--dp-ink-3)`
- Typ label: Inter 11px, weight 500, uppercase, monospace šířka
- Datum + čas: JetBrains Mono 12px, `color: var(--dp-ink-2)`
- Tým: Inter 12px, `color: var(--dp-ink)`
- Účast fraction: JetBrains Mono 12px, zelená pokud `>75%`, amber `50-75%`, červená `<50%`
- RSVP: Inter 11px, weight 600, `color: var(--dp-accent)`, `cursor: pointer`, hover `background: var(--dp-accent-dim)` na buňku
- Hover řádek: `background: var(--dp-surface-3)`
- Row focus: `box-shadow: inset 0 0 0 1px var(--dp-accent)` (inset border)

#### 2. Stat Card (Dashboard Pro style)

Kompaktní metrická karta — vše do 120×80px.

```
┌──────────────────────┐
│ ÚČAST             ↑  │  ← label + trend ikona
│                      │
│ 78%               ↑  │  ← číslo + delta
│ +3% vs. minulý týden │  ← subtext
│ ▃▄▅▆▇▇▅▆▇  (spark)  │  ← sparkline chart
└──────────────────────┘
```

**Specifikace:**
- `background: var(--dp-surface-1)`
- `border: 1px solid var(--dp-border)`
- `border-radius: var(--radius-md)` (6px)
- `padding: 12px`
- `min-width: 140px`
- Label: Inter 10px, weight 600, uppercase, `letter-spacing: 0.5px`, `color: var(--dp-ink-3)`
- Trend ikona (top right): `▲` nebo `▼`, 10px, green/red
- Číslo: JetBrains Mono 24px, weight 700, `color: var(--dp-ink)`
- Delta: JetBrains Mono 11px, green = `color: var(--dp-green)`, red = `color: var(--dp-red)`, prefix `+/-`
- Subtext: Inter 10px, `color: var(--dp-ink-3)`
- Sparkline: SVG, výška 24px, šířka 100%, stroke 1.5px, barva `var(--dp-accent)`, area fill `var(--dp-accent-dim)` (10% opacity)
- Hover: `border-color: var(--dp-border-focus)`, `background: var(--dp-surface-2)`
- Aktuální hodnota v sparkline: dot `3px` na konci čáry

#### 3. Message Bubble (Dashboard Pro style)

Zprávy jako IRC / Slack / Linear comments — žádné bubliny, dense text feed.

```
14:32  [M] Martin P.  »  Trénink je posunutý na 15:00 z důvodu
                          úpravy hřiště. Vezměte náhradní dresy.

14:35  [T] Ty          »  Ok, budeme tam. Přijdeme i s Alexem.

14:36  [M] Martin P.  »  Perfektní. Vidíme se!  ·  ✓✓
```

**Specifikace:**
- Kontejner: `padding: 0`, žádné bubliny
- Každá zpráva: `display: grid; grid-template-columns: 40px 100px 1fr`
- Timestamp: JetBrains Mono 11px, `color: var(--dp-ink-3)`, `font-variant-numeric: tabular-nums`
- Avatar badge: `[M]` — Inter 10px, `background: var(--dp-accent-dim)`, `color: var(--dp-accent)`, `border-radius: 3px`, `padding: 2px 5px`, `width: 24px`, center-aligned
- Sender: Inter 12px, weight 500, `color: var(--dp-ink-2)`
- Separator `»`: `color: var(--dp-ink-3)`, Inter 11px
- Text: Inter 13px, `color: var(--dp-ink)`, `line-height: 20px`
- Vlastní zpráva: avatar badge `background: rgba(63,185,80,0.15)`, `color: var(--dp-green)`, text `color: var(--dp-ink)` (stejná barva)
- Hover řádek: `background: var(--dp-surface-2)`, kurzor `default` (ne pointer — není klikatelné)
- Načítání (hover): zobrazí se reply akce: `↩ Odpovědět` Inter 11px vpravo
- Unread separator: `border-top: 1px solid var(--dp-accent)` s textem `━━ NOVÉ ━━` Inter 10px centered, `color: var(--dp-accent)`

### Navigace

**Tree navigation (200px):**
```css
.dp-tree {
  background: var(--dp-surface-1);
  border-right: 1px solid var(--dp-border);
  overflow-y: auto;
  padding: 8px;
  font-family: var(--font-sans);
  font-size: 12px;
}
.dp-tree-section {
  margin-bottom: 4px;
}
.dp-tree-section-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--dp-ink-3);
  padding: 6px 8px 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
}
.dp-tree-item {
  padding: 5px 8px 5px 20px;
  border-radius: var(--radius-xs);
  color: var(--dp-ink-2);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  line-height: 1;
  transition: var(--transition);
}
.dp-tree-item:hover {
  background: var(--dp-surface-3);
  color: var(--dp-ink);
}
.dp-tree-item.active {
  background: var(--dp-accent-dim);
  color: var(--dp-accent);
  font-weight: 500;
}
/* Badge (unread count) */
.dp-tree-badge {
  margin-left: auto;
  font-size: 10px;
  font-family: var(--font-mono);
  background: var(--dp-surface-3);
  color: var(--dp-ink-2);
  border-radius: 9999px;
  padding: 1px 6px;
  min-width: 18px;
  text-align: center;
}
```

**Topbar (44px):**
```css
.dp-topbar {
  height: 44px;
  background: var(--dp-surface-1);
  border-bottom: 1px solid var(--dp-border);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  font-family: var(--font-sans);
  font-size: 12px;
}
.dp-breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--dp-ink-2);
}
.dp-breadcrumb-sep { color: var(--dp-ink-3); font-size: 14px; }
.dp-breadcrumb-current { color: var(--dp-ink); font-weight: 500; }
```

### Animace a mikrointerakce

- **Žádné dramatické animace** — dashboard pro je o rychlosti, ne efektech
- **Hover states:** `transition: 120ms ease-out` — instant-ish
- **Sort column:** ikona třídění `⇅` → `↑` nebo `↓` s `transition: transform 120ms`
- **Row expand:** výška řádku animovaná `max-height: 0 → auto` (přes `max-height` trick), `200ms ease-out`
- **Toast notifikace:** slide in z pravého dolního rohu, `transform: translateX(100%) → translateX(0)`, `200ms ease-out`, auto-dismiss 4s
- **Badge čítač:** číslo se změní s krátkou `animation: badge-pop 200ms` — `scale(1) → scale(1.4) → scale(1)`
- **Sparkline data update:** čára se překreslí s `stroke-dashoffset` animací zleva doprava, `600ms linear`
- **Kliknutí RSVP v tabulce:** cell přejde na `background: var(--dp-green-dim)`, text `color: var(--dp-green)` — bez modalu, inline

---

## Srovnávací tabulka: 5 směrů

| Vlastnost | Broadcast | Nordic Minimal | Editorial | Glassmorphism | Dashboard Pro |
|-----------|-----------|---------------|-----------|---------------|---------------|
| **Světlo/Tma** | Tmavý (fixed) | Light + dark | Světlý (paper) | Tmavý (fixed) | Dark + light |
| **Font hlavní** | Oswald | Inter (var) | Playfair Display | System / Mona Sans | Inter |
| **Font čísla** | JetBrains Mono | Inter | Source Serif | System Mono | JetBrains Mono |
| **Border radius** | 4px (sharp) | 8–12px | 0px | 16–28px | 3–6px |
| **Spacing** | Medium (8px) | Velkorysý (4–96px) | Typografický (30px) | Velkorysý (8–64px) | Kompaktní (4–32px) |
| **Sidebar** | Icon-only 56px | Text 220px | Obsah (TOC) | Žádný (top nav) | Tree 200px |
| **Navigace** | Vertikální ikony | Hierarchická text | Masthead horizontal | Frosted top + FAB | Tree + topbar |
| **Cards** | Sharp, full-bleed | Borderless shadow | 0-radius, bordered | Glass, blur | Bordered, tight |
| **Informační hustota** | Střední | Nízká | Nízká | Střední | Velmi vysoká |
| **Cílová persona** | Fanoušek, mobile | Designer, macOS | Čtenář, tablet | iOS user, young | Admin, power user |
| **Animace styl** | Rychlé, dramatické | Pomalé, plynné | Minimální | Spring, bouncy | Instant, no-nonsense |
| **Primary CTA** | Neon outlined | Blue text link | Underlined link | Glass pill button | Compact button |

---

## Doporučení pro implementaci

### Priorita směrů podle use case

1. **Nordic Minimal** — nejpřírodnější pro Next.js + Tailwind + shadcn. Nejsnadnější implementace, vysoká přijatelnost u rodičů i trenérů.
2. **Dashboard Pro** — ideální pro admin rozhraní a trenéry. Informační hustota odpovídá potřebám správy klubu.
3. **Glassmorphism** — nejvyšší wow efekt, vhodné pro mobilní PWA. Náročnější na `backdrop-filter` výkon.
4. **Broadcast** — perfektní pro zápasový den, event stránky. Může být použit jako speciální "match day" theme.
5. **Editorial** — vhodné pro komunikační sekci, zprávy od klubu, newsletter-style content.

### Hybridní přístup (doporučeno)

Místo výběru jednoho směru: použít **Nordic Minimal jako základ** s možností přepnout na **Dashboard Pro** pro admin uživatele a **Broadcast** jako speciální event-day mode (automaticky aktivní při probíhajícím zápase).

### Technické závislosti pro každý směr

| Směr | Google Fonts | CSS Features | Tailwind plugins |
|------|-------------|-------------|-----------------|
| Broadcast | Oswald, JetBrains Mono | CSS animations, SVG | `@tailwindcss/typography` |
| Nordic Minimal | Inter (systémový) | CSS variables | shadcn default |
| Editorial | Playfair Display, Source Serif 4 | CSS columns, sticky | `@tailwindcss/typography` |
| Glassmorphism | Mona Sans | `backdrop-filter`, CSS gradients | žádné extra |
| Dashboard Pro | Inter, JetBrains Mono | `font-variant-numeric`, SVG | žádné extra |

---

## Soubory pro implementaci

Každý směr bude implementován jako:
- `apps/web/app/(admin)/admin/design-preview/v{N}-{slug}/page.tsx` — standalone preview stránka
- `apps/web/components/themes/{slug}/` — izolované komponenty
- CSS variables v `apps/web/app/globals.css` pod `[data-theme="{slug}"]` selector

---

```
---HANDOFF---
OD: UI Designér
KOMU: Frontend vývojář
STATUS: hotovo
VÝSTUP: /Users/tm/workspaces/projects/sport-manager/projekty/design-system/5-smeru.md
DALŠÍ KROK: Frontend vývojář implementuje 5 standalone preview stránek pod
  /admin/design-preview/v{1-5}-{slug}/page.tsx.
  Každá stránka je izolovaná (inline styles nebo CSS variables v [data-theme]).
  Reálná data z /dashboard/feed endpointu (viz existující v1-editorial jako vzor).
  Po implementaci QA Tester ověří pixel-perfect shodu se specifikací.
OTÁZKY:
  1. Má Frontend vývojář přidat Mona Sans / Oswald / Playfair Display do next/font?
  2. Má implementovat jen statické preview, nebo i interaktivní RSVP?
  3. Má být jeden design vybrán jako "production candidate" nebo všech 5 zůstane jako preview?
---/HANDOFF---
```
