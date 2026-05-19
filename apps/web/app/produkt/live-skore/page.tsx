import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Radio, Activity, Award, Bell, RefreshCw, BarChart2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Živý výsledek zápasu — real-time skóre | Sport Manager',
  description:
    'Trenér aktualizuje skóre během zápasu. Rodiče sledují z domova. Statistiky hráčů.',
};

const features = [
  {
    icon: Radio,
    title: 'Živé skóre',
    description: 'Trenér přidá gól jedním tapnutím. Rodiče vidí aktualizaci okamžitě.',
  },
  {
    icon: Activity,
    title: 'Match status',
    description: '1. poločas, poločas, 2. poločas, prodloužení, penalty, konec. Přesný přehled.',
  },
  {
    icon: Award,
    title: 'Statistiky hráčů',
    description: 'Góly, asistence, žluté a červené karty. Kumulativní za celou sezónu.',
  },
  {
    icon: Bell,
    title: 'LIVE badge na dashboardu',
    description: 'Rodiče a hráči vidí "LIVE" indikátor na dashboardu po celou dobu zápasu.',
  },
  {
    icon: RefreshCw,
    title: 'Auto-refresh',
    description: 'Stránka se aktualizuje automaticky. Rodiče nemusí mačkat F5.',
  },
  {
    icon: BarChart2,
    title: 'Historické výsledky',
    description: 'Všechny výsledky uloženy. Statistiky hráče za celou sezónu na jednom místě.',
  },
];

const matchStatuses = [
  { label: '1. poločas', color: 'bg-green-500' },
  { label: 'Poločas', color: 'bg-yellow-500' },
  { label: '2. poločas', color: 'bg-green-500' },
  { label: 'Prodloužení', color: 'bg-orange-500' },
  { label: 'Konec', color: 'bg-slate-500' },
];

const relatedPages = [
  { href: '/produkt/kalendar', label: 'Kalendář & RSVP' },
  { href: '/produkt/sestava', label: 'Sestava' },
  { href: '/produkt/komunikace', label: 'Komunikace' },
  { href: '/produkt/liga-sync', label: 'Liga sync' },
  { href: '/produkt/dochazka', label: 'Docházka' },
  { href: '/produkt/sprava-clenu', label: 'Správa členů' },
];

export default function LiveSkorePage() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            Real-time skóre
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Rodiče sledují zápas.{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
              Z domova.
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Ne každý rodič může stát u hřiště. Real-time skóre jim přinesete přímo na telefon.
            Trenér tapne gól, rodič vidí radost.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            >
              Registrace zdarma <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/k/fc-hvezda"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-muted"
            >
              Prohlédnout demo
            </Link>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-xl font-bold sm:text-2xl">Situace bez živého skóre</h2>
          <div className="mt-6 space-y-4">
            {[
              '"Kolik je?" — tatínek napíše do WhatsApp skupiny. Trenér píše sestavu na poločase a neodpovídá.',
              'Maminka sleduje prázdnou skupinu celý první poločas. Neví, jestli prohrávají 0:3 nebo vedou.',
              'Po zápase si nikdo nepamatuje kdo dal druhý gól. Statistiky kanonýra nejsou nikde.',
              'Cizí hráči v týmu nemají kontakt. Výsledky nikdo nezveřejňuje, rodiče neví jak se tým vede.',
            ].map((text, i) => (
              <div key={i} className="flex gap-3 rounded-lg border border-border bg-background p-4">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-600 dark:bg-red-950 dark:text-red-400">
                  {i + 1}
                </span>
                <p className="text-sm text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live scoreboard mock */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-md">
          <h2 className="mb-6 text-center text-xl font-bold sm:text-2xl">Jak to vypadá</h2>
          <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-lg">
            {/* Match header */}
            <div className="bg-gradient-to-r from-emerald-600 to-blue-600 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium opacity-80">Přátelský zápas · U13</span>
                <span className="flex items-center gap-1.5 rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                  LIVE
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="text-center">
                  <div className="text-sm font-semibold">FC Hvězda</div>
                </div>
                <div className="text-4xl font-black tracking-tight">3 : 1</div>
                <div className="text-center">
                  <div className="text-sm font-semibold">SK Slavia B</div>
                </div>
              </div>
              <div className="mt-2 text-center text-xs opacity-70">67. minuta · 2. poločas</div>
            </div>
            {/* Events */}
            <div className="divide-y divide-border">
              {[
                { time: "67'", event: 'Gól', player: 'Tomáš Novák', team: 'home' },
                { time: "52'", event: 'Gól', player: 'Pavel Horák', team: 'home' },
                { time: "44'", event: 'Gól', player: 'Radek Blum', team: 'away' },
                { time: "23'", event: 'Gól', player: 'Tomáš Novák', team: 'home' },
              ].map((e, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <span className="w-8 text-right text-xs font-mono text-muted-foreground">
                    {e.time}
                  </span>
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      e.team === 'home' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    &#9917;
                  </span>
                  <span className="flex-1 font-medium">{e.player}</span>
                  <span className="text-xs text-muted-foreground">{e.event}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Match statuses */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-bold sm:text-2xl">Průběh zápasu krok za krokem</h2>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Trenér posunuje stav zápasu. Všichni vidí, kde jsme.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {matchStatuses.map((s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2">
                <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
                <span className="text-sm font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-bold sm:text-2xl">Co živé skóre umí</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-background p-5">
                <f.icon className="h-5 w-5 text-emerald-500" />
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold">Propojte rodiče se zápasem</h2>
          <p className="mt-3 text-muted-foreground">
            Jeden tap = gól zaznamenán, rodiče informováni. Jednoduché.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            Začít zdarma <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Related */}
      <section className="border-t border-border/40 px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Další funkce
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {relatedPages.map((p) => (
              <Link
                key={p.href}
                href={p.href}
                className="flex items-center justify-between rounded-lg border border-border p-3 text-sm font-medium hover:bg-muted"
              >
                {p.label}
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
