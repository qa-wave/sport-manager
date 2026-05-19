import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpen,
  ChevronRight,
  Clock,
  Layers,
  MoveRight,
  Play,
  Shapes,
  Wand2,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Knihovna tréninků pro fotbal a florbal | Sport Manager',
  description:
    '30+ cvičení s YouTube videi a taktickými diagramy. Drag & drop do kalendáře. Plán tréninku. 9 kategorií drillů pro mládežnické kluby.',
  keywords: [
    'tréninkový plán fotbal',
    'cvičení pro mládežnický fotbal',
    'tréninková knihovna',
    'fotbalový trénink plán',
    'florbal trénink cvičení',
  ],
  alternates: { canonical: 'https://sport-manager.qawave.ai/produkt/treninky' },
  openGraph: {
    title: 'Knihovna tréninků pro fotbal a florbal | Sport Manager',
    description: '30+ cvičení, YouTube videa, SVG diagramy. Drag & drop plánovač.',
  },
};

const FEATURES = [
  {
    icon: BookOpen,
    title: '30+ hotových cvičení',
    desc: 'Rozcvičky, technická cvičení, taktika, herní formy. Okamžitě použitelné, přizpůsobitelné.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Play,
    title: 'YouTube videa u každého drillu',
    desc: 'Ke každému cvičení je odkaz na video ukázku. Trenér ukáže hráčům přímo v telefonu.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Shapes,
    title: 'SVG taktické diagramy',
    desc: 'Vizuální schéma každého cvičení — hřiště, kužely, pohyb hráčů. Bez externího kreslítka.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Layers,
    title: '9 kategorií drillů',
    desc: 'Technická příprava, fyzická příprava, taktika, standardní situace, brankáři, herní formy a další.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: MoveRight,
    title: 'Drag & drop do kalendáře',
    desc: 'Přetáhněte cvičení přímo na den v kalendáři. Tréninkový plán na celý měsíc za 10 minut.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Wand2,
    title: 'Plán tréninku v události',
    desc: 'Ke každé tréninkové události přidejte konkrétní plán. Hráči vidí co je čeká, rodiče vědí na co se připravit.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
];

const CATEGORIES = [
  { name: 'Rozcvičky', count: 6 },
  { name: 'Technická příprava', count: 8 },
  { name: 'Fyzická příprava', count: 5 },
  { name: 'Taktika 1-1', count: 4 },
  { name: 'Taktika skupinová', count: 4 },
  { name: 'Standardní situace', count: 3 },
  { name: 'Herní formy', count: 5 },
  { name: 'Brankáři', count: 3 },
  { name: 'Závěrečné hry', count: 4 },
];

const RELATED = [
  { href: '/produkt/kalendar', label: 'Kalendář' },
  { href: '/produkt/dochazka', label: 'Docházka' },
  { href: '/produkt/komunikace', label: 'Komunikace' },
  { href: '/sporty/fotbal', label: 'Fotbal' },
];

export default function TreninkyPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-rose-500/8 to-transparent" />
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-medium text-rose-500">
            <BookOpen className="h-3 w-3" />
            Tréninky
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            30+ hotových tréninků.{' '}
            <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              Stačí přetáhnout.
            </span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Přestaňte trávit hodiny přípravou tréninků. Vyberte z knihovny cvičení s videi a
            diagramy, přetáhněte do kalendáře, odtrénujte.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 hover:opacity-90"
            >
              Začít zdarma
            </Link>
            <Link
              href="/k/fc-hvezda"
              className="rounded-lg border border-border px-6 py-3 text-sm font-medium hover:bg-accent"
            >
              Zobrazit demo
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-border bg-muted/30 p-8">
            <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Poznáváte se?
            </div>
            <h2 className="mb-4 text-2xl font-bold">
              2 hodiny přípravy pro 90 minut tréninku
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Trenér hledá cvičení na YouTube, kreslí schémata na papír, opisuje do Word dokumentu.
              Příprava jednoho tréninku zabere víc času než trénink samotný. A příští týden začínám
              znovu od nuly.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-bold">9 kategorií, 42 cvičení</h2>
          <p className="mb-10 text-center text-muted-foreground">
            Každá kategorie pokrývá jinou část tréninku. Sestavte program s doporučeným poměrem
            nebo volně kombinujte.
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <div
                key={c.name}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm"
              >
                <span>{c.name}</span>
                <span className="rounded-full bg-rose-500/10 px-1.5 py-0.5 text-xs font-medium text-rose-500">
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold">Všechny funkce tréninkové knihovny</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-5">
                <div className={`mb-3 inline-flex rounded-lg p-2 ${f.bg}`}>
                  <f.icon className={`h-5 w-5 ${f.color}`} />
                </div>
                <div className="mb-1.5 font-semibold">{f.title}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-bold">Příprava tréninku za 10 minut</h2>
          <div className="space-y-4">
            {[
              { n: '1', t: 'Otevřete knihovnu', d: 'Filtrujte podle kategorie, věkové skupiny nebo klíčového slova.' },
              { n: '2', t: 'Prohlédněte cvičení', d: 'Video ukázka a SVG diagram u každého drillu. Přidejte do oblíbených.' },
              { n: '3', t: 'Přetáhněte do kalendáře', d: 'Drag & drop na konkrétní den. Upravte délku a pořadí.' },
              { n: '4', t: 'Tým vidí plán', d: 'Hráči a rodiče vidí obsah tréninku v aplikaci. Na hřišti jen odtrénujte.' },
            ].map((s) => (
              <div key={s.n} className="flex gap-4 rounded-xl border border-border bg-card p-4">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-xs font-bold text-white">
                  {s.n}
                </div>
                <div>
                  <div className="font-medium">{s.t}</div>
                  <div className="text-sm text-muted-foreground">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <blockquote className="rounded-2xl border border-border bg-muted/20 p-8 text-center">
            <p className="mb-4 text-lg italic text-muted-foreground">
              &ldquo;Příprava tréninků mi zabírala neděli odpoledne. Teď mám plán na celý týden
              hotový za čtvrt hodiny a hráči vědí dopředu co je čeká.&rdquo;
            </p>
            <div className="text-sm font-medium">Jana M.</div>
            <div className="text-xs text-muted-foreground">Trenérka U11, TJ Sokol Měcholupy</div>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-rose-500/15 to-pink-500/15 border border-rose-500/20 p-12 text-center">
          <h2 className="mb-3 text-2xl font-bold">Lepší tréninky od příštího týdne</h2>
          <p className="mb-8 text-muted-foreground">
            Knihovna cvičení je dostupná ihned po registraci. Nulová příprava, maximální výsledek.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 hover:opacity-90"
          >
            Začít zdarma
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Related */}
      <section className="px-6 pb-16">
        <div className="mx-auto max-w-3xl">
          <div className="text-sm font-medium text-muted-foreground mb-4">Další funkce</div>
          <div className="flex flex-wrap gap-2">
            {RELATED.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent"
              >
                {r.label}
                <ChevronRight className="h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
