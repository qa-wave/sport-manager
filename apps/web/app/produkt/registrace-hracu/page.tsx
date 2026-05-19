import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Link2, UserPlus, Mail, ToggleRight, Users, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Online registrace hráčů do sportovního klubu | Sport Manager',
  description:
    'Veřejný registrační formulář. Rodiče přihlásí dítě online. Bez papírů, bez emailů.',
};

const features = [
  {
    icon: Link2,
    title: 'Veřejný formulář bez loginu',
    description: 'Rodič otevře odkaz, vyplní jméno dítěte, vybere tým. Bez registrace, bez hesel.',
  },
  {
    icon: UserPlus,
    title: 'Auto-vytvoření rodičovského účtu',
    description: 'Po odeslání systém vytvoří účet pro rodiče a přiřadí dítě do týmu.',
  },
  {
    icon: Link2,
    title: 'Vlastní URL per klub',
    description: 'sport-manager.qawave.ai/prihlasit/fc-hvezda — pošlete rodičům jedinou adresu.',
  },
  {
    icon: Users,
    title: 'Výběr týmu',
    description: 'Rodič vybírá z veřejně viditelných týmů vašeho klubu. Žádná chybná přiřazení.',
  },
  {
    icon: Mail,
    title: 'Email potvrzení',
    description: 'Rodič dostane potvrzovací email s přístupovými údaji a odkazem na aplikaci.',
  },
  {
    icon: ToggleRight,
    title: 'Admin toggle',
    description: 'Registrace otevřená / uzavřená jedním přepínačem. Stopnete nábor v sekundu.',
  },
];

const steps = [
  {
    step: '1',
    title: 'Pošlete odkaz',
    description: 'Sdílejte registrační URL na webu klubu, Facebooku nebo v emailu.',
  },
  {
    step: '2',
    title: 'Rodič vyplní formulář',
    description: 'Jméno dítěte, datum narození, výběr týmu, kontakt na rodiče. 2 minuty.',
  },
  {
    step: '3',
    title: 'Systém vytvoří účty',
    description: 'Automaticky vznikne účet rodiče, profil dítěte a členství v týmu.',
  },
  {
    step: '4',
    title: 'Admin schválí nebo odmítne',
    description: 'Notifikace do adminpanelu. Jedno kliknutí a hráč je aktivní člen.',
  },
];

const relatedPages = [
  { href: '/produkt/sprava-clenu', label: 'Správa členů' },
  { href: '/produkt/souhlasy', label: 'Souhlasy' },
  { href: '/produkt/komunikace', label: 'Komunikace' },
  { href: '/produkt/platby', label: 'Platby' },
  { href: '/produkt/liga-sync', label: 'Liga sync' },
  { href: '/produkt/import', label: 'Import dat' },
];

export default function RegistraceHracuPage() {
  return (
    <>
      {/* Hero */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
            Nový hráč za 2 minuty
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Registrace nových hráčů?{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent">
              Online za 2 minuty.
            </span>
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Veřejný formulář přístupný bez loginu. Rodiče přihlásí dítě sami — bez papírů, bez
            emailů na sekretariát, bez ručního zadávání do systému.
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
          <h2 className="text-xl font-bold sm:text-2xl">Jak to chodí bez online registrace</h2>
          <div className="mt-6 space-y-4">
            {[
              'Rodič pošle email "chceme přihlásit syna do U13". Tajemník odpoví za 3 dny se PDF přihláškou.',
              'Rodič vytiskne, vyplní, podepíše a naskenuje. Email zpět. Tajemník to ručně přepíše do Excelu.',
              'Za 2 týdny přijde email "ještě chybí podpis". Celý kolotoč znovu.',
              'Nábor otvírá klub jednou ročně. Všichni čekají, kapacity se hlídají v hlavě.',
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

      {/* How it works */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-bold sm:text-2xl">Jak to funguje</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {steps.map((s) => (
              <div key={s.step} className="flex gap-4 rounded-xl border border-border p-5">
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
      <section className="bg-muted/40 px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-xl font-bold sm:text-2xl">Co registrace umí</h2>
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

      {/* Social proof */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-emerald-50 to-blue-50 p-8 dark:from-emerald-950/50 dark:to-blue-950/50">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 text-lg font-bold text-white">
              M
            </div>
            <div>
              <p className="text-sm font-medium">Markéta Horáková, sekretářka FC Hvězda</p>
              <p className="mt-2 text-muted-foreground">
                &ldquo;Dřív jsem strávila celý víkend zpracováváním přihlášek před sezónou. Teď
                otevřu nábor v pátek, v pondělí mám 30 hotových registrací a neposlala jsem jediný
                email.&rdquo;
              </p>
              <div className="mt-3 flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <CheckCircle key={i} className="h-4 w-4 text-emerald-500" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-20 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-bold">Otevřete nábor. Dnes.</h2>
          <p className="mt-3 text-muted-foreground">
            Nastavte formulář za 5 minut. Hráči se začnou přihlašovat sami.
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
