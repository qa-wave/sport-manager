'use client';

import Link from 'next/link';
import {
  ArrowRight,
  Calendar,
  Lock,
  MessageSquare,
  Repeat,
  Shield,
  Smartphone,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

const TESTIMONIALS = [
  {
    text: 'Konečně nepotřebujeme WhatsApp skupinu, Excel tabulku a email dohromady.',
    author: 'Trenér mládežnického fotbalu',
    club: 'FC Hvězda',
  },
  {
    text: 'Rodiče RSVPují do 5 minut po odeslání. Předtím jsem volal každému zvlášť.',
    author: 'Hlavní trenér U13',
    club: 'TJ Sokol',
  },
  {
    text: 'Rozvedení rodiče — každý vidí jen své. Žádné konflikty.',
    author: 'Vedoucí klubu',
    club: 'SK Praha',
  },
  {
    text: 'Knihovna tréninků je pecka. Stáhnu cvičení a za 5 minut mám plán.',
    author: 'Asistent trenéra',
    club: 'FK Meteor',
  },
];

const SUPPORTED_SPORTS = [
  { emoji: '⚽', name: 'Fotbal', href: '/sporty/fotbal' },
  { emoji: '🏑', name: 'Florbal', href: '/sporty/florbal' },
  { emoji: '🏒', name: 'Hokej', href: '/sporty/hokej' },
  { emoji: '🏀', name: 'Basketbal', href: '/sporty/basketbal' },
  { emoji: '🏐', name: 'Volejbal', href: '/sporty/volejbal' },
  { emoji: '🎾', name: 'Tenis', href: '/sporty/tenis' },
  { emoji: '🏃', name: 'Atletika', href: '/sporty/atletika' },
];

const COMPARISON = [
  { feature: 'Privacy rozvedených rodičů', sportManager: true, teamSnap: false, spond: false },
  { feature: 'Multi-tenant (více klubů)', sportManager: true, teamSnap: false, spond: false },
  { feature: 'RSVP s push notifikací', sportManager: true, teamSnap: true, spond: true },
  { feature: 'QR docházka', sportManager: true, teamSnap: false, spond: false },
  { feature: 'Knihovna tréninků', sportManager: true, teamSnap: false, spond: false },
  { feature: 'RBAC role (trenér/asistent/admin)', sportManager: true, teamSnap: true, spond: false },
  { feature: 'Open source / self-host', sportManager: true, teamSnap: false, spond: false },
  { feature: 'Čeština', sportManager: true, teamSnap: false, spond: true },
];
import { AuthRedirect } from '@/components/auth-redirect';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/lib/i18n';

const FEATURE_KEYS = [
  {
    icon: Calendar,
    titleKey: 'landing.feature.calendar.title',
    descKey: 'landing.feature.calendar.desc',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-500',
  },
  {
    icon: Users,
    titleKey: 'landing.feature.members.title',
    descKey: 'landing.feature.members.desc',
    gradient: 'from-violet-500/20 to-purple-500/20',
    iconColor: 'text-violet-500',
  },
  {
    icon: MessageSquare,
    titleKey: 'landing.feature.communication.title',
    descKey: 'landing.feature.communication.desc',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconColor: 'text-emerald-500',
  },
  {
    icon: Shield,
    titleKey: 'landing.feature.roles.title',
    descKey: 'landing.feature.roles.desc',
    gradient: 'from-amber-500/20 to-orange-500/20',
    iconColor: 'text-amber-500',
  },
  {
    icon: Repeat,
    titleKey: 'landing.feature.templates.title',
    descKey: 'landing.feature.templates.desc',
    gradient: 'from-rose-500/20 to-pink-500/20',
    iconColor: 'text-rose-500',
  },
  {
    icon: Zap,
    titleKey: 'landing.feature.multitenant.title',
    descKey: 'landing.feature.multitenant.desc',
    gradient: 'from-cyan-500/20 to-blue-500/20',
    iconColor: 'text-cyan-500',
  },
];

const VALUE_STATS = [
  { label: 'Pro fotbal i florbal' },
  { label: 'Zdarma do 25 členů' },
  { label: 'Bez reklam' },
];

export default function LandingPage() {
  const { t } = useTranslation();

  const HOW_STEPS = [
    { step: '01', titleKey: 'landing.how.step1.title', descKey: 'landing.how.step1.desc', icon: Smartphone },
    { step: '02', titleKey: 'landing.how.step2.title', descKey: 'landing.how.step2.desc', icon: Users },
    { step: '03', titleKey: 'landing.how.step3.title', descKey: 'landing.how.step3.desc', icon: Zap },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      <AuthRedirect />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/40 glass px-6 py-3">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-white shadow-sm transition-shadow group-hover:shadow-md">
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Sport Manager</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/k/fc-hvezda" className="hidden sm:block text-sm text-muted-foreground hover:text-foreground transition-colors">
              Demo
            </Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {t('auth.signIn')}
            </Link>
            <LanguageSwitcher />
            <ThemeToggle />
            <Link href="/signup" className="rounded-lg bg-gradient-brand px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110">
              {t('auth.register')}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-6 py-24 sm:py-32 lg:py-40">
        {/* Background effects */}
        <div className="pointer-events-none absolute inset-0 mesh-gradient" />
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-20" />

        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl leading-[1.1]">
            {t('landing.hero.title1')}
            <br />
            <span className="text-gradient-brand">{t('landing.hero.title2')}</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t('landing.hero.subtitle')}
          </p>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/signup"
              className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-brand px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            >
              <span className="relative z-10 flex items-center gap-2">
                {t('landing.cta')}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              href="/k/fc-hvezda"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {t('landing.demo')} &rarr;
            </Link>
          </div>

          {/* Value stats */}
          <div className="mt-14 mx-auto flex max-w-lg justify-center divide-x divide-border/50">
            {VALUE_STATS.map((s) => (
              <div key={s.label} className="px-5 text-center">
                <div className="text-[12px] text-muted-foreground leading-snug">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative border-t border-border/40 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">{t('landing.features.label')}</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t('landing.features.title')}
            </h2>
            <p className="mt-4 text-muted-foreground max-w-lg mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_KEYS.map((f) => (
              <div
                key={f.titleKey}
                className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-border"
              >
                <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`} />
                <div className="relative">
                  <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted transition-colors group-hover:bg-background ${f.iconColor}`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold mb-2">{t(f.titleKey)}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t(f.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/40 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-foreground dark:text-accent mb-4">{t('landing.how.label')}</p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('landing.how.title')}</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {HOW_STEPS.map((s) => (
              <div key={s.step} className="text-center group">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-card shadow-sm transition-all group-hover:shadow-lg group-hover:border-primary/30">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-xs font-mono text-primary/60 mb-2">{s.step}</div>
                <h3 className="text-base font-semibold mb-1">{t(s.titleKey)}</h3>
                <p className="text-sm text-muted-foreground">{t(s.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy highlight */}
      <section className="border-t border-border/40 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-3xl border border-border/50 bg-card">
            <div className="grid lg:grid-cols-2">
              <div className="p-8 sm:p-12">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary mb-6">
                  <Lock className="h-3 w-3" /> Privacy-first
                </div>
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-4">
                  {t('landing.privacy.title')}
                  <br />
                  <span className="text-muted-foreground">{t('landing.privacy.subtitle')}</span>
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  {t('landing.privacy.desc')}
                </p>
                <ul className="space-y-3">
                  {[
                    t('landing.privacy.point1'),
                    t('landing.privacy.point2'),
                    t('landing.privacy.point3'),
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2.5 text-sm">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10">
                        <svg className="h-3 w-3 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                      </div>
                      {item}
                    </li>
                  ))}
                </ul>
                <Link href="/produkt/komunikace" className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline mt-4">
                  Zjistit více o privacy →
                </Link>
              </div>
              <div className="relative bg-muted/30 p-8 sm:p-12 flex items-center justify-center">
                <div className="w-full max-w-xs space-y-4">
                  {/* Mock permission cards */}
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 text-[10px] font-bold">M</div>
                      <span className="text-xs font-semibold">{t('landing.privacy.momSees')}</span>
                    </div>
                    <div className="space-y-1.5">
                      {[t('landing.privacy.momItem1'), t('landing.privacy.momItem2'), t('landing.privacy.momItem3')].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <div className="h-1 w-1 rounded-full bg-emerald-500" />{item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="h-6 w-6 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 text-[10px] font-bold">T</div>
                      <span className="text-xs font-semibold">{t('landing.privacy.dadCannotSee')}</span>
                    </div>
                    <div className="space-y-1.5">
                      {[t('landing.privacy.dadItem1'), t('landing.privacy.dadItem2'), t('landing.privacy.dadItem3')].map((item) => (
                        <div key={item} className="flex items-center gap-2 text-[11px] text-muted-foreground line-through opacity-50">
                          <div className="h-1 w-1 rounded-full bg-red-500" />{item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported sports */}
      <section className="border-t border-border/40 px-6 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground mb-6">
            Funguje pro každý sport
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {SUPPORTED_SPORTS.map((sport) => (
              <Link
                key={sport.href}
                href={sport.href}
                className="inline-flex items-center gap-2 rounded-xl border border-border/50 bg-card px-4 py-2.5 text-sm font-medium hover:border-border hover:shadow-sm transition-all duration-200"
              >
                {sport.emoji} {sport.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials grid */}
      <section className="border-t border-border/40 px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
              Reference
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Co říkají trenéři a vedoucí klubů
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.text}
                className="flex flex-col rounded-2xl border border-border/50 bg-card p-6"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="h-4 w-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-sm leading-relaxed flex-1 mb-4">
                  &ldquo;{t.text}&rdquo;
                </blockquote>
                <div>
                  <p className="text-xs font-semibold">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.club}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-border/40 px-6 py-20 sm:py-28 bg-muted/30">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary mb-4">
              Srovnání
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Proč trenéři volí Sport Manager
            </h2>
            <p className="mt-4 text-muted-foreground max-w-md mx-auto">
              Místo TeamSnap a Spond
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-card">
            <div className="grid grid-cols-4 border-b border-border/50">
              <div className="p-4 text-sm font-semibold">Funkce</div>
              <div className="p-4 text-center text-sm font-semibold text-primary">Sport Manager</div>
              <div className="p-4 text-center text-sm font-medium text-muted-foreground">TeamSnap</div>
              <div className="p-4 text-center text-sm font-medium text-muted-foreground">Spond</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 ${i < COMPARISON.length - 1 ? 'border-b border-border/30' : ''}`}
              >
                <div className="p-4 text-sm">{row.feature}</div>
                {[row.sportManager, row.teamSnap, row.spond].map((val, j) => (
                  <div key={j} className="flex items-center justify-center p-4">
                    {val ? (
                      <svg className="h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <svg className="h-4 w-4 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-border/40 px-6 py-20">
        <div className="pointer-events-none absolute inset-0 mesh-gradient opacity-50" />
        <div className="relative mx-auto max-w-lg text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('landing.ready')}</h2>
          <p className="mt-3 text-muted-foreground">{t('landing.readySubtitle')}</p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-brand px-10 py-4 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
          >
            {t('auth.register')}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 px-6 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4 mb-12">
            {/* Col 1: Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-brand text-white shadow-sm">
                  <Trophy className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold">Sport Manager</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Moderní platforma pro správu sportovních klubů. Kalendář, docházka, komunikace a RSVP v jednom nástroji.
              </p>
            </div>

            {/* Col 2: Produkt */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Produkt</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Funkce</Link></li>
                <li><Link href="#how" className="hover:text-foreground transition-colors">Jak to funguje</Link></li>
                <li><Link href="/k/fc-hvezda" className="hover:text-foreground transition-colors">Demo</Link></li>
                <li><Link href="/signup" className="hover:text-foreground transition-colors">Registrace zdarma</Link></li>
                <li><Link href="/login" className="hover:text-foreground transition-colors">Přihlášení</Link></li>
              </ul>
            </div>

            {/* Col 3: Sporty */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Sporty</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                {SUPPORTED_SPORTS.map((sport) => (
                  <li key={sport.href}>
                    <Link href={sport.href} className="hover:text-foreground transition-colors">
                      {sport.emoji} {sport.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Zdroje */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Zdroje</h3>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/blog/jak-zacit-s-rizenim-klubu" className="hover:text-foreground transition-colors">Jak začít</Link></li>
                <li><Link href="/blog/rsvp-bez-chaosu" className="hover:text-foreground transition-colors">RSVP bez chaosu</Link></li>
                <li><Link href="/blog/migrace-z-teamsnap" className="hover:text-foreground transition-colors">Migrace z TeamSnap</Link></li>
                <li><Link href="/k/fc-hvezda" className="hover:text-foreground transition-colors">Demo</Link></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border/40 pt-8 gap-4 text-xs text-muted-foreground">
            <span>© 2026 Sport Manager</span>
            <div className="flex gap-4">
              <Link href="/sporty" className="hover:text-foreground transition-colors">Sporty</Link>
              <Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">Registrace</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
