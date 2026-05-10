'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Bell,
  Calendar,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  MessageSquare,
  Repeat,
  Shield,
  Trophy,
  UserCheck,
  UserCog,
  Users,
  XCircle,
} from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryProvider } from '@/components/query-provider';

type PublicClubData = {
  slug: string;
  name: string;
  theme: { primary: string; secondary: string; tertiary: string; styleId: number };
  memberCount: number;
  teams: Array<{
    id: string;
    name: string;
    sport: string;
    ageGroup: string | null;
    season: string;
  }>;
};

export default function PublicClubPage() {
  return (
    <QueryProvider>
      <PublicClubContent />
    </QueryProvider>
  );
}

/* ── Role definitions ─── */

const ROLES = [
  {
    role: 'Owner / Admin',
    icon: UserCog,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    loginHint: 'admin@hvezda.cz',
    capabilities: [
      { icon: Users, text: 'Kompletní správa členů — přidávání, role, statusy' },
      { icon: CreditCard, text: 'Platby a příspěvky — přehled, kdo zaplatil' },
      { icon: Shield, text: 'Feature flags — zapíná/vypíná moduly per klub' },
      { icon: UserCog, text: 'Nastavení klubu — název, barvy, styl, časová zóna' },
      { icon: ClipboardList, text: 'Audit log — kdo co kdy změnil' },
    ],
  },
  {
    role: 'Trenér',
    icon: UserCheck,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    loginHint: 'coach@hvezda.cz',
    capabilities: [
      { icon: Calendar, text: 'Plánování tréninků a zápasů — vytváření, editace, mazání' },
      { icon: Repeat, text: 'Šablony tréninků — opakující se události jedním klikem' },
      { icon: CheckCircle2, text: 'Bulk RSVP — celý tým najednou ANO/NE' },
      { icon: ClipboardList, text: 'Docházka — checkboxy po tréninku, 30 sekund' },
      { icon: MessageSquare, text: 'Komunikace — týmový chat, DM s rodiči' },
    ],
  },
  {
    role: 'Rodič',
    icon: Users,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    loginHint: 'parent@hvezda.cz',
    capabilities: [
      { icon: Calendar, text: 'Kalendář — kdy má dítě trénink nebo zápas' },
      { icon: CheckCircle2, text: 'RSVP za dítě — potvrdí účast na 2 kliknutí' },
      { icon: CreditCard, text: 'Platby — vidí jen své (rozvedení rodiče: oddělené)' },
      { icon: MessageSquare, text: 'Zprávy — čte oznámení, píše trenérovi' },
      { icon: Lock, text: 'Privacy — nevidí DM druhého rodiče s trenérem' },
    ],
  },
];

/* ── Feature showcase items ─── */

const FEATURES = [
  {
    title: 'Kalendář & RSVP',
    desc: 'Měsíční i týdenní pohled. Barevné rozlišení typů událostí. RSVP na 2 kliknutí.',
    icon: Calendar,
    mock: {
      type: 'events',
      items: [
        { type: 'PRACTICE', label: 'Trénink U13', time: 'Po 17:30', rsvp: '18/24', color: 'bg-emerald-500' },
        { type: 'MATCH', label: 'Zápas vs. Sparta', time: 'So 10:00', rsvp: '22/24', color: 'bg-amber-500' },
        { type: 'TOURNAMENT', label: 'Jarní turnaj', time: 'Ne 9:00', rsvp: '20/24', color: 'bg-blue-500' },
      ],
    },
  },
  {
    title: 'Správa členů',
    desc: 'Evidence hráčů, trenérů, rodičů. Rodičovské účty s granulárními právy. Rozvedení rodiče — každý vidí jen své.',
    icon: Users,
    mock: {
      type: 'members',
      items: [
        { name: 'Anna P.', role: 'Hráč', badge: 'U13', status: 'active' },
        { name: 'Miroslav H.', role: 'Trenér', badge: 'HEAD', status: 'active' },
        { name: 'Lucie P.', role: 'Rodič', badge: 'MOM', status: 'active' },
      ],
    },
  },
  {
    title: 'Komunikace',
    desc: 'Týmové chaty, DM, oznámení. Žádný WhatsApp chaos. Privacy-by-participation — vidíš jen konverzace, kde jsi účastník.',
    icon: MessageSquare,
    mock: {
      type: 'messages',
      items: [
        { sender: 'Trenér Horák', text: 'Trénink posunut na 15:00', time: '14:32' },
        { sender: 'Vy', text: 'Ok, budeme tam.', time: '14:35' },
      ],
    },
  },
  {
    title: 'Šablony tréninků',
    desc: 'Nastavíte "Po + St 17:30" jednou — události se generují automaticky na celou sezonu.',
    icon: Repeat,
    mock: {
      type: 'template',
      days: ['Po', 'St'],
      time: '17:30–19:00',
      generated: '32 událostí',
    },
  },
];

