import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  Image,
  Link2,
  Shield,
  Users,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Správa členů sportovního klubu | Sport Manager',
  description:
    'Evidence hráčů, trenérů a rodičů. 5 rolí, granulární oprávnění. Import z CSV. Profily s avatary. Rozvedení rodiče s ochranou soukromí.',
  keywords: [
    'správa členů sportovního klubu',
    'evidence hráčů',
    'role trenér rodič hráč',
    'CSV import klub',
    'sportovní klub software',
  ],
  alternates: { canonical: 'https://sport-manager.qawave.ai/produkt/sprava-clenu' },
  openGraph: {
    title: 'Správa členů sportovního klubu | Sport Manager',
    description: 'Evidence hráčů, trenérů a rodičů. 5 rolí, granulární oprávnění. Import z CSV.',
  },
};

const FEATURES = [
  {
    icon: Shield,
    title: '5 rolí s granulárními právy',
    desc: 'Owner, Admin, Coach, Parent, Player. Každá role vidí jen to, co má vidět. Nastavíte jednou.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: EyeOff,
    title: 'Privacy pro rozvedené rodiče',
    desc: 'Každý rodič má vlastní účet. Konverzace a platby jsou oddělené — tatínek nevidí zprávy maminky s trenérem.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Download,
    title: 'CSV import a export',
    desc: 'Nahrajte existující Excel s členy za 2 minuty. Exportujte kdykoli pro pojišťovnu nebo svaz.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Image,
    title: 'Hráčské profily s fotkami',
    desc: 'Profilové foto, datum narození, pozice, číslo dresu, zdravotní poznámky viditelné jen pro trenéra.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: Users,
    title: 'Statistiky per hráč',
    desc: 'Docházka, počet odehraných zápasů, RSVP spolehlivost. Jedním pohledem víte, kdo je nejaktivnější.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Link2,
    title: 'Invite link pro nové členy',
    desc: 'Sdílejte odkaz na přidání do klubu. Nový člen vyplní formulář, vy schválíte přihlášku.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
];

const ROLES = [
  { role: 'Owner', popis: 'Zakladatel klubu. Plný přístup, billing, nastavení.', color: 'text-emerald-500' },
  { role: 'Admin', popis: 'Správa členů, událostí a financí. Může přidávat adminy.', color: 'text-blue-500' },
  { role: 'Coach', popis: 'Tréninkový plán, docházka, komunikace s rodiči.', color: 'text-emerald-500' },
  { role: 'Parent', popis: 'RSVP za dítě, platby, chat s trenérem. Privacy-isolated.', color: 'text-amber-500' },
  { role: 'Player', popis: 'Vlastní profil, docházka, RSVP. Juvenilní hráč má omezenou viditelnost.', color: 'text-rose-500' },
];

const RELATED = [
  { href: '/produkt/komunikace', label: 'Komunikace' },
  { href: '/produkt/platby', label: 'Platby' },
  { href: '/produkt/dochazka', label: 'Docházka' },
  { href: '/produkt/kalendar', label: 'Kalendář' },
];

export default function SpravaClenůPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-500/8 to-transparent" />
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
            <Users className="h-3 w-3" />
            Správa členů
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Všichni vaši lidé{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-emerald-500 bg-clip-text text-transparent">
              na jednom místě
            </span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Hráči, trenéři, rodiče i správci v jedné přehledné evidenci. S rolemi, oprávněními a
            ochranou soukromí.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90"
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
              <Eye className="h-4 w-4" />
              Poznáváte se?
            </div>
            <h2 className="mb-4 text-2xl font-bold">
              Excel s 60 řádky, duplikáty a zastaralými čísly
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Tabulka s členy je na disku tajemníka, kontakty jsou v telefonu trenéra a někde
              existuje ještě Google Sheets, co nikdo neaktualizuje. Rodiče mají přístup jen přes
              WhatsApp skupinu viditelnou pro všechny — i pro ty, kteří by ji vidět neměli.
            </p>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-bold">5 rolí přesně na míru</h2>
          <p className="mb-10 text-center text-muted-foreground">
            Každý člen dostane roli, která odpovídá jeho vztahu ke klubu.
          </p>
          <div className="space-y-3">
            {ROLES.map((r) => (
              <div
                key={r.role}
                className="flex items-start gap-4 rounded-xl border border-border bg-card p-4"
              >
                <div className={`mt-0.5 text-sm font-bold w-20 shrink-0 ${r.color}`}>{r.role}</div>
                <div className="text-sm text-muted-foreground">{r.popis}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold">Všechny funkce správy členů</h2>
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

      {/* Testimonial */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-2xl">
          <blockquote className="rounded-2xl border border-border bg-muted/20 p-8 text-center">
            <p className="mb-4 text-lg italic text-muted-foreground">
              &ldquo;Importoval jsem Excel se 60 hráči za 5 minut. Rodiče dostali pozvánky sami,
              já jen schvaloval přihlášky.&rdquo;
            </p>
            <div className="text-sm font-medium">Radek S.</div>
            <div className="text-xs text-muted-foreground">Sekretář, TJ Sokol Měcholupy</div>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/15 border border-emerald-500/20 p-12 text-center">
          <h2 className="mb-3 text-2xl font-bold">Pořádek v evidenci za jeden víkend</h2>
          <p className="mb-8 text-muted-foreground">
            Importujte stávající data, nastavte role a klub je ready na sezónu.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90"
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
