import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  Link2,
  RefreshCw,
  Repeat,
  Send,
  Users,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kalendář a RSVP pro sportovní kluby | Sport Manager',
  description:
    'Měsíční, týdenní i denní pohled. RSVP na 2 kliknutí. Automatické připomínky. Export do Google Calendar. Bulk RSVP pro trenéra.',
  keywords: [
    'sportovní kalendář',
    'RSVP tréninky',
    'klubový kalendář',
    'iCal export',
    'sportovní klub aplikace',
  ],
  alternates: { canonical: 'https://sport-manager.qawave.ai/produkt/kalendar' },
  openGraph: {
    title: 'Kalendář a RSVP pro sportovní kluby | Sport Manager',
    description: 'Měsíční, týdenní i denní pohled. RSVP na 2 kliknutí. Automatické připomínky.',
  },
};

const FEATURES = [
  {
    icon: Calendar,
    title: 'Měsíční, týdenní i denní pohled',
    desc: 'Přepínejte pohledy jedním kliknutím. Filtrace podle týmu nebo typu události — trénink, zápas, turnaj.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: CheckCircle,
    title: 'RSVP na 2 kliknutí',
    desc: 'Hráč nebo rodič potvrdí účast přímo z notifikace. Žádné přihlašování, žádné hledání.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Link2,
    title: 'Magic link bez loginu',
    desc: 'Odkaz v SMS nebo emailu otevře RSVP formulář přímo. Funguje i pro prarodiče bez smartphonu.',
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
  },
  {
    icon: Send,
    title: 'Export do Google a Outlook',
    desc: 'Jednorázový iCal export nebo živý feed — události se synchronizují automaticky.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: Users,
    title: 'Bulk RSVP pro trenéra',
    desc: 'Trenér zaškrtne celý tým a nastaví YES/NO za všechny. Ušetří 10 minut před každým zápasem.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: Repeat,
    title: 'Opakující se události',
    desc: 'Nastavte trénink jednou na celou sezónu. Výjimky přidáte u jednotlivé instance.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
];

const RELATED = [
  { href: '/produkt/dochazka', label: 'Docházka' },
  { href: '/produkt/treninky', label: 'Tréninky' },
  { href: '/produkt/komunikace', label: 'Komunikace' },
  { href: '/produkt/sprava-clenu', label: 'Správa členů' },
];

export default function KalendarPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-24 text-center">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-500/8 to-transparent" />
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
            <Calendar className="h-3 w-3" />
            Kalendář & RSVP
          </div>
          <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Kalendář, který váš tým{' '}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">
              skutečně používá
            </span>
          </h1>
          <p className="mb-8 text-lg text-muted-foreground">
            Trenéři plánují, hráči potvrzují, rodiče vědí. Bez WhatsApp skupin, bez telefonátů,
            bez Excelu.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:opacity-90"
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
              &ldquo;Kdo přijde na trénink?&rdquo; — a nikdo neodpovídá
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              WhatsApp zpráva zmizí v chaosu jiných zpráv. Trenér obvolává každého zvlášť. Rodiče
              píšou SMS. V den tréninku přijde polovina lidí a nikdo neví proč. Takhle to jede
              každý týden.
            </p>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="px-6 py-8">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-2 text-center text-2xl font-bold">Jak to řeší Sport Manager</h2>
          <p className="mb-10 text-center text-muted-foreground">
            Jeden kalendář pro celý klub. Každý dostane notifikaci, potvrdí jedním kliknutím.
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                step: '1',
                title: 'Trenér vytvoří událost',
                desc: 'Trénink, zápas nebo turnaj za 30 sekund. Opakující se série jedním nastavením.',
              },
              {
                step: '2',
                title: 'Tým dostane notifikaci',
                desc: 'Push notifikace, email nebo SMS s magic linkem. Funguje i bez aplikace.',
              },
              {
                step: '3',
                title: 'Trenér vidí přehled',
                desc: 'Kdo přijde, kdo ne, kdo ještě neodpověděl. V reálném čase.',
              },
            ].map((item) => (
              <div key={item.step} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white">
                  {item.step}
                </div>
                <div className="mb-1 font-semibold">{item.title}</div>
                <div className="text-sm text-muted-foreground">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-10 text-center text-2xl font-bold">Všechny funkce kalendáře</h2>
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
              &ldquo;Dřív jsem volal rodičům každý čtvrtek. Teď kouknout na telefon a mám odpovědi
              od 18 z 20 hráčů ještě dopoledne.&rdquo;
            </p>
            <div className="text-sm font-medium">Martin K.</div>
            <div className="text-xs text-muted-foreground">Trenér U13, FC Hvězda Strašnice</div>
          </blockquote>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-500/20 p-12 text-center">
          <h2 className="mb-3 text-2xl font-bold">Připraveni na první událost?</h2>
          <p className="mb-8 text-muted-foreground">
            Zaregistrujte klub za 2 minuty. Kalendář nastavíte dřív, než dopiijete kávu.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:opacity-90"
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
