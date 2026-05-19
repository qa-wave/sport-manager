import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Bell,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Download,
  Eye,
  ReceiptText,
  Shield,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platby a příspěvky sportovního klubu | Sport Manager',
  description:
    'Stripe Connect platby online. Členské příspěvky, turnajové poplatky. Přehled kdo zaplatil, automatická upozornění. Export pro účetnictví.',
  keywords: [
    'platby sportovní klub',
    'členské příspěvky online',
    'Stripe sportovní klub',
    'platba za trénink',
    'správa financí sportovní klub',
  ],
  alternates: { canonical: 'https://sport-manager.qawave.ai/produkt/platby' },
  openGraph: {
    title: 'Platby a příspěvky sportovního klubu | Sport Manager',
    description: 'Stripe Connect platby. Přehled kdo zaplatil. Automatická upozornění.',
  },
};

const FEATURES = [
  {
    icon: CreditCard,
    title: 'Online platby přes Stripe',
    desc: 'Rodič zaplatí kartou nebo Apple Pay přímo v aplikaci. Peníze jdou přímo na účet klubu přes Stripe Connect.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Eye,
    title: 'Přehled kdo zaplatil',
    desc: 'Trenér nebo admin vidí v reálném čase kdo uhradil příspěvky a kdo ne. Žádné ruční škrtání v Excelu.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: CircleDollarSign,
    title: 'Per-event poplatky',
    desc: 'Startovné na turnaj nebo příspěvek za výjezd přidáte jako poplatek ke konkrétní události.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Bell,
    title: 'Automatická upozornění',
    desc: 'Automatická připomínka rodičům kteří dosud nezaplatili. Bez trapného osobního vymáhání.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: ReceiptText,
    title: 'Rodičovský přehled',
    desc: 'Každý rodič vidí historii svých plateb, aktuální dluh a nadcházející poplatky pro své děti.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Download,
    title: 'Export pro účetnictví',
    desc: 'CSV nebo PDF výpis všech transakcí za vybrané období. Připraveno pro účetní nebo daňové přiznání.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
];

const PAYMENT_TYPES = [
  { name: 'Členský příspěvek', desc: 'Roční nebo pololetní, nastavíte per tým' },
  { name: 'Tréninkový poplatek', desc: 'Měsíční platba za tréninkový provoz' },
  { name: 'Startovné na turnaj', desc: 'Per-event poplatek přidaný ke konkrétní události' },
  { name: 'Výjezdové náklady', desc: 'Ubytování, doprava — sdílené náklady per hráč' },
  { name: 'Vybavení', desc: 'Dres, boty, výstroj — jednorázové platby' },
];

const RELATED = [
  { href: '/produkt/sprava-clenu', label: 'Správa členů' },
  { href: '/produkt/komunikace', label: 'Komunikace' },
  { href: '/produkt/kalendar', label: 'Kalendář' },
  { href: '/produkt/dochazka', label: 'Docházka' },
];

export default function PlatbyPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-500/8 to-transparent" />
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
            <CircleDollarSign className="h-3 w-3" />
            Platby
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Příspěvky bez{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text text-transparent">
              Excelu a hotovosti
            </span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Online platby kartou nebo Apple Pay, přehled nedoplatků, automatické upozornění.
            Konec vybírání cash na tréninku a ručního škrtání v tabulce.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90"
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
              <CircleDollarSign className="h-4 w-4" />
              Poznáváte se?
            </div>
            <h2 className="mb-4 text-2xl font-bold">
              Hotovost v obálce, Excel kdo zaplatil, stud vymáhat
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Trenér stojí na tréninku s peněžníkem a sbírá hotovost. Rodič zapomene, trenér si to
              nenepíše, příspěvky se kumulují. Vymáhat peníze osobně je nepříjemné — a tak se
              platby neřeší, dokud klub nemá problém s cashflow.
            </p>
          </div>
        </div>
      </section>

      {/* Payment types */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Jaké platby zvládnete</h2>
          <p className="mb-10 text-center text-muted-foreground">
            Od ročních příspěvků po jednorázové turnajové poplatky — vše pod jednou střechou.
          </p>
          <div className="space-y-3">
            {PAYMENT_TYPES.map((p) => (
              <div
                key={p.name}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                </div>
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-sm text-muted-foreground">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold">Všechny platební funkce</h2>
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

      {/* Security note */}
      <section className="px-6 py-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-start gap-4 rounded-xl border border-border bg-muted/20 p-5">
            <Shield className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
            <div>
              <div className="mb-1 font-medium">Bezpečnost plateb</div>
              <div className="text-sm text-muted-foreground">
                Platby zpracovává Stripe — PCI-DSS Level 1 certifikovaný poskytovatel. Sport
                Manager nikdy nevidí číslo karty. Peníze jdou přímo na bankovní účet klubu přes
                Stripe Connect, ne přes nás.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <blockquote className="rounded-2xl border border-border bg-muted/20 p-8 text-center">
            <p className="mb-4 text-lg italic text-muted-foreground">
              &ldquo;Za první sezónu se nám podařilo vybrat 94 % příspěvků. Předtím jsme měli
              stále kolem 30 % nedoplatků, protože nikdo nechtěl vymáhat.&rdquo;
            </p>
            <div className="text-sm font-medium">Eva K.</div>
            <div className="text-xs text-muted-foreground">Pokladní, FC Hvězda Strašnice</div>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-emerald-500/15 to-green-500/15 border border-emerald-500/20 p-12 text-center">
          <h2 className="mb-3 text-2xl font-bold">Cashflow pod kontrolou od příštího měsíce</h2>
          <p className="mb-8 text-muted-foreground">
            Nastavte příspěvky, pozvěte rodiče a nechte aplikaci, aby upomínky řešila za vás.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90"
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
