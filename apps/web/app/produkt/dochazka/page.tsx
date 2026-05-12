import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BarChart2,
  CheckSquare,
  ChevronRight,
  Clock,
  QrCode,
  TrendingUp,
  Users,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Docházka a statistiky sportovního týmu | Sport Manager',
  description:
    'QR docházka, heatmapa účasti, statistiky per hráč. 20 dětí za 30 sekund. Bulk attendance pro trenéry. GitHub-style heatmapa.',
  keywords: [
    'docházka sportovní tým',
    'QR kód trénink',
    'attendance hráči',
    'statistiky docházka',
    'bulk attendance',
  ],
  alternates: { canonical: 'https://sport-manager.qawave.ai/produkt/dochazka' },
  openGraph: {
    title: 'Docházka a statistiky sportovního týmu | Sport Manager',
    description: 'QR docházka, heatmapa, statistiky. 20 dětí za 30 sekund.',
  },
};

const FEATURES = [
  {
    icon: QrCode,
    title: 'QR docházka',
    desc: 'Trenér zobrazí QR kód na telefonu. Každý hráč naskenuje svým telefonem — docházka zapísána.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: CheckSquare,
    title: 'Bulk attendance',
    desc: 'Checkboxy pro celý tým na jedné obrazovce. 20 hráčů za 30 sekund. Bez QR, bez skenování.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: BarChart2,
    title: 'GitHub-style heatmapa',
    desc: 'Vizuální přehled docházky za celou sezónu. Jedním pohledem vidíte vzorce a výpadky.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: TrendingUp,
    title: 'Statistiky per hráč',
    desc: 'Procento účasti, série po sobě jdoucích tréninků, srovnání s průměrem týmu.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Users,
    title: 'Porovnání s týmem',
    desc: 'Trenér vidí rankingy — kdo je nejspolehlivější, kdo zanedbává přípravu. Data pro výběr sestavy.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Clock,
    title: 'Série tréninků',
    desc: 'Automatické sledování streak — kolikátý trénink v řadě hráč nezmeškal. Motivace pro mládež.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
];

const STEPS = [
  {
    step: '1',
    title: 'Před tréninkem',
    desc: 'Trénink v kalendáři. Trenér otevře událost a klikne na Zahájit docházku.',
  },
  {
    step: '2',
    title: 'Na místě — 2 možnosti',
    desc: 'QR kód na displeji trenéra (hráči skenují) nebo bulk checkboxy (trenér zaškrtá sám).',
  },
  {
    step: '3',
    title: 'Po tréninku',
    desc: 'Statistiky se automaticky aktualizují. Rodiče mohou vidět docházku svého dítěte.',
  },
];

const RELATED = [
  { href: '/produkt/kalendar', label: 'Kalendář' },
  { href: '/produkt/treninky', label: 'Tréninky' },
  { href: '/produkt/sprava-clenu', label: 'Správa členů' },
  { href: '/produkt/komunikace', label: 'Komunikace' },
];

export default function DochazkaPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-amber-500/8 to-transparent" />
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500">
            <CheckSquare className="h-3 w-3" />
            Docházka
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            20 dětí za{' '}
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
              30 sekund
            </span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Bez papírových prezenčních listin, bez ručního počítání. QR kód nebo bulk checkboxy —
            docházka je hotová dřív, než začne rozcvička.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 hover:opacity-90"
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
              Prezenční listina někde v autě, statistiky nikde
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Papír s docházkou leží ve složce, nikdo ho nepřenáší do počítače. Trenér si nepamatuje
              kdo byl na posledních pěti trénincích. Rodič se ptá proč jeho syn nemůže hrát v
              sestavě — trenér nemá žádná data na podporu rozhodnutí.
            </p>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Docházka v 3 krocích</h2>
          <p className="mb-10 text-center text-muted-foreground">
            Od zahájení tréninku po statistiky v méně než minutě.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-sm font-bold text-white">
                  {s.step}
                </div>
                <div className="mb-1 font-semibold">{s.title}</div>
                <div className="text-sm text-muted-foreground">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold">Všechny funkce docházky</h2>
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

      {/* Heatmap visual placeholder */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-8">
          <div className="mb-4 font-semibold">Ukázka heatmapy docházky — Tomáš K.</div>
          <div className="grid grid-cols-[repeat(52,_1fr)] gap-0.5 overflow-hidden rounded">
            {Array.from({ length: 364 }).map((_, i) => {
              const rand = Math.random();
              const color =
                rand > 0.8
                  ? 'bg-amber-500'
                  : rand > 0.6
                    ? 'bg-amber-400/60'
                    : rand > 0.4
                      ? 'bg-amber-300/30'
                      : 'bg-muted';
              return <div key={i} className={`aspect-square rounded-[1px] ${color}`} />;
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Méně</span>
            <div className="flex gap-1">
              {['bg-muted', 'bg-amber-300/30', 'bg-amber-400/60', 'bg-amber-500'].map((c) => (
                <div key={c} className={`h-3 w-3 rounded-[2px] ${c}`} />
              ))}
            </div>
            <span>Více</span>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <blockquote className="rounded-2xl border border-border bg-muted/20 p-8 text-center">
            <p className="mb-4 text-lg italic text-muted-foreground">
              &ldquo;Rodič přišel říct, že jeho syn by měl hrát víc. Ukázal jsem mu heatmapu — byl
              na 40 % tréninků. Diskuze skončila za 10 sekund.&rdquo;
            </p>
            <div className="text-sm font-medium">Pavel H.</div>
            <div className="text-xs text-muted-foreground">Head Coach U15, TJ Sokol Měcholupy</div>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/15 border border-amber-500/20 p-12 text-center">
          <h2 className="mb-3 text-2xl font-bold">Data místo papírů od příští sezóny</h2>
          <p className="mb-8 text-muted-foreground">
            Začněte sledovat docházku dnes. Za měsíc budete mít statistiky, které změní vaše
            tréninkové rozhodování.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 hover:opacity-90"
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
