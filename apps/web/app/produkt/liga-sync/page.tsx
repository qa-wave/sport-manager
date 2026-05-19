import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Download, Search, RefreshCw, ShieldCheck, Zap, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Liga sync — automatický import zápasů | Sport Manager',
  description:
    'Napojte svůj klub na FAČR a další svazy. Automatický import rozpisu zápasů. 13 federací.',
};

const features = [
  {
    icon: ShieldCheck,
    title: 'FAČR napojení',
    description: 'Přímé napojení na fotbal.cz. Najde váš tým, stáhne celý rozpis sezóny.',
  },
  {
    icon: Search,
    title: 'Vyhledání týmu',
    description: 'Zadejte název klubu nebo ID ze svazu. Wizard najde správný tým za vás.',
  },
  {
    icon: Download,
    title: 'Import na 1 klik',
    description: 'Celý rozpis do kalendáře během vteřin. Místo, datum, soupeř — vše automaticky.',
  },
  {
    icon: RefreshCw,
    title: 'Auto-detekce duplicit',
    description: 'Systém pozná, co už máte. Import znovu nezvýší počet zápasů.',
  },
  {
    icon: Zap,
    title: 'Demo mode bez API klíče',
    description: 'Vyzkoušejte import bez registrace ve svazu. Naplní kalendář testovacími daty.',
  },
  {
    icon: Globe,
    title: '13 svazů (coming soon)',
    description: 'FAČR je první. Chystáme florbal, hokej, basketbal a zahraniční ligy.',
  },
];

const federations = [
  { flag: '🇨🇿', name: 'FAČR', status: 'active' },
  { flag: '🇨🇿', name: 'ČFbU', status: 'soon' },
  { flag: '🇨🇿', name: 'ČBF', status: 'soon' },
  { flag: '🇩🇪', name: 'DFB', status: 'soon' },
  { flag: '🇬🇧', name: 'FA', status: 'soon' },
  { flag: '🇪🇸', name: 'RFEF', status: 'soon' },
  { flag: '🇮🇹', name: 'FIGC', status: 'soon' },
  { flag: '🇫🇷', name: 'FFF', status: 'soon' },
  { flag: '🇧🇷', name: 'CBF', status: 'soon' },
  { flag: '🇦🇷', name: 'AFA', status: 'soon' },
  { flag: '🇺🇸', name: 'US Soccer', status: 'soon' },
  { flag: '🇳🇱', name: 'KNVB', status: 'soon' },
  { flag: '🇵🇱', name: 'PZPN', status: 'soon' },
];

const relatedPages = [
  { href: '/produkt/kalendar', label: 'Kalendář & RSVP' },
  { href: '/produkt/sestava', label: 'Sestava' },
  { href: '/produkt/live-skore', label: 'Živý výsledek' },
  { href: '/produkt/dochazka', label: 'Docházka' },
  { href: '/produkt/treninky', label: 'Tréninky' },
  { href: '/produkt/import', label: 'Import dat' },
];

export default function LigaSyncPage() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            FAČR adaptér — první v ČR
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Rozpis zápasů?{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
              Stáhneme ho za vás.
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Žádné ruční opisování z fotbal.cz. Připojte klub k ligovému svazu a celý rozpis sezóny
            se automaticky přesune do vašeho kalendáře.
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
          <h2 className="text-xl font-bold sm:text-2xl">Jak to vypadá bez Liga sync</h2>
          <div className="mt-6 space-y-4">
            {[
              'Trenér otevře fotbal.cz, jeden po druhém opisuje zápasy do Excelu nebo skupiny na WhatsApp.',
              'Překlep v čase nebo místě — nikdo si nevšimne, tým přijede na špatné hřiště.',
              'Svaz změní termín zápasu. Trenér se dozví den před. Rodiče organizují neplánovaný odjezd.',
              'Nový asistent nemá přístup. Musí si zápasy opsat znovu. Jiné datum, jiná chyba.',
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

      {/* Federation grid */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-xl font-bold sm:text-2xl">13 federací. Fotbal first.</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Začínáme s FAČR. Každý měsíc přidáváme další svazy a země.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {federations.map((fed) => (
              <div
                key={fed.name}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                  fed.status === 'active'
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'border-border bg-muted/50 text-muted-foreground'
                }`}
              >
                <span className="text-base">{fed.flag}</span>
                <span>{fed.name}</span>
                {fed.status === 'active' && (
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-xs dark:bg-emerald-900">
                    živé
                  </span>
                )}
                {fed.status === 'soon' && (
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs">brzy</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-bold sm:text-2xl">Co Liga sync umí</h2>
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
          <h2 className="text-2xl font-bold">Zapomeňte na fotbal.cz</h2>
          <p className="mt-3 text-muted-foreground">
            Propojte klub jednou. Rozpis se synchronizuje automaticky po celou sezónu.
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
