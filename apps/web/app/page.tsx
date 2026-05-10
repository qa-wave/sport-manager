import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  ChevronRight,
  Lock,
  MessageSquare,
  Repeat,
  Shield,
  Smartphone,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { AuthRedirect } from '@/components/auth-redirect';

const FEATURES = [
  {
    icon: Calendar,
    title: 'Kalendář & RSVP',
    desc: 'Měsíční grid, barevné typy událostí. RSVP na 2 kliknutí z notifikace.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-500',
  },
  {
    icon: Users,
    title: 'Správa členů',
    desc: 'Hráči, trenéři, rodiče. Rozvedení rodiče s oddělenými oprávněními.',
    gradient: 'from-violet-500/20 to-purple-500/20',
    iconColor: 'text-violet-500',
  },
  {
    icon: MessageSquare,
    title: 'Komunikace',
    desc: 'Týmové chaty, DM, oznámení. Privacy-by-participation — žádné úniky.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Shield,
    title: '5 rolí, 0 kompromisů',
    desc: 'Owner, Admin, Trenér, Rodič, Hráč. Každý vidí přesně to, co potřebuje.',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-500',
  },
  {
    icon: Repeat,
    title: 'Šablony tréninků',
    desc: 'Po + St 17:30 — jednou nastavíte, události se generují celou sezonu.',
    gradient: 'from-rose-500/20 to-pink-500/20',
    iconColor: 'text-rose-500',
  },
  {
    icon: Zap,
    title: 'Multi-tenant',
    desc: 'Jeden účet, více klubů. Přepínání jako ve Slacku. Každý klub vlastní barvy.',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    iconColor: 'text-cyan-500',
  },
];

const STATS = [
  { value: '2', label: 'Kluby v demo', suffix: '' },
  { value: '66', label: 'Členů', suffix: '+' },
  { value: '69', label: 'Událostí', suffix: '' },
  { value: '5', label: 'Rolí', suffix: '' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <AuthRedirect />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 glass px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-white shadow-sm transition-shadow group-hover:shadow-md">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Sport Manager</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/k/fc-hvezda" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Přihlásit se
            </Link>
            <Link href="/signup" className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110">
              Vyzkoušet zdarma
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 py-24 sm:py-32 lg:py-40">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 mesh-gradient" />
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-20" />

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/50 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Sportovní platforma pro kluby
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl leading-[1.1]">
            Váš klub si zaslouží
            <br />
            <span className="text-gradient-brand">lepší nástroje.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            Kalendář, docházka, komunikace, platby — vše v jedné platformě.
            Postaveno pro trenéry, rodiče a vedoucí klubů.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-brand px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center gap-2">
                Založit klub zdarma
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              href="/k/fc-hvezda"
              className="group inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/50 backdrop-blur-sm px-8 py-3.5 text-sm font-medium hover:bg-card transition-all duration-300"
            >
              Živá ukázka
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 mx-auto flex max-w-md justify-center divide-x divide-border/50">
            {STATS.map((s) => (
              <div key={s.label} className="px-6 text-center">
                <div className="text-2xl font-bold text-foreground font-mono tabular-nums">
                  {s.value}{s.suffix}
                </div>
                <div className="text-[11px] text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-border/40 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">Funkce</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Vše na jednom místě
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              Konec s WhatsApp skupinami, Excel tabulkami a emailovými řetězci.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-border"
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative">
                  <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-background ${f.iconColor}`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/40 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground dark:text-accent mb-4">Jak to funguje</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">3 kroky, 2 minuty</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              { step: '01', title: 'Zaregistrujte se', desc: 'Email, heslo, jméno. Žádná kreditka.', icon: Smartphone },
              { step: '02', title: 'Založte klub', desc: 'Název, sport, hotovo. Pozvěte trenéry a rodiče.', icon: Users },
              { step: '03', title: 'Plánujte & komunikujte', desc: 'Šablony tréninků, RSVP, chat. Vše běží.', icon: Zap },
            ].map((s) => (
              <div key={s.step} className="text-center group">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm transition-all group-hover:shadow-lg group-hover:border-primary/30">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-xs font-mono text-primary/60 mb-2">{s.step}</div>
                <h3 className="text-base font-semibold mb-1">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy highlight */}
      <section className="border-t border-border/40 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-3xl border border-border/50 bg-card">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 sm:p-12">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-6">
                  <Lock className="h-3 w-3" /> Privacy-first
                </div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-4">
                  Rozvedení rodiče?
                  <br />
                  <span className="text-muted-foreground">Vyřešeno.</span>
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  Každý rodič má vlastní oprávnění. Maminka nevidí DM tatínka s trenérem. Tatínek nevidí platby maminky. Žádné úniky, žádné kompromisy.
                </p>
                <ul className="space-y-3">
                  {['Oddělená oprávnění per rodič', 'Privacy-by-participation pro zprávy', 'Granulární access control per modul'].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
                        <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative bg-muted/30 p-8 sm:p-12 flex items-center justify-center">
                <div className="w-full max-w-xs space-y-4">
                  {/* Mock permission cards */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] font-bold">M</div>
                      <span className="text-xs font-semibold">Maminka vidí</span>
                    </div>
                    <div className="space-y-1.5">
                      {['DM s trenérem', 'Platby za Annu', 'Lékařské záznamy'].map((t) => (
                        <div key={t} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-emerald-500" />{t}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-[10px] font-bold">T</div>
                      <span className="text-xs font-semibold">Tatínek nevidí</span>
                    </div>
                    <div className="space-y-1.5">
                      {['DM maminky s trenérem', 'Platby (nemá oprávnění)', 'Lékařské záznamy'].map((t) => (
                        <div key={t} className="flex items-center gap-2 text-[11px] text-muted-foreground line-through opacity-50">
                          <div className="h-1 w-1 rounded-full bg-red-500" />{t}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="border-t border-border/40 px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="h-5 w-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <blockquote className="text-lg sm:text-xl font-medium leading-relaxed">
            &ldquo;Konečně nepotřebujeme WhatsApp skupinu, Excel tabulku a email dohromady. Trenéři plánují, rodiče RSVPují, admin má klid.&rdquo;
          </blockquote>
          <p className="mt-4 text-sm text-muted-foreground">— Trenér mládežnického fotbalu</p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border/40 px-6 py-20">
        <div className="pointer-events-none absolute inset-0 mesh-gradient opacity-50" />
        <div className="relative mx-auto max-w-lg text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Připraveni začít?</h2>
          <p className="mt-3 text-muted-foreground">Free tier — bez kreditky, bez závazků, bez limitů na funkce.</p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-10 py-4 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            Založit klub
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto max-w-6xl flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-brand text-white">
              <Trophy className="h-2.5 w-2.5" />
            </div>
            <span>Sport Manager</span>
          </div>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
