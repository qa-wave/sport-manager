import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileText, PenLine, ClipboardList, Shield, Download, Users } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Digitální souhlasy GDPR a zdravotní | Sport Manager',
  description:
    'Online podpisy souhlasů. GDPR, zdravotní, foto, odpovědnost. Přehled kdo podepsal.',
};

const features = [
  {
    icon: FileText,
    title: 'Šablony souhlasů',
    description: 'Připravené šablony pro GDPR, zdravotní dotazník, foto souhlas a odpovědnost.',
  },
  {
    icon: PenLine,
    title: 'Digitální podpis',
    description: 'Rodič podepíše na telefonu nebo PC. Uloženo s časovým razítkem a IP adresou.',
  },
  {
    icon: ClipboardList,
    title: 'Přehled kdo podepsal',
    description: 'Admin vidí na jednom místě, kdo podepsal a kdo má pending. Filtrování per tým.',
  },
  {
    icon: Users,
    title: 'Rodič podepisuje za dítě',
    description: 'Zákonný zástupce podepisuje souhlasy za nezletilého hráče. Privacy-aware.',
  },
  {
    icon: Shield,
    title: 'GDPR compliance',
    description: 'Souhlas obsahuje účel zpracování, dobu uchování a práva subjektu.',
  },
  {
    icon: Download,
    title: 'Export pro audit',
    description: 'PDF export všech podpisů. Dokumentace pro kontrolu nebo pojišťovnu.',
  },
];

const consentTypes = [
  {
    type: 'GDPR',
    description: 'Zpracování osobních údajů. Povinné pro všechny členy.',
    required: true,
  },
  {
    type: 'Zdravotní',
    description: 'Zdravotní stav, alergie, léky. Trenér má přehled pro případ úrazu.',
    required: false,
  },
  {
    type: 'Foto / video',
    description: 'Souhlas s fotografováním a sdílením na webu a sociálních sítích.',
    required: false,
  },
  {
    type: 'Odpovědnost',
    description: 'Prohlášení o dobrovolné účasti a přijetí rizik sportovní aktivity.',
    required: false,
  },
];

const relatedPages = [
  { href: '/produkt/sprava-clenu', label: 'Správa členů' },
  { href: '/produkt/registrace-hracu', label: 'Registrace hráčů' },
  { href: '/produkt/platby', label: 'Platby' },
  { href: '/produkt/komunikace', label: 'Komunikace' },
  { href: '/produkt/liga-sync', label: 'Liga sync' },
  { href: '/produkt/import', label: 'Import dat' },
];

export default function SouhlasyPage() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            GDPR compliant
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Digitální souhlasy.{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
              Žádný papír.
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Sbírejte GDPR, zdravotní a foto souhlasy online. Rodiče podepíší na telefonu. Vy máte
            přehled, kdo podepsal a kdo ne — bez šanonu s papíry.
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
          <h2 className="text-xl font-bold sm:text-2xl">Papírová realita</h2>
          <div className="mt-6 space-y-4">
            {[
              'Tajemník tiskne 50 GDPR formulářů před každou sezónou. Polovina rodičů "zapomene" vrátit.',
              'Kontrola na místě — "Váš podpis tu nemám." Dítě nemůže nastoupit. Scéna u hřiště.',
              'ÚOOÚ přijde s dotazem. Kde jsou souhlasy? V krabici ve sklepě. Nebo možná ne.',
              'Foto souhlas chybí u 3 hráčů. Fotograf nafotí zápas, pak zjistí, kdo nesmí být na snímcích.',
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

      {/* Consent types */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-bold sm:text-2xl">4 typy souhlasů</h2>
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Každý klub si zvolí, které souhlasy vyžaduje. Admin vytváří šablony, rodiče podepisují.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {consentTypes.map((c) => (
              <div
                key={c.type}
                className="rounded-xl border border-border bg-background p-5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{c.type}</h3>
                  {c.required && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                      Povinný
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Status overview mock */}
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-lg">
          <h2 className="mb-6 text-center text-xl font-bold sm:text-2xl">Přehled podpisů</h2>
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="border-b border-border bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              GDPR souhlas · FC Hvězda U13
            </div>
            {[
              { name: 'Tomáš Novák', status: 'signed', date: '12.9.2025' },
              { name: 'Anna Horáková', status: 'signed', date: '14.9.2025' },
              { name: 'Pavel Kratochvíl', status: 'pending', date: null },
              { name: 'Lucie Beneš', status: 'signed', date: '10.9.2025' },
              { name: 'Martin Vlček', status: 'pending', date: null },
            ].map((row, i) => (
              <div
                key={i}
                className="flex items-center justify-between border-b border-border/50 px-4 py-3 last:border-0"
              >
                <span className="text-sm font-medium">{row.name}</span>
                <div className="flex items-center gap-3">
                  {row.date && (
                    <span className="text-xs text-muted-foreground">{row.date}</span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      row.status === 'signed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                    }`}
                  >
                    {row.status === 'signed' ? 'Podepsáno' : 'Čeká'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-bold sm:text-2xl">Co digitální souhlasy umí</h2>
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
          <h2 className="text-2xl font-bold">GDPR pod kontrolou</h2>
          <p className="mt-3 text-muted-foreground">
            Každý souhlas uložen s časovým razítkem. Audit v minutách, ne hodinách.
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
