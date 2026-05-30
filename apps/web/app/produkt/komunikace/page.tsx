import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Bell,
  ChevronRight,
  EyeOff,
  Hash,
  MessageCircle,
  MessageSquare,
  Search,
  Zap,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Komunikace v sportovním klubu | Sport Manager',
  description:
    'Týmový chat, přímé zprávy, oznámení. Zprávy v reálném čase. Soukromí podle účasti — každý rodič má vlastní účet. Konec chaosu ve WhatsApp skupinách.',
  keywords: [
    'sportovní klub chat',
    'komunikace sportovní tým',
    'konec whatsapp skupiny',
    'týmová komunikace aplikace',
    'soukromé zprávy trenér rodič',
  ],
  alternates: { canonical: 'https://sport-manager.qawave.ai/produkt/komunikace' },
  openGraph: {
    title: 'Komunikace v sportovním klubu | Sport Manager',
    description: 'Týmový chat, přímé zprávy, oznámení. V reálném čase. Soukromí podle účasti.',
  },
};

const FEATURES = [
  {
    icon: Hash,
    title: 'Týmové chaty',
    desc: 'Každý tým má svůj kanál. Trenér posílá informace, hráči a rodiče reagují. Přehledně a na jednom místě.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: MessageCircle,
    title: 'Přímé zprávy',
    desc: 'Přímé zprávy mezi trenérem a rodičem, nebo mezi hráči. Soukromé, bez zbytečného sdílení s celou skupinou.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Zap,
    title: 'Zprávy v reálném čase',
    desc: 'Zprávy přicházejí okamžitě, bez obnovování stránky.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Bell,
    title: 'Push notifikace',
    desc: 'Důležité oznámení dostanete i když aplikaci nemáte otevřenou. Konfigurujte si co chcete dostávat.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: EyeOff,
    title: 'Vlastní účet pro každého rodiče',
    desc: 'Každý rodič má vlastní účet a vlastní konverzace s trenérem. Nikdo nevidí zprávy druhého — i když jsou v jednom klubu.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Search,
    title: 'Rychlé vyhledávání',
    desc: 'Najděte zprávu, událost nebo člena okamžitě. Vyhledávání funguje napříč všemi konverzacemi.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
];

const COMPARE = [
  {
    problem: '5 WhatsApp skupin pro jeden klub',
    solution: 'Jeden hub, oddělené kanály per tým',
  },
  {
    problem: 'Soukromá zpráva viditelná všem',
    solution: 'Přímé zprávy jsou opravdu soukromé',
  },
  {
    problem: 'Jeden rodič vidí konverzaci druhého s trenérem',
    solution: 'Soukromí podle účasti — oddělené účty',
  },
  {
    problem: 'Starý telefon bez WhatsApp',
    solution: 'Funguje v prohlížeči, bez instalace',
  },
];

const RELATED = [
  { href: '/produkt/sprava-clenu', label: 'Správa členů' },
  { href: '/produkt/kalendar', label: 'Kalendář' },
  { href: '/produkt/dochazka', label: 'Docházka' },
  { href: '/produkt/platby', label: 'Platby' },
];

export default function KomunikacePage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-emerald-500/8 to-transparent" />
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
            <MessageSquare className="h-3 w-3" />
            Komunikace
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Konec{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              WhatsApp chaosu
            </span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Týmové kanály, přímé zprávy, push notifikace. Vše na jednom místě, s ochranou
            soukromí pro každého člena.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90"
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
              <MessageSquare className="h-4 w-4" />
              Poznáváte se?
            </div>
            <h2 className="mb-4 text-2xl font-bold">
              Důležitá informace zmizela v 200 zprávách
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Máte skupinu pro U13, skupinu pro rodiče U13, skupinu pro trenéry, skupinu pro
              organizátory turnaje a osobní zprávy. Nikdo neví co platí kde. Nová rodina přijde do
              skupiny a hned vidí všechny soukromé diskuze. A tatínek náhodou přečte zprávu
              maminky trenérovi.
            </p>
          </div>
        </div>
      </section>

      {/* Compare */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-bold">WhatsApp vs. Sport Manager</h2>
          <p className="mb-10 text-center text-muted-foreground">
            Přesun zabere odpoledne. Výsledek vydrží celou sezónu.
          </p>
          <div className="space-y-3">
            {COMPARE.map((c) => (
              <div
                key={c.problem}
                className="grid sm:grid-cols-2 gap-3"
              >
                <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4">
                  <span className="mt-0.5 text-rose-500 text-lg leading-none">✕</span>
                  <span className="text-sm text-muted-foreground">{c.problem}</span>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <span className="mt-0.5 text-emerald-500 text-lg leading-none">✓</span>
                  <span className="text-sm">{c.solution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold">Všechny komunikační funkce</h2>
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
              &ldquo;Smazal jsem WhatsApp skupinu po třech letech. Rodiče protestovali tři dny, pak
              přiznali, že je to mnohem přehlednější.&rdquo;
            </p>
            <div className="text-sm font-medium">Lukáš V.</div>
            <div className="text-xs text-muted-foreground">Head Coach U15, FC Hvězda Strašnice</div>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/15 border border-emerald-500/20 p-12 text-center">
          <h2 className="mb-3 text-2xl font-bold">Pořádek v komunikaci od příštího týdne</h2>
          <p className="mb-8 text-muted-foreground">
            Zaregistrujte klub, přidejte tým a pozvěte rodiče. WhatsApp skupinu smažte v pondělí.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 hover:opacity-90"
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
