import Link from 'next/link';
import { Trophy, Users, Calendar, MessageSquare, Shield, Zap, ArrowRight } from 'lucide-react';

const FEATURES = [
  { icon: Calendar, title: 'Kalendář & RSVP', desc: 'Tréninky, zápasy, turnaje — vše na jednom místě. RSVP na 2 kliknutí.' },
  { icon: Users, title: 'Správa členů', desc: 'Evidence hráčů, trenérů a rodičů. Rodičovské účty s granulárními právy.' },
  { icon: MessageSquare, title: 'Komunikace', desc: 'Týmové chaty, DM, oznámení. Žádný WhatsApp chaos.' },
  { icon: Shield, title: 'Role & oprávnění', desc: 'Owner, Admin, Trenér, Rodič, Hráč — každý vidí jen to, co má.' },
  { icon: Zap, title: 'Šablony tréninků', desc: 'Nastavte opakující se tréninky jednou — události se generují automaticky.' },
  { icon: Trophy, title: 'Multi-tenant', desc: 'Jeden účet, více klubů. Přepínání jako ve Slacku.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Sport Manager</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Přihlásit se
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              Vyzkoušet zdarma
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 sm:py-32">
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-40" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Řízení sportovního klubu.
            <br />
            <span className="text-gradient">Jednoduše.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
            Kalendář, docházka, komunikace, platby — vše v jedné appce.
            Náhrada za Týmuj, TeamSnap i WhatsApp skupiny.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
            >
              Založit klub zdarma
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/k/fc-hvezda"
              className="inline-flex items-center justify-center rounded-lg border border-border px-8 py-3 text-sm font-medium hover:bg-muted transition-all duration-200"
            >
              Ukázka
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/50 px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">
              Funkce
            </p>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Vše, co váš klub potřebuje
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group rounded-xl border border-border/50 p-6 transition-all duration-200 hover:shadow-md hover:-translate-y-1 hover:border-primary/20"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-t border-border/50 px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="h-5 w-5 text-amber-400 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-lg text-muted-foreground italic">
            &ldquo;Konečně nepotřebujeme WhatsApp skupinu, Excel tabulku a email dohromady.&rdquo;
          </p>
          <p className="mt-3 text-sm font-medium">
            — Trenér mládežnického fotbalu
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50 px-6 py-20 text-center">
        <div className="mx-auto max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Připraveni začít?</h2>
          <p className="mt-3 text-muted-foreground">
            Free tier — bez kreditky, bez závazků.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5"
          >
            Založit klub
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-8 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Sport Manager · sport-manager.qawave.ai
      </footer>
    </div>
  );
}
