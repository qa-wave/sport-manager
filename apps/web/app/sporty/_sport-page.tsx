import Link from 'next/link';
import { ArrowRight, Calendar, CheckCircle, Trophy, Users } from 'lucide-react';
import { SPORTS, type SportData } from '@/lib/sports-data';

interface SportPageProps {
  sport: SportData;
}

export function SportPage({ sport }: SportPageProps) {
  const otherSports = SPORTS.filter((s) => s.slug !== sport.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Sport Manager pro ${sport.nameLong}`,
    description: sport.description,
    url: `https://sport-manager.qawave.ai/sporty/${sport.slug}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Domů',
          item: 'https://sport-manager.qawave.ai',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Sporty',
          item: 'https://sport-manager.qawave.ai/sporty',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: sport.name,
          item: `https://sport-manager.qawave.ai/sporty/${sport.slug}`,
        },
      ],
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-sm px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 text-white shadow-sm">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Sport Manager</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/sporty" className="hover:text-foreground transition-colors">Sporty</Link>
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

      <main className="pt-14">
        {/* Hero */}
        <section className="relative px-6 py-20 sm:py-28 border-b border-border/40 overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-violet-500/5" />
          <div className="relative mx-auto max-w-4xl">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
              <Link href="/" className="hover:text-foreground transition-colors">Sport Manager</Link>
              <span>/</span>
              <Link href="/sporty" className="hover:text-foreground transition-colors">Sporty</Link>
              <span>/</span>
              <span className="text-foreground">{sport.name}</span>
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16">
              <div className="flex-1">
                <div className="mb-6 text-6xl">{sport.emoji}</div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1] mb-6">
                  Sport Manager pro
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
                    {sport.nameLong}
                  </span>
                </h1>
                <p className="text-lg text-muted-foreground leading-relaxed mb-10 max-w-lg">
                  {sport.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
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
                    Ukázka demo klubu
                  </Link>
                </div>
              </div>

              {/* Quick stats */}
              <div className="mt-12 lg:mt-0 lg:w-72 space-y-4">
                {[
                  {
                    icon: Calendar,
                    label: `Kalendář ${sport.eventTerm} a ${sport.trainingTerm}`,
                    color: 'text-blue-500',
                  },
                  { icon: Users, label: `Správa ${sport.teamTerm}u a hráčů`, color: 'text-violet-500' },
                  { icon: CheckCircle, label: 'RSVP jedním klikem', color: 'text-emerald-500' },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4"
                  >
                    <item.icon className={`h-5 w-5 flex-shrink-0 ${item.color}`} />
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="px-6 py-20 sm:py-28">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 mb-4">
                Funkce
              </p>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Co Sport Manager umí pro {sport.nameLong}
              </h2>
              <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
                Všechny nástroje které potřebuje moderní {sport.name.toLowerCase()}ový klub.
              </p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sport.features.map((feature, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border/50 bg-card p-6 hover:border-border hover:shadow-lg transition-all duration-300"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-violet-500/20 text-lg">
                    {['📅', '✅', '📊', '💬', '👥', '🔗'][i % 6]}
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use cases */}
        <section className="border-t border-border/40 px-6 py-20 bg-muted/30">
          <div className="mx-auto max-w-4xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight mb-4">
                  Pro koho je Sport Manager ideální?
                </h2>
                <p className="text-muted-foreground mb-8">
                  Funguje pro všechny typy {sport.name.toLowerCase()}ových oddílů a klubů.
                </p>
                <ul className="space-y-3">
                  {sport.useCases.map((useCase) => (
                    <li key={useCase} className="flex items-center gap-3 text-sm">
                      <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                        <svg
                          className="h-3 w-3 text-emerald-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      {useCase}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Testimonial */}
              <div className="rounded-2xl border border-border/50 bg-card p-8">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-base font-medium leading-relaxed mb-4">
                  &ldquo;{sport.testimonial.text}&rdquo;
                </blockquote>
                <p className="text-sm text-muted-foreground">— {sport.testimonial.author}</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40 px-6 py-20">
          <div className="mx-auto max-w-lg text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-3">
              Začněte zdarma ještě dnes
            </h2>
            <p className="text-muted-foreground mb-8">
              Nastavení klubu zabere 2 minuty. Žádná kreditní karta.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 px-10 py-4 text-sm font-semibold text-white shadow-lg hover:brightness-110 transition-all duration-300 hover:-translate-y-0.5"
            >
              Vytvořit {sport.name.toLowerCase()}ový klub
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Other sports */}
        <section className="border-t border-border/40 px-6 py-16 bg-muted/30">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-lg font-bold mb-6 text-muted-foreground">Další sporty</h2>
            <div className="flex flex-wrap gap-3">
              {otherSports.map((s) => (
                <Link
                  key={s.slug}
                  href={`/sporty/${s.slug}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5 text-sm font-medium hover:border-border hover:shadow-sm transition-all duration-200"
                >
                  {s.emoji} {s.name}
                </Link>
              ))}
            </div>
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
            <Link href="/sporty" className="hover:text-foreground transition-colors">Sporty</Link>
            <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <Link href="/signup" className="hover:text-foreground transition-colors">Registrace</Link>
            <Link href="/k/fc-hvezda" className="hover:text-foreground transition-colors">Demo</Link>
          </div>
          <span>© 2026 Sport Manager</span>
        </div>
      </footer>
    </div>
  );
}
