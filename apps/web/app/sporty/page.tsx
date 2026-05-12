import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Trophy } from 'lucide-react';
import { SPORTS } from '@/lib/sports-data';

export const metadata: Metadata = {
  title: 'Sport Manager pro všechny sporty | Správa sportovního klubu',
  description:
    'Sport Manager funguje pro fotbal, florbal, hokej, basketbal, volejbal, tenis i atletiku. Jeden nástroj pro všechny sporty — kalendář, docházka, RSVP, komunikace.',
  alternates: {
    canonical: 'https://sport-manager.qawave.ai/sporty',
  },
  keywords: [
    'správa sportovního klubu',
    'aplikace pro trenéry',
    'digitalizace sportu',
    'mládežnický sport',
    'sportovní klub software',
  ],
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Sport Manager pro všechny sporty',
  description:
    'Sport Manager funguje pro fotbal, florbal, hokej, basketbal, volejbal, tenis i atletiku.',
  url: 'https://sport-manager.qawave.ai/sporty',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Domů', item: 'https://sport-manager.qawave.ai' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Sporty',
        item: 'https://sport-manager.qawave.ai/sporty',
      },
    ],
  },
};

export default function SportyIndexPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-sm">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Sport Manager</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/sporty" className="text-foreground font-medium">Sporty</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link href="/k/fc-hvezda" className="hover:text-foreground transition-colors">Demo</Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-blue-600 to-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:brightness-110 transition-all"
            >
              Začít zdarma
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="px-6 py-20 sm:py-28 text-center border-b border-border/40">
          <div className="mx-auto max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-4">
              Pro každý sport
            </p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1] mb-6">
              Sport Manager funguje
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                pro váš sport
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Jeden nástroj pro správu fotbalového, florbalového, hokejového i tenisového klubu.
              Přizpůsobený terminologií a funkcemi pro každý sport.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition-all duration-300 hover:-translate-y-0.5"
              >
                Začít zdarma
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/k/fc-hvezda"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-8 py-3.5 text-sm font-medium hover:bg-muted transition-all duration-300"
              >
                Ukázka fotbalového klubu
              </Link>
            </div>
          </div>
        </section>

        {/* Sports grid */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {SPORTS.map((sport) => (
                <Link
                  key={sport.slug}
                  href={`/sporty/${sport.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 hover:border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="mb-4 text-4xl">{sport.emoji}</div>
                  <h2 className="text-lg font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {sport.name}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                    {sport.description}
                  </p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Zjistit více
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Common features */}
        <section className="border-t border-border/40 px-6 py-20 bg-muted/30">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-4">Co mají společného?</h2>
            <p className="text-muted-foreground mb-12 max-w-lg mx-auto">
              Bez ohledu na sport, základní nástroje jsou vždy k dispozici.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-left">
              {[
                { emoji: '📅', title: 'Kalendář', desc: 'Tréninky, zápasy a turnaje přehledně.' },
                { emoji: '✅', title: 'RSVP', desc: 'Rodiče potvrdí účast jedním klikem.' },
                {
                  emoji: '📊',
                  title: 'Docházka',
                  desc: 'Statistiky docházky za celou sezónu.',
                },
                { emoji: '💬', title: 'Komunikace', desc: 'Zprávy bez skupinových chatů.' },
                {
                  emoji: '🔒',
                  title: 'Soukromí',
                  desc: 'Každý vidí jen to, co má.',
                },
                {
                  emoji: '👥',
                  title: 'Více týmů',
                  desc: 'Celý klub pod jednou střechou.',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-border/50 bg-card p-5"
                >
                  <div className="text-2xl mb-2">{item.emoji}</div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40 px-6 py-20">
          <div className="mx-auto max-w-lg text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Váš sport tu není?
            </h2>
            <p className="text-muted-foreground mb-8">
              Sport Manager funguje pro jakýkoli týmový sport. Vyzkoušejte zdarma.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-10 py-4 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition-all duration-300 hover:-translate-y-0.5"
            >
              Začít zdarma
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto max-w-6xl flex flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-blue-600 to-violet-600 text-white">
              <Trophy className="h-2.5 w-2.5" />
            </div>
            <span>Sport Manager</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {SPORTS.map((s) => (
              <Link
                key={s.slug}
                href={`/sporty/${s.slug}`}
                className="hover:text-foreground transition-colors"
              >
                {s.emoji} {s.name}
              </Link>
            ))}
          </div>
          <span>© 2026 Sport Manager</span>
        </div>
      </footer>
    </div>
  );
}
