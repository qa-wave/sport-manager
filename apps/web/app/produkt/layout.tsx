import Link from 'next/link';
import { Trophy } from 'lucide-react';

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 glass px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-white">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Sport Manager</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Přihlásit se
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
            >
              Registrace
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-14">
        <div className="mx-auto max-w-5xl px-6 pt-4">
          <Link href="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            ← Sport Manager
          </Link>
        </div>
        {children}
      </main>

      <footer className="border-t border-border/40 px-6 py-8">
        <div className="mx-auto max-w-5xl flex flex-wrap gap-8 text-xs text-muted-foreground">
          <div>
            <div className="font-semibold mb-2 text-foreground">Produkt</div>
            <div className="space-y-1">
              <Link href="/produkt/kalendar" className="block hover:text-foreground">
                Kalendář & RSVP
              </Link>
              <Link href="/produkt/sprava-clenu" className="block hover:text-foreground">
                Správa členů
              </Link>
              <Link href="/produkt/komunikace" className="block hover:text-foreground">
                Komunikace
              </Link>
              <Link href="/produkt/dochazka" className="block hover:text-foreground">
                Docházka
              </Link>
              <Link href="/produkt/treninky" className="block hover:text-foreground">
                Tréninky
              </Link>
              <Link href="/produkt/platby" className="block hover:text-foreground">
                Platby
              </Link>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-2 text-foreground">Další</div>
            <div className="space-y-1">
              <Link href="/produkt/liga-sync" className="block hover:text-foreground">
                Liga sync
              </Link>
              <Link href="/produkt/registrace-hracu" className="block hover:text-foreground">
                Registrace hráčů
              </Link>
              <Link href="/produkt/sestava" className="block hover:text-foreground">
                Sestava
              </Link>
              <Link href="/produkt/live-skore" className="block hover:text-foreground">
                Živý výsledek
              </Link>
              <Link href="/produkt/souhlasy" className="block hover:text-foreground">
                Souhlasy
              </Link>
              <Link href="/produkt/import" className="block hover:text-foreground">
                Import dat
              </Link>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-2 text-foreground">Sporty</div>
            <div className="space-y-1">
              <Link href="/sporty/fotbal" className="block hover:text-foreground">
                Fotbal
              </Link>
              <Link href="/sporty/florbal" className="block hover:text-foreground">
                Florbal
              </Link>
              <Link href="/sporty/hokej" className="block hover:text-foreground">
                Hokej
              </Link>
              <Link href="/sporty/basketbal" className="block hover:text-foreground">
                Basketbal
              </Link>
              <Link href="/sporty/volejbal" className="block hover:text-foreground">
                Volejbal
              </Link>
              <Link href="/sporty/tenis" className="block hover:text-foreground">
                Tenis
              </Link>
              <Link href="/sporty/atletika" className="block hover:text-foreground">
                Atletika
              </Link>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-2 text-foreground">Zdroje</div>
            <div className="space-y-1">
              <Link href="/blog" className="block hover:text-foreground">
                Blog
              </Link>
              <Link href="/k/fc-hvezda" className="block hover:text-foreground">
                Demo
              </Link>
              <Link href="/signup" className="block hover:text-foreground">
                Registrace
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-5xl mt-6 pt-4 border-t border-border/30 text-xs text-muted-foreground">
          © 2026 Sport Manager
        </div>
      </footer>
    </div>
  );
}