/* ── Privacy showcase ─── */

const PRIVACY_EXAMPLES = [
  { icon: Eye, label: 'Maminka vidí', items: ['DM s trenérem', 'Platby za Annu', 'RSVP za Annu'] },
  { icon: EyeOff, label: 'Tatínek nevidí', items: ['DM maminky s trenérem', 'Platby (nemá oprávnění)', 'Lékařské záznamy'] },
];

function PublicClubContent() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery<PublicClubData, ApiError>({
    queryKey: ['public-club', slug],
    queryFn: () => apiFetch<PublicClubData>(`/clubs/public/${slug}`),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="h-12 w-64 mx-auto" />
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h1 className="text-lg font-bold">Klub nenalezen</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Stránka klubu neexistuje nebo byla odstraněna.
        </p>
        <Button variant="outline" size="sm" className="mt-6" asChild>
          <Link href="/login">Přihlásit se</Link>
        </Button>
      </div>
    );
  }

  const primary = data.theme.primary;

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg px-6 py-3">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg text-white" style={{ backgroundColor: primary }}>
              <Trophy className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">{data.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Přihlásit se
            </Link>
            <Link href="/signup" className="rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm hover:shadow-md transition-all" style={{ backgroundColor: primary }}>
              Vyzkoušet zdarma
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-20 text-center" style={{ backgroundColor: primary + '08' }}>
        <div className="pointer-events-none absolute inset-0 dot-grid opacity-30" />
        <div className="relative mx-auto max-w-2xl">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg" style={{ backgroundColor: primary }}>
            <Trophy className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{data.name}</h1>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {data.memberCount} členů
            </span>
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" />
              {data.teams.length} {data.teams.length === 1 ? 'tým' : data.teams.length < 5 ? 'týmy' : 'týmů'}
            </span>
          </div>
          <p className="mt-4 text-muted-foreground">
            Kompletní správa klubu — kalendář, docházka, komunikace, platby.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <Button size="lg" className="shadow-md" style={{ backgroundColor: primary }} asChild>
              <Link href="/signup">
                Zaregistrovat se <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">Přihlásit se</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Teams */}
      <section className="border-t border-border/50 px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <SectionLabel>Týmy</SectionLabel>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.teams.map((team) => (
              <Card key={team.id} className="hover-lift">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: primary }}>
                    {team.ageGroup ?? team.sport.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{team.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {team.sport}{team.ageGroup && ` · ${team.ageGroup}`} · {team.season}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role showcase */}
      <section className="border-t border-border/50 px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <SectionLabel>Co vidí každá role</SectionLabel>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">Přístup šitý na míru</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Každý uživatel vidí jen to, co potřebuje. Trenér plánuje, rodič RSVPuje, admin řídí.
          </p>
          <div className="space-y-4">
            {ROLES.map((r) => (
              <Card key={r.role} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3 border-b border-border/30 px-5 py-4">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${r.bg}`}>
                      <r.icon className={`h-4 w-4 ${r.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{r.role}</div>
                      <div className="text-xs text-muted-foreground font-mono">{r.loginHint}</div>
                    </div>
                    <Badge variant="outline" className="text-[11px]">heslo123</Badge>
                  </div>
                  <div className="grid gap-0 sm:grid-cols-2 lg:grid-cols-3">
                    {r.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-start gap-2.5 border-b border-border/20 px-5 py-3 last:border-0 sm:border-r sm:last:border-r-0">
                        <cap.icon className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                        <span className="text-xs leading-relaxed text-muted-foreground">{cap.text}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Feature showcase */}
      <section className="border-t border-border/50 px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <SectionLabel>Funkce</SectionLabel>
          <h2 className="text-2xl font-semibold tracking-tight mb-8">Jak to vypadá uvnitř</h2>
          <div className="space-y-6">
            {FEATURES.map((f) => (
              <Card key={f.title} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    {/* Info */}
                    <div className="flex-1 p-6">
                      <div className="flex items-center gap-2.5 mb-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                          <f.icon className="h-4 w-4 text-primary" />
                        </div>
                        <h3 className="text-base font-semibold">{f.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                    {/* Mock preview */}
                    <div className="border-t lg:border-t-0 lg:border-l border-border/30 bg-muted/30 p-5 lg:w-[320px] shrink-0">
                      <FeatureMock mock={f.mock} primary={primary} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy showcase */}
      <section className="border-t border-border/50 px-6 py-14">
        <div className="mx-auto max-w-4xl">
          <SectionLabel>Privacy</SectionLabel>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">Rozvedení rodiče? Vyřešeno.</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Každý rodič má vlastní oprávnění. Žádné úniky informací mezi rodiči.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {PRIVACY_EXAMPLES.map((ex) => (
              <Card key={ex.label} className="overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ex.icon className={`h-4 w-4 ${ex.label.includes('nevidí') ? 'text-red-400' : 'text-emerald-500'}`} />
                    <span className="text-sm font-semibold">{ex.label}</span>
                  </div>
                  <ul className="space-y-2">
                    {ex.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                        {ex.label.includes('nevidí') ? (
                          <XCircle className="h-3.5 w-3.5 text-red-400/60 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/60 shrink-0" />
                        )}
                        {item}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Try it CTA */}
      <section className="border-t border-border/50 px-6 py-16 text-center">
        <div className="mx-auto max-w-md">
          <h2 className="text-2xl font-semibold tracking-tight">Vyzkoušejte si to</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Přihlaste se jako admin, trenér nebo rodič — každý vidí jiný pohled.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {ROLES.map((r) => (
              <Link
                key={r.loginHint}
                href="/login"
                className={`inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-4 py-2 text-xs font-medium transition-all hover:shadow-md hover:-translate-y-0.5 ${r.bg} ${r.color}`}
              >
                <r.icon className="h-3.5 w-3.5" />
                {r.role}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Heslo pro všechny: <code className="rounded bg-muted px-1.5 py-0.5 font-mono">heslo123</code>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-8 text-center text-xs text-muted-foreground">
        Powered by{' '}
        <Link href="/" className="text-primary hover:underline">Sport Manager</Link>
      </footer>
    </div>
  );
}

/* ── Helpers ─── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">{children}</p>
  );
}

function FeatureMock({ mock, primary }: { mock: any; primary: string }) {
  if (mock.type === 'events') {
    return (
      <div className="space-y-2">
        {mock.items.map((item: any) => (
          <div key={item.label} className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-card p-2.5">
            <div className={`h-8 w-1 rounded-full ${item.color}`} />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{item.label}</div>
              <div className="text-[11px] text-muted-foreground">{item.time}</div>
            </div>
            <Badge variant="outline" className="text-[11px] shrink-0">{item.rsvp}</Badge>
          </div>
        ))}
      </div>
    );
  }
  if (mock.type === 'members') {
    return (
      <div className="space-y-2">
        {mock.items.map((item: any) => (
          <div key={item.name} className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-card p-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: primary }}>
              {item.name.split(' ').map((n: string) => n[0]).join('')}
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium">{item.name}</div>
              <div className="text-[11px] text-muted-foreground">{item.role}</div>
            </div>
            <Badge variant="outline" className="text-[10px]">{item.badge}</Badge>
          </div>
        ))}
      </div>
    );
  }
  if (mock.type === 'messages') {
    return (
      <div className="space-y-2.5">
        {mock.items.map((item: any, i: number) => (
          <div key={i} className={`rounded-lg p-2.5 text-xs ${item.sender === 'Vy' ? 'bg-primary/10 ml-6 text-right' : 'bg-card border border-border/50 mr-6'}`}>
            <div className="font-medium text-[11px] mb-0.5" style={item.sender !== 'Vy' ? { color: primary } : {}}>{item.sender}</div>
            <div className="text-muted-foreground">{item.text}</div>
            <div className="text-[10px] text-muted-foreground/50 mt-1">{item.time}</div>
          </div>
        ))}
      </div>
    );
  }
  if (mock.type === 'template') {
    return (
      <div className="rounded-lg border border-border/50 bg-card p-4 text-center">
        <div className="flex justify-center gap-1.5 mb-3">
          {mock.days.map((d: string) => (
            <span key={d} className="rounded-md px-2.5 py-1 text-xs font-semibold text-white" style={{ backgroundColor: primary }}>{d}</span>
          ))}
        </div>
        <div className="text-sm font-medium">{mock.time}</div>
        <div className="text-[11px] text-muted-foreground mt-1">
          <Repeat className="inline h-3 w-3 mr-1" />
          {mock.generated}
        </div>
      </div>
    );
  }
  return null;
}
