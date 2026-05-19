import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Upload, FileSpreadsheet, Calendar, Wand2, CheckCircle, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Import dat z TeamSnap, Spond a Týmuj | Sport Manager',
  description:
    'Migrujte za 10 minut. CSV import členů, iCal import událostí. Auto-detekce formátu.',
};

const features = [
  {
    icon: Wand2,
    title: 'Auto-detekce formátu',
    description: 'Nahrajete CSV a systém sám pozná, jestli jde o TeamSnap, Spond nebo vlastní formát.',
  },
  {
    icon: FileSpreadsheet,
    title: 'CSV import členů',
    description: 'Jméno, email, telefon, datum narození, tým. Hromadný import z jednoho souboru.',
  },
  {
    icon: Calendar,
    title: 'iCal import událostí',
    description: 'Exportujte z Google Calendar nebo jiného nástroje. Události se přenesou včetně popisu.',
  },
  {
    icon: Upload,
    title: 'Google Sheets import',
    description: 'Sdílejte odkaz na Google Sheet. Sport Manager data stáhne a namapuje automaticky.',
  },
  {
    icon: CheckCircle,
    title: 'Náhled před importem',
    description: 'Vždy uvidíte, co se importuje, než potvrdíte. Žádné překvapení.',
  },
  {
    icon: Clock,
    title: '10 minut migrace',
    description: 'Export z konkurence, nahrání, potvrzení. Celý klub přenesen za 10 minut.',
  },
];

const competitors = [
  {
    name: 'TeamSnap',
    description: 'Export z Account Settings → Export Member Data. CSV s členy a kontakty.',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  },
  {
    name: 'Spond',
    description: 'Exportovat skupinu → Members as CSV. Zachovány týmy a role.',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    name: 'Týmuj.cz',
    description: 'Správa členů → Exportovat → Excel/CSV. Včetně rodičů a kontaktů.',
    color: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  },
  {
    name: 'Google Calendar',
    description: 'Nastavení → Export kalendáře → ICS soubor. Zápasy a tréninky.',
    color: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  },
  {
    name: 'Excel / Google Sheets',
    description: 'Vlastní tabulka s členy? Pošlete odkaz nebo nahrajte XLSX.',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    name: 'Jakýkoli CSV',
    description: 'Neznámý formát? Ruční mapování sloupců přes vizuální průvodce.',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  },
];

const steps = [
  {
    step: '1',
    title: 'Exportujte z konkurence',
    description: 'Každý nástroj má funkci exportu. Obvykle CSV nebo Excel. Trvá 1 minutu.',
  },
  {
    step: '2',
    title: 'Nahrajte do Sport Manageru',
    description: 'Import wizard v adminpanelu. Drag & drop souboru nebo vložení URL.',
  },
  {
    step: '3',
    title: 'Zkontrolujte náhled',
    description: 'Systém ukáže, co importuje. Opravte případné chyby nebo přemapujte sloupce.',
  },
  {
    step: '4',
    title: 'Potvrďte a hotovo',
    description: 'Členové, týmy a události jsou v systému. Pozvěte rodiče na registraci.',
  },
];

const relatedPages = [
  { href: '/produkt/sprava-clenu', label: 'Správa členů' },
  { href: '/produkt/registrace-hracu', label: 'Registrace hráčů' },
  { href: '/produkt/kalendar', label: 'Kalendář & RSVP' },
  { href: '/produkt/liga-sync', label: 'Liga sync' },
  { href: '/produkt/souhlasy', label: 'Souhlasy' },
  { href: '/produkt/platby', label: 'Platby' },
];

export default function ImportPage() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            Migrace bez bolesti hlavy
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Přechod z konkurence?{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
              10 minut.
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Export z TeamSnapu, Spondu nebo Týmuje. Nahrát. Hotovo. Žádné ruční přepisování, žádná
            ztráta dat. Import wizard zvládne i váš vlastní Excel.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90"
            >
              Migrovat zdarma <ArrowRight className="h-4 w-4" />
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

      {/* From competitors */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-bold sm:text-2xl">
            Odkud umíme importovat
          </h2>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Podporujeme nejčastější formáty a konkurenční nástroje.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {competitors.map((c) => (
              <div key={c.name} className="rounded-xl border border-border bg-background p-5">
                <div className={`mb-3 inline-block rounded-lg px-2.5 py-1 text-sm font-bold ${c.color}`}>
                  {c.name}
                </div>
                <p className="text-sm text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Arrow visual */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold sm:text-2xl">Jedna cesta. Vždy do Sport Manageru.</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {['TeamSnap', 'Spond', 'Týmuj', 'Google Cal', 'Excel'].map((src) => (
              <div key={src} className="flex items-center gap-2">
                <span className="rounded-lg border border-border bg-muted px-3 py-1.5 text-sm font-medium">
                  {src}
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
            <span className="rounded-lg bg-gradient-to-r from-emerald-500 to-blue-500 px-4 py-2 text-sm font-bold text-white shadow">
              Sport Manager
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-bold sm:text-2xl">Jak migrace probíhá</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-4 rounded-xl border border-border bg-background p-5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 text-sm font-bold text-white">
                  {s.step}
                </span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-bold sm:text-2xl">Co import wizard umí</h2>
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

      {/* Reassurance */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 p-8 dark:from-emerald-950/50 dark:to-blue-950/50">
          <h3 className="text-lg font-bold">Vaše data jsou v bezpečí</h3>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {[
              'Import nemazní existující data — vše se přidá, nic se nepřepíše bez potvrzení.',
              'Nahraný soubor je smazán ihned po importu, není ukládán na serveru.',
              'Náhled vždy před potvrzením — víte přesně, co se do systému dostane.',
              'Rollback dostupný do 24 hodin po importu přes admin panel.',
            ].map((item, i) => (
              <li key={i} className="flex gap-2">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold">Přejděte dnes. Bez rizika.</h2>
          <p className="mt-3 text-muted-foreground">
            Import zdarma pro všechny kluby. Bez omezení počtu členů.
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
