import Link from 'next/link';
import { Trophy, Users, Calendar, MessageSquare, Shield, Zap } from 'lucide-react';

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
      <header className="border-b border-border/30 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15">
              <Trophy className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-bold">Sport Manager</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Přihlásit se
            </Link>
            <Link
              href="/signup"
              className="rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Vyzkoušet zdarma
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Řízení sportovního klubu.
            <br />
            <span className="text-primary">Jednoduše.</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Kalendář, docházka, komunikace, platby — vše v jedné appce.
            Náhrada za Týmuj, TeamSnap i WhatsApp skupiny.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Založit klub zdarma
            </Link>
            <Link
              href="/k/hvezda-strasnice"
              className="rounded-md border border-border px-6 py-2.5 text-sm font-medium hover:bg-secondary/50 transition-colors"
            >
              Ukázka
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border/30 px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Co umí Sport Manager
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-lg border border-border/50 p-5 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]"
              >
                <f.icon className="mb-3 h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/30 px-6 py-16 text-center">
        <h2 className="text-2xl font-bold">Připraveni začít?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Free tier — bez kreditky, bez závazků.
        </p>
        <Link
          href="/signup"
          className="mt-6 inline-block rounded-md bg-primary px-8 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Založit klub
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/30 px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Sport Manager · sport-manager.qawave.ai
      </footer>
    </div>
  );
}
