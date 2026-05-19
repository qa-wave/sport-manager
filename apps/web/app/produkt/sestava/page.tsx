import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, LayoutGrid, MousePointer, Save, Eye, Users, CheckSquare } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sestavy a formace pro fotbalové zápasy | Sport Manager',
  description:
    'Vizuální lineup builder. 5 formací (4-4-2, 4-3-3, 3-5-2). Přiřaďte hráče na pozice.',
};

const features = [
  {
    icon: LayoutGrid,
    title: '5 formací',
    description: '4-4-2, 4-3-3, 3-5-2, 4-2-3-1 a 3-4-3. Přepínání jedním kliknutím.',
  },
  {
    icon: MousePointer,
    title: 'Klik na pozici → výběr hráče',
    description: 'Kliknete na kruh na hřišti, vyberete hráče ze seznamu. Drag & drop volitelně.',
  },
  {
    icon: CheckSquare,
    title: 'Pouze hráči s RSVP YES',
    description: 'Systém automaticky vyfiltruje hráče, kteří potvrdili účast na zápase.',
  },
  {
    icon: Save,
    title: 'Uložení v události',
    description: 'Sestava je součástí zápasu. Otevřete kdykoli, na telefonu nebo PC.',
  },
  {
    icon: Eye,
    title: 'Read-only pro hráče',
    description: 'Hráči vidí svoji pozici v aplikaci. Trenér sestavou nekomunikuje přes zprávy.',
  },
  {
    icon: Users,
    title: 'Náhradníci',
    description: 'Označte hráče jako náhradníky. Zobrazí se pod hřištěm, mimo formaci.',
  },
];

const formations = [
  { name: '4-4-2', description: 'Klasika. Dvě útočné špice, čtyři záloha.' },
  { name: '4-3-3', description: 'Ofenzivní trojice. Široká hra po stranách.' },
  { name: '3-5-2', description: 'Tři stopeři, pět záložníků. Dominance středu.' },
  { name: '4-2-3-1', description: 'Moderní 4-2-3-1. Dva defenzivní záložníci.' },
  { name: '3-4-3', description: 'Agresivní pressing. Silný střed i útok.' },
];

const relatedPages = [
  { href: '/produkt/kalendar', label: 'Kalendář & RSVP' },
  { href: '/produkt/live-skore', label: 'Živý výsledek' },
  { href: '/produkt/dochazka', label: 'Docházka' },
  { href: '/produkt/liga-sync', label: 'Liga sync' },
  { href: '/produkt/treninky', label: 'Tréninky' },
  { href: '/produkt/sprava-clenu', label: 'Správa členů' },
];

export default function SestravaPage() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
            Vizuální lineup builder
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Sestava na zápas.{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
              Vizuálně.
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Žádný papír, žádná zpráva "ty hraješ vlevo". Klikněte na pozici, přiřaďte hráče a
            každý vidí svoji roli ještě před výkopem.
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
          <h2 className="text-xl font-bold sm:text-2xl">Jak to chodí bez vizuální sestavy</h2>
          <div className="mt-6 space-y-4">
            {[
              'Trenér píše sestavu na papír v kabině 10 minut před zápasem. Hráči se tísní kolem a nečtou dobře.',
              'Změna na poslední chvíli — trenér přepisuje, zamotá se, hráč jde na špatnou pozici.',
              'Rodiče na tribuně neví, kde jejich dítě hraje. Ptají se v half-time chatu.',
              'Příští rok nikdo neví, v jaké sestavě klub hrál loňský šlágr. Data nejsou.',
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

      {/* Formations */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-bold sm:text-2xl">5 formací k dispozici</h2>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Přepínáte mezi formacemi jedním kliknutím. Hráči se přesunou, pozice se přizpůsobí.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {formations.map((f) => (
              <div
                key={f.name}
                className="rounded-xl border border-border bg-background p-5 text-center"
              >
                <div className="text-2xl font-bold text-emerald-500">{f.name}</div>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </div>
            ))}
            <div className="flex items-center justify-center rounded-xl border border-dashed border-border p-5 text-center text-sm text-muted-foreground">
              Další formace — na vyžádání
            </div>
          </div>
        </div>
      </section>

      {/* Pitch visual */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-bold sm:text-2xl">SVG hřiště v reálném čase</h2>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Hřiště se vykreslí přesně podle vybrané formace. Pozice jsou pojmenované, klikatelné.
          </p>
          <div className="mt-8 overflow-hidden rounded-2xl border border-border bg-emerald-900 p-6">
            {/* Simplified pitch representation */}
            <div className="mx-auto max-w-xs">
              <div className="flex flex-col items-center gap-3">
                {/* Goal top */}
                <div className="h-2 w-16 rounded bg-white/30" />
                {/* Attackers */}
                <div className="flex w-full justify-around">
                  {['LW', 'ST', 'RW'].map((pos) => (
                    <div
                      key={pos}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white shadow"
                    >
                      {pos}
                    </div>
                  ))}
                </div>
                {/* Midfielders */}
                <div className="flex w-full justify-around">
                  {['LM', 'CM', 'CM', 'RM'].map((pos, i) => (
                    <div
                      key={`${pos}-${i}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white shadow"
                    >
                      {pos}
                    </div>
                  ))}
                </div>
                {/* Defenders */}
                <div className="flex w-full justify-around">
                  {['LB', 'CB', 'CB', 'RB'].map((pos, i) => (
                    <div
                      key={`${pos}-${i}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-500 text-xs font-bold text-white shadow"
                    >
                      {pos}
                    </div>
                  ))}
                </div>
                {/* Goalkeeper */}
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-yellow-500 text-xs font-bold text-white shadow">
                  GK
                </div>
                {/* Goal bottom */}
                <div className="h-2 w-16 rounded bg-white/30" />
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-white/50">Formace 4-3-3 — ukázka</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-bold sm:text-2xl">Co sestava umí</h2>
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
          <h2 className="text-2xl font-bold">Hotová sestava před výkopem</h2>
          <p className="mt-3 text-muted-foreground">
            Hráči vidí pozici v aplikaci. Trenér nemusí nic vysvětlovat v kabině.
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
