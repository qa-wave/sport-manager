'use client';

import Link from 'next/link';
import { Check, ChevronDown, Zap } from 'lucide-react';
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
// Všechny funkce jsou v obou tarifech. Jediný rozdíl: tarif zdarma zobrazuje
// reklamu, placený tarif ji odebírá.
const ALL_FEATURES = [
  'Neomezený počet členů',
  'Neomezený počet týmů',
  'Kalendář a události',
  'Potvrzování účasti a docházka',
  'Upozornění e-mailem i do telefonu',
  'Statistiky hráčů i týmů',
  'Knihovna tréninků',
  'Platby přes platební bránu',
  'Souhlasy a podpisy rodičů',
  'Fotogalerie',
  'Export do tabulky',
  'Více klubů pod jedním účtem',
  'Vlastní vzhled a barvy klubu',
  'Napojení na sportovní svaz',
] as const;

const TIERS = [
  {
    id: 'free',
    name: 'ZDARMA',
    price: '0 Kč',
    period: 'navždy',
    tagline: 'Všechny funkce, bez omezení. Zobrazuje nenápadnou reklamu.',
    cta: 'Začít zdarma',
    ctaHref: '/signup',
    recommended: true,
    features: ['Všechny funkce, bez omezení', ...ALL_FEATURES],
  },
  {
    id: 'noads',
    name: 'BEZ REKLAM',
    price: 'Brzy',
    period: 'cenu oznámíme',
    tagline: 'Úplně stejné jako zdarma — jen bez reklamy.',
    cta: 'Chci vědět víc',
    ctaHref: 'mailto:ahoj@sport-manager.cz?subject=Tarif%20bez%20reklam',
    recommended: false,
    features: ['Všechno z tarifu Zdarma', 'Žádné reklamy', 'Podpoříte další vývoj'],
  },
] as const;

// ---------------------------------------------------------------------------
// FAQ data
// ---------------------------------------------------------------------------
const FAQ = [
  {
    q: 'Je Sport Manager opravdu zdarma?',
    a: 'Ano. Všechny funkce jsou zdarma a bez omezení počtu členů nebo týmů. Verze zdarma zobrazuje nenápadnou reklamu, která provoz financuje.',
  },
  {
    q: 'Co je tarif bez reklam?',
    a: 'Připravujeme placený tarif, který odebere reklamu. Všechny funkce zůstávají stejné jako u verze zdarma — platíte jen za klidnější prostředí. Cenu oznámíme brzy.',
  },
  {
    q: 'Jaké reklamy se zobrazují?',
    a: 'Jen nenápadné reklamy, které neruší práci trenérů ani rodičů. Vaše data nikdy neprodáváme třetím stranám.',
  },
  {
    q: 'Jsou data v bezpečí? Kde jsou uložena?',
    a: 'Data jsou uložena v evropském cloudu a každý klub je oddělený na úrovni databáze. Vaše data nikdy neprodáváme třetím stranám.',
  },
  {
    q: 'Funguje Sport Manager pro každý sport?',
    a: 'Ano — fotbal, florbal, hokej, basketbal, volejbal, tenis, atletika a jakýkoli jiný. Systém je nezávislý na sportu; typ vyberete při registraci.',
  },
];

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
function FeatureRow({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      <Check className="h-4 w-4 shrink-0 text-emerald-500" />
      <span>{label}</span>
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
            Žádné skryté poplatky
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Zdarma, nebo bez reklam
          </h1>
          <p className="mt-4 text-muted-foreground sm:text-lg">
            Sport Manager má všechny funkce zdarma a bez omezení.
            <br className="hidden sm:block" />
            Nechcete reklamu? Přejděte na tarif bez reklam.
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-3xl">
          <div className="grid gap-6 sm:grid-cols-2 sm:items-start">
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
                      <FeatureRow key={f} label={f} />
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="pt-0">
                  {tier.id === 'free' ? (
                    <Button asChild className="w-full bg-gradient-brand text-white border-0 hover:brightness-110 hover:shadow-lg">
                      <Link href={tier.ctaHref}>{tier.cta}</Link>
                    </Button>
                  ) : (
                    <a
                      href={tier.ctaHref}
                      className="w-full inline-flex items-center justify-center rounded-lg border border-border px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:bg-muted"
                    >
                      {tier.cta}
                    </a>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Bottom note */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Verze zdarma má všechny funkce bez omezení a financuje ji nenápadná reklama. Máte dotaz?&nbsp;
            <a href="mailto:ahoj@sport-manager.cz" className="underline underline-offset-2 hover:text-foreground transition-colors">
              napište nám
            </a>.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-border/40 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-3">Otázky a odpovědi</p>
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
