'use client';

import { useState, lazy, Suspense, type ComponentType } from 'react';
import { ArrowUpRight, Sparkles, ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react';

/**
 * Design Preview Hub — 5 plnohodnotných design variant Dashboard.
 *
 * Dva režimy:
 *  1. Grid (výchozí) — přehled karet s mini-mockupy
 *  2. Live preview — lazy-loaded varianta s floating přepínačem
 */

/* ── Lazy-loaded variants ───────────────────────────── */

const EditorialPage = lazy(() => import('./v1-editorial/page'));
const StadiumPage = lazy(() => import('./v2-stadium/page'));
const SwissPage = lazy(() => import('./v3-swiss/page'));
const SoftPage = lazy(() => import('./v4-soft/page'));
const HeritagePage = lazy(() => import('./v5-heritage/page'));

/* ── Variant metadata ───────────────────────────────── */

type Variant = {
  slug: string;
  number: string;
  name: string;
  tagline: string;
  palette: { bg: string; surface: string; accent: string; ink: string };
  fontSample: string;
  vibeWords: string[];
  reference: string;
  Component: ComponentType;
};

const VARIANTS: Variant[] = [
  {
    slug: 'v1-editorial',
    number: '01',
    name: 'Editorial',
    tagline: 'Serif headline, magazine grid, The Athletic feel.',
    palette: { bg: '#faf7f2', surface: '#ffffff', accent: '#609bc6', ink: '#0d1b2a' },
    fontSample: 'Fraunces · Inter',
    vibeWords: ['Sophisticated', 'Long-form', 'Whitespace'],
    reference: 'NYT Sports · Monocle · The Athletic',
    Component: EditorialPage,
  },
  {
    slug: 'v2-stadium',
    number: '02',
    name: 'Stadium',
    tagline: 'Scoreboard, big tabular numbers, match-day intensity.',
    palette: { bg: '#0a0e1a', surface: '#121826', accent: '#609bc6', ink: '#f0f4ff' },
    fontSample: 'Space Grotesk · JetBrains Mono',
    vibeWords: ['High-energy', 'Broadcast', 'Sharp'],
    reference: 'ESPN · Nike Training · Strava Pro',
    Component: StadiumPage,
  },
  {
    slug: 'v3-swiss',
    number: '03',
    name: 'Swiss Minimal',
    tagline: 'Typography-first, maximum density, zero ornament.',
    palette: { bg: '#ffffff', surface: '#fafafa', accent: '#609bc6', ink: '#0a0a0a' },
    fontSample: 'Inter (single family)',
    vibeWords: ['Enterprise', 'Power-user', 'Typographic'],
    reference: 'Linear · Vercel · Stripe Dashboard',
    Component: SwissPage,
  },
  {
    slug: 'v4-soft',
    number: '04',
    name: 'Soft Play',
    tagline: 'Rounded cards, pastel accents, friendly for families.',
    palette: { bg: '#eef4fa', surface: '#ffffff', accent: '#609bc6', ink: '#1a2332' },
    fontSample: 'Instrument Sans · Serif',
    vibeWords: ['Friendly', 'Approachable', 'Playful'],
    reference: 'Notion · Clay · Figma Community',
    Component: SoftPage,
  },
  {
    slug: 'v5-heritage',
    number: '05',
    name: 'Braník Heritage',
    tagline: '1914 club dispatch. Vintage sports program. Gold + navy.',
    palette: { bg: '#f4eee1', surface: '#ffffff', accent: '#d4a64a', ink: '#0d1b3a' },
    fontSample: 'Abril · Libre Franklin · Bebas',
    vibeWords: ['Vintage', 'Heritage', 'Champion'],
    reference: 'Penguin Classics · FIFA Museum · Monocle Heritage',
    Component: HeritagePage,
  },
];

/* ── Loading skeleton ───────────────────────────────── */

function VariantSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Načítám variantu…</span>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────────── */

export default function DesignPreviewHubPage() {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Live preview mode
  if (activeIdx !== null) {
    const variant = VARIANTS[activeIdx];
    const ActiveComponent = variant.Component;

    return (
      <div className="relative">
        {/* Floating switcher bar */}
        <div
          className="fixed bottom-6 left-1/2 z-[9999] flex -translate-x-1/2 items-center gap-1 rounded-2xl border border-border/60 bg-background/90 px-2 py-1.5 shadow-2xl backdrop-blur-xl"
          style={{ minWidth: 'min(90vw, 640px)' }}
        >
          {/* Back to grid */}
          <button
            onClick={() => setActiveIdx(null)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Zpět na přehled"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>

          <div className="mx-1 h-5 w-px bg-border/50" />

          {/* Prev */}
          <button
            onClick={() => setActiveIdx((activeIdx - 1 + VARIANTS.length) % VARIANTS.length)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {/* Variant pills */}
          <div className="flex flex-1 items-center justify-center gap-1">
            {VARIANTS.map((v, i) => (
              <button
                key={v.slug}
                onClick={() => setActiveIdx(i)}
                className={`relative flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                  i === activeIdx
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full border"
                  style={{
                    background: v.palette.accent,
                    borderColor: i === activeIdx ? 'transparent' : `${v.palette.accent}40`,
                  }}
                />
                <span className="hidden sm:inline">{v.name}</span>
                <span className="sm:hidden">{v.number}</span>
              </button>
            ))}
          </div>

          {/* Next */}
          <button
            onClick={() => setActiveIdx((activeIdx + 1) % VARIANTS.length)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Variant content */}
        <Suspense fallback={<VariantSkeleton />}>
          <ActiveComponent />
        </Suspense>
      </div>
    );
  }

  // Grid mode
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        {/* Hero */}
        <header className="mb-12">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="h-3 w-3" />
            Design Exploration
          </div>
          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            Pět vizuálních směrů
            <br />
            <span className="text-primary">pro ABC Braník</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            Každá varianta je kompletně jiný design system — typografie, layout, komponenty,
            hierarchie. Ne jen color swap. Všechny běží na živých datech z API. Klikni na kartu
            pro live preview s přepínačem.
          </p>
        </header>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {VARIANTS.map((v, i) => (
            <VariantCard key={v.slug} variant={v} onClick={() => setActiveIdx(i)} />
          ))}
        </div>

        {/* Footer help */}
        <div className="mt-16 rounded-xl border border-border/50 bg-card p-6">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Jak vybrat:</strong> klikni na kartu pro full-screen
            preview. Dole se zobrazí plovoucí přepínač pro rychlé přepínání mezi variantami.
            Sleduj hierarchii (kam jde tvoje oko první), čitelnost číselných dat,
            a jak se layout chová na mobilu. Napiš mi pak{' '}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-foreground">
              „jedu s variantou X"
            </code>{' '}
            a aplikuju vybraný směr globálně na celou appku.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Variant Card ──────────────────────────────────── */

function VariantCard({ variant, onClick }: { variant: Variant; onClick: () => void }) {
  const { number, name, tagline, palette, fontSample, vibeWords, reference } = variant;

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_60px_-20px_hsl(var(--primary)/0.25)]"
    >
      {/* Preview canvas (mini layout hint) */}
      <div
        className="relative aspect-[16/9] overflow-hidden border-b border-border/30"
        style={{ background: palette.bg }}
      >
        <MiniMock slug={variant.slug} palette={palette} />

        {/* Corner number */}
        <div
          className="absolute right-4 top-4 font-mono text-[11px] font-semibold tracking-widest opacity-60"
          style={{ color: palette.ink }}
        >
          {number} / 05
        </div>

        {/* Hover CTA */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
          <div className="flex -translate-y-2 items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-black opacity-0 shadow-xl transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            Otevřít variantu <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Meta */}
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">{name}</h3>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
              V{number}
            </span>
          </div>
          {/* Color dots */}
          <div className="flex items-center gap-1">
            {[palette.bg, palette.surface, palette.ink, palette.accent].map((c, i) => (
              <span
                key={i}
                className="h-4 w-4 rounded-full border border-border/30"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">{tagline}</p>

        <div className="space-y-2 text-[11px] uppercase tracking-wider text-muted-foreground/70">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Font</span>
            <span className="font-mono normal-case tracking-normal text-foreground/70">
              {fontSample}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Vibe</span>
            <span className="normal-case tracking-normal text-foreground/70">
              {vibeWords.join(' · ')}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-semibold">Inspirace</span>
            <span className="truncate normal-case tracking-normal text-foreground/70">
              {reference}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}

/* ── Mini mock previews ────────────────────────────── */

function MiniMock({ slug, palette }: { slug: string; palette: Variant['palette'] }) {
  if (slug === 'v1-editorial') {
    return (
      <div className="absolute inset-0 flex gap-3 p-4">
        <div className="flex-[2] space-y-2">
          <div className="h-3 w-20 rounded-sm" style={{ background: palette.ink, opacity: 0.9 }} />
          <div className="h-5 w-full rounded-sm" style={{ background: palette.ink, opacity: 0.9 }} />
          <div className="h-5 w-4/5 rounded-sm" style={{ background: palette.ink, opacity: 0.9 }} />
          <div className="mt-2 space-y-1">
            <div className="h-1.5 w-full rounded-sm" style={{ background: palette.ink, opacity: 0.25 }} />
            <div className="h-1.5 w-full rounded-sm" style={{ background: palette.ink, opacity: 0.25 }} />
            <div className="h-1.5 w-3/4 rounded-sm" style={{ background: palette.ink, opacity: 0.25 }} />
          </div>
        </div>
        <div className="flex-1 space-y-1.5 border-l pl-3" style={{ borderColor: `${palette.ink}22` }}>
          <div className="h-2 w-full rounded-sm" style={{ background: palette.accent, opacity: 0.6 }} />
          <div className="h-1.5 w-5/6 rounded-sm" style={{ background: palette.ink, opacity: 0.3 }} />
          <div className="h-1.5 w-4/6 rounded-sm" style={{ background: palette.ink, opacity: 0.3 }} />
          <div className="h-1.5 w-full rounded-sm" style={{ background: palette.ink, opacity: 0.3 }} />
        </div>
      </div>
    );
  }

  if (slug === 'v2-stadium') {
    return (
      <div className="absolute inset-0 flex flex-col gap-2 p-3">
        <div
          className="flex items-center justify-between rounded-none px-2 py-1"
          style={{ background: `${palette.accent}20`, borderLeft: `3px solid ${palette.accent}` }}
        >
          <div className="font-mono text-[9px] font-bold tracking-widest" style={{ color: palette.accent }}>
            GAMEDAY
          </div>
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: palette.accent, boxShadow: `0 0 6px ${palette.accent}` }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-none p-2" style={{ background: palette.surface }}>
              <div className="font-mono text-lg font-black leading-none" style={{ color: palette.ink }}>
                {i === 1 ? '08' : i === 2 ? '42' : '91%'}
              </div>
              <div className="mt-0.5 font-mono text-[7px] uppercase tracking-wider" style={{ color: palette.ink, opacity: 0.5 }}>
                {i === 1 ? 'Events' : i === 2 ? 'Members' : 'Attend'}
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2 p-1" style={{ background: palette.surface, borderLeft: `2px solid ${palette.accent}` }}>
              <div className="font-mono text-[10px] font-black tabular-nums" style={{ color: palette.ink }}>
                {i === 1 ? '17:00' : '15:00'}
              </div>
              <div className="h-1.5 flex-1 rounded-none" style={{ background: palette.ink, opacity: 0.2 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slug === 'v3-swiss') {
    return (
      <div className="absolute inset-0 p-4">
        <div className="mb-3 flex items-center justify-between border-b pb-2" style={{ borderColor: `${palette.ink}11` }}>
          <div className="flex gap-3">
            <div className="h-2 w-14 rounded-sm" style={{ background: palette.accent }} />
            <div className="h-2 w-10 rounded-sm" style={{ background: palette.ink, opacity: 0.3 }} />
            <div className="h-2 w-10 rounded-sm" style={{ background: palette.ink, opacity: 0.3 }} />
          </div>
          <div className="h-2 w-6 rounded-sm" style={{ background: palette.ink, opacity: 0.2 }} />
        </div>
        <div className="space-y-1.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between gap-2 py-0.5">
              <div className="flex items-center gap-2">
                <div className="font-mono text-[8px] tabular-nums" style={{ color: palette.ink, opacity: 0.5 }}>
                  {17 + i}
                </div>
                <div className="h-1.5 w-20 rounded-sm" style={{ background: palette.ink, opacity: 0.7 }} />
              </div>
              <div className="h-1.5 w-6 rounded-sm" style={{ background: palette.accent, opacity: 0.8 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slug === 'v4-soft') {
    return (
      <div className="absolute inset-0 flex gap-2 p-3">
        <div
          className="flex-[1.5] rounded-2xl p-3"
          style={{
            background: `linear-gradient(135deg, ${palette.accent}cc, ${palette.accent}66)`,
          }}
        >
          <div className="h-2 w-16 rounded-full bg-white/70" />
          <div className="mt-4 h-4 w-24 rounded-md bg-white/90" />
          <div className="mt-1 h-4 w-20 rounded-md bg-white/70" />
          <div className="mt-auto flex items-end gap-1 pt-4">
            <div className="h-6 w-6 rounded-full border-2 border-white" style={{ background: palette.ink }} />
            <div className="-ml-2 h-6 w-6 rounded-full border-2 border-white" style={{ background: '#ffd9c2' }} />
            <div className="-ml-2 h-6 w-6 rounded-full border-2 border-white" style={{ background: '#c7ead8' }} />
          </div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2">
          {['🏃', '⚽', '💬', '📊'].map((emoji, i) => (
            <div
              key={i}
              className="flex aspect-square items-center justify-center rounded-2xl text-xl"
              style={{ background: palette.surface }}
            >
              {emoji}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (slug === 'v5-heritage') {
    return (
      <div className="absolute inset-0 p-3">
        <div className="mb-2 flex items-center justify-between border-b-2 pb-2" style={{ borderColor: palette.ink }}>
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 font-serif text-[10px] font-black"
            style={{ borderColor: palette.ink, color: palette.ink }}
          >
            ABC
          </div>
          <div className="text-center">
            <div className="font-serif text-[9px] font-black italic" style={{ color: palette.ink }}>
              THE DISPATCH
            </div>
            <div className="font-mono text-[6px] uppercase tracking-[0.2em]" style={{ color: palette.ink, opacity: 0.6 }}>
              Est. 1914
            </div>
          </div>
          <div className="h-4 w-8 rounded-sm" style={{ background: palette.accent }} />
        </div>
        <div className="mb-1 text-center font-mono text-[7px] font-bold uppercase tracking-[0.22em]" style={{ color: palette.ink, opacity: 0.6 }}>
          • THIS WEEK IN BRANÍK •
        </div>
        <div className="space-y-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border font-serif text-[8px] font-black"
                style={{ borderColor: palette.ink, color: palette.ink }}
              >
                0{i}
              </div>
              <div className="h-1.5 flex-1 rounded-sm" style={{ background: palette.ink, opacity: 0.4 }} />
              <div className="h-1.5 w-6 rounded-sm" style={{ background: palette.accent }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}
