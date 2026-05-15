'use client';

import Link from 'next/link';
import { Check, ChevronDown, Minus, Zap } from 'lucide-react';
import { useState } from 'react';
import { BrandLogo } from '@/components/brand-logo';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { AuthRedirect } from '@/components/auth-redirect';

// ---------------------------------------------------------------------------
// Tier data
// ---------------------------------------------------------------------------
const TIERS = [
  {
    id: 'free',
    name: 'FREE',
    price: '0 Kč',
    period: '/měsíc',
    tagline: 'Pro malé kluby a začátky',
    cta: 'Začít zdarma',
    ctaHref: '/signup',
    ctaVariant: 'outline' as const,
    recommended: false,
    features: [
      { label: 'Až 25 členů', included: true },
      { label: 'Až 2 týmy', included: true },
      { label: 'Kalendář a události', included: true },
      { label: 'RSVP a docházka', included: true },
      { label: 'Email notifikace', included: true },
      { label: 'Základní statistiky', included: true },
      { label: 'Knihovna tréninků', included: true },
      { label: 'Push notifikace', included: false },
      { label: 'Stripe platby', included: false },
      { label: 'Waivers a souhlasy', included: false },
      { label: 'Galerie', included: false },
      { label: 'CSV export', included: false },
      { label: 'Multi-klub', included: false },
      { label: 'Custom branding', included: false },
      { label: 'FAČR sync', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'PRO',
    price: '490 Kč',
    period: '/měsíc',
    tagline: 'Pro aktivní kluby',
    cta: 'Vyzkoušet 14 dní zdarma',
    ctaHref: '/signup?plan=pro',
    ctaVariant: 'default' as const,
    recommended: true,
    features: [
      { label: 'Neomezení členové', included: true },
      { label: 'Neomezené týmy', included: true },
      { label: 'Kalendář a události', included: true },
      { label: 'RSVP a docházka', included: true },
      { label: 'Email notifikace', included: true },
      { label: 'Pokročilé statistiky', included: true },
      { label: 'Knihovna tréninků', included: true },
      { label: 'Push notifikace', included: true },
      { label: 'Stripe platby', included: true },
      { label: 'Waivers a souhlasy', included: true },
      { label: 'Galerie', included: true },
      { label: 'CSV export', included: true },
      { label: 'Multi-klub', included: false },
      { label: 'Custom branding', included: false },
      { label: 'FAČR sync', included: false },
    ],
  },
  {
    id: 'club',
    name: 'CLUB',
    price: '1 490 Kč',
    period: '/měsíc',
    tagline: 'Pro velké organizace',
    cta: 'Kontaktovat nás',
    ctaHref: 'mailto:ahoj@sport-manager.cz?subject=CLUB%20plán',
    ctaVariant: 'outline' as const,
    recommended: false,
    features: [
      { label: 'Neomezení členové', included: true },
      { label: 'Neomezené týmy', included: true },
      { label: 'Kalendář a události', included: true },
      { label: 'RSVP a docházka', included: true },
      { label: 'Email notifikace', included: true },
      { label: 'Pokročilé statistiky', included: true },
      { label: 'Knihovna tréninků', included: true },
      { label: 'Push notifikace', included: true },
      { label: 'Stripe platby', included: true },
      { label: 'Waivers a souhlasy', included: true },
      { label: 'Galerie', included: true },
      { label: 'CSV export', included: true },
      { label: 'Multi-klub', included: true },
      { label: 'Custom branding', included: true },
      { label: 'FAČR sync', included: true },
    ],
  },
] as const;

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------
const FAQ = [
  {
    q: 'Mohu kdykoli změnit plán?',
    a: 'Ano. Upgrade je okamžitý — limity se rozvolní ihned po zaplacení. Downgrade proběhne na konci fakturačního období. Data se nemažou.',
  },
  {
    q: 'Jak funguje 14denní trial PRO?',
    a: 'Při registraci si vyberete PRO plán. Kreditní karta se nezadává hned — až na konci trialu. Pokud nepokračujete, účet zůstane na FREE plánu.',
  },
  {
    q: 'Co se stane, když překročím limit FREE plánu?',
    a: 'Stávající členové a týmy zůstanou. Systém vás upozorní a znemožní přidávat nové záznamy nad limit, dokud neupgradujete nebo neodeberete členy.',
  },
  {
    q: 'Jsou data v bezpečí? Kde jsou uložena?',
    a: 'Data jsou uložena v Neon Postgres (us-east-1, AWS). Každý klub je izolovaný na úrovni databáze. Nikdy neprodáváme data třetím stranám.',
  },
  {
    q: 'Funguje Sport Manager pro každý sport?',
    a: 'Ano — fotbal, florbal, hokej, basketbal, volejbal, tenis, atletika a jakýkoli jiný. Systém je sportově agnostický; typ sportu vyberete při registraci.',
  },
  {
    q: 'Jaké platební metody přijímáte?',
    a: 'Platby probíhají přes Stripe — kreditní/debetní karty (Visa, Mastercard, Amex) a SEPA direct debit. Faktura se vystavuje každý měsíc automaticky.',
  },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function FeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      {included ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-500" />
      ) : (
        <Minus className="h-4 w-4 shrink-0 text-muted-foreground/30" />
      )}
      <span className={included ? '' : 'text-muted-foreground/50'}>{label}</span>
    </li>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-border/50 bg-card overflow-hidden transition-colors data-open:border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium hover:bg-muted/40 transition-colors"
        aria-expanded={open}
      >
        <span>{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-muted-foreground">
          {a}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <AuthRedirect />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 glass px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 shadow-sm transition-shadow group-hover:shadow-md">
              <BrandLogo size={20} />
            </div>
            <span className="text-sm font-semibold tracking-tight">Sport Manager</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Zpět na hlavní
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Přihlásit se
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110"
            >
              Začít zdarma
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-12 text-center">
        <div className="pointer-events-none absolute inset-0 mesh-gradient opacity-60" />
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-20" />
        <div className="relative mx-auto max-w-2xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Zap className="h-3 w-3" />
            Transparentní ceny, žádné skryté poplatky
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Plán pro každý klub
          </h1>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            Začněte zdarma. Upgradujte až budete připraveni.
            <br className="hidden sm:block" />
            Žádné smlouvy, zrušení kdykoli.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-6 lg:grid-cols-3 lg:items-start">
            {TIERS.map((tier) => (
              <Card
                key={tier.id}
                className={`relative flex flex-col transition-all duration-300 ${
                  tier.recommended
                    ? 'border-primary shadow-xl shadow-primary/10 scale-[1.02] lg:scale-105'
                    : 'border-border/50 hover:border-border hover:shadow-lg'
                }`}
              >
                {tier.recommended && (
                  <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
                    <Badge className="bg-gradient-brand text-white border-0 px-3 py-1 text-xs font-semibold shadow-md">
                      Nejoblíbenější
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4 pt-6">
                  <div className="mb-2">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {tier.name}
                    </span>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-bold tracking-tight">{tier.price}</span>
                    <span className="mb-1 text-sm text-muted-foreground">{tier.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{tier.tagline}</p>
                </CardHeader>

                <CardContent className="flex-1 pb-6">
                  <ul className="space-y-2.5">
                    {tier.features.map((f) => (
                      <FeatureRow key={f.label} label={f.label} included={f.included} />
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-0">
                  {tier.id === 'club' ? (
                    <a
                      href={tier.ctaHref}
                      className={`w-full inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-muted`}
                    >
                      {tier.cta}
                    </a>
                  ) : (
                    <Button
                      asChild
                      variant={tier.ctaVariant}
                      className={`w-full ${tier.recommended ? 'bg-gradient-brand text-white border-0 hover:brightness-110 hover:shadow-lg' : ''}`}
                    >
                      <Link href={tier.ctaHref}>{tier.cta}</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Bottom note */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Všechny ceny jsou bez DPH. Pro neziskové kluby a školy&nbsp;
            <a href="mailto:ahoj@sport-manager.cz" className="underline underline-offset-2 hover:text-foreground transition-colors">
              kontaktujte nás
            </a>{' '}
            — rádi domluvíme speciální podmínky.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/40 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">FAQ</p>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Časté dotazy
            </h2>
          </div>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <FaqItem key={i} q={item.q} a={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border/40 px-6 py-20">
        <div className="pointer-events-none absolute inset-0 mesh-gradient opacity-40" />
        <div className="relative mx-auto max-w-lg text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Připraveni začít?
          </h2>
          <p className="mt-3 text-muted-foreground">
            Zaregistrujte se zdarma — žádná kreditní karta, žádné skryté poplatky.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
            >
              Začít zdarma
            </Link>
            <Link
              href="/k/fc-hvezda"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Prohlédnout demo &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 Sport Manager</span>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">Domů</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Ceník</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Registrace</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
