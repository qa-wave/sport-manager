'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  HeartPulse,
  Plus,
  Repeat,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { LibraryTabs } from '@/components/admin/library-tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  apiFetch,
  type ExerciseListResponse,
  type ExerciseDto,
  type StrategyListResponse,
  type StrategyDto,
  type TrainingTemplateListItem,
} from '@/lib/api';
import { useMemberContext } from '@/lib/member-context';

type RecentItem = {
  href: string;
  title: string;
  meta: string;
  source: 'BUILTIN' | 'CUSTOM' | null;
  updatedAt: string;
};

export default function LibraryOverviewPage() {
  const { data: memberCtx } = useMemberContext();
  const enabled = !!memberCtx;

  const trainingQuery = useQuery({
    queryKey: ['exercises', 'TRAINING'],
    queryFn: () => apiFetch<ExerciseListResponse>(`/exercises?type=TRAINING`),
    enabled,
    staleTime: 60_000,
  });

  const physioQuery = useQuery({
    queryKey: ['exercises', 'PHYSIO'],
    queryFn: () => apiFetch<ExerciseListResponse>(`/exercises?type=PHYSIO`),
    enabled,
    staleTime: 60_000,
  });

  const strategyQuery = useQuery({
    queryKey: ['strategies'],
    queryFn: () => apiFetch<StrategyListResponse>(`/strategies`),
    enabled,
    staleTime: 60_000,
  });

  const templateQuery = useQuery({
    queryKey: ['training-templates'],
    queryFn: () =>
      apiFetch<{ templates: TrainingTemplateListItem[] }>(`/training-templates`),
    enabled,
    staleTime: 60_000,
  });

  const trainingCount = trainingQuery.data?.exercises.length ?? null;
  const physioCount = physioQuery.data?.exercises.length ?? null;
  const strategyCount = strategyQuery.data?.strategies.length ?? null;
  const templateCount = templateQuery.data?.templates.length ?? null;

  const recent = buildRecent(
    trainingQuery.data?.exercises,
    physioQuery.data?.exercises,
    strategyQuery.data?.strategies,
  );

  const stats = [
    {
      href: '/admin/treninky',
      label: 'Tréninky',
      icon: Repeat,
      count: trainingCount,
      accent: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      href: '/admin/fyzio',
      label: 'Fyzio',
      icon: HeartPulse,
      count: physioCount,
      accent: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      href: '/admin/training-templates',
      label: 'Šablony',
      icon: BookOpen,
      count: templateCount,
      accent: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
    },
    {
      href: '/admin/library/strategies',
      label: 'Strategie',
      icon: ScrollText,
      count: strategyCount,
      accent: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        subtitle="Centrální knihovna tréninků, fyzio cviků, šablon a taktických strategií."
      />
      <LibraryTabs />

      {/* Statistiky 4 oblastí */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.href} href={s.href as never} className="group">
              <Card className="hover-lift transition-shadow border-border/60 group-hover:border-primary/40 h-full">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`rounded-lg ${s.bg} p-2.5 ${s.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      {s.label}
                    </div>
                    <div className="mt-0.5 text-2xl font-bold">
                      {s.count !== null ? s.count : '—'}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Rychlé akce
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction href="/admin/exercises/new?type=TRAINING" icon={Repeat} label="Nový trénink" />
          <QuickAction href="/admin/exercises/new?type=PHYSIO" icon={HeartPulse} label="Nový fyzio cvik" />
          <QuickAction href="/admin/training-templates/new" icon={BookOpen} label="Nová šablona" />
          <QuickAction href="/admin/library/strategies/new" icon={ScrollText} label="Nová strategie" />
        </div>
      </section>

      {/* Nedávno přidané */}
      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Nedávno přidané
          </h2>
          <Card>
            <CardContent className="divide-y divide-border/30 p-0">
              {recent.map((item, i) => (
                <Link key={i} href={item.href as never} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-primary/[0.03]">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium truncate">{item.title}</span>
                      {item.source === 'BUILTIN' && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                          Builtin
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{item.meta}</div>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted-foreground/70">
                    {formatRelative(item.updatedAt)}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </section>
      )}

      {/* Tip */}
      <Card className="border-dashed bg-muted/20">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-sm text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Tip:</strong> Library kombinuje{' '}
            <span className="text-foreground">BUILTIN</span> obsah (sdílený napříč
            kluby) s <span className="text-foreground">CUSTOM</span> obsahem (vlastní
            klubu). Vlastní položky můžete editovat nebo smazat, builtin jsou jen ke
            čtení.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Plus;
  label: string;
}) {
  return (
    <Link href={href as never}>
      <Card className="group transition-all hover:border-primary/40 hover:shadow-sm">
        <CardContent className="p-3 flex items-center gap-2">
          <Plus className="h-3.5 w-3.5 text-primary" />
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{label}</span>
        </CardContent>
      </Card>
    </Link>
  );
}

function buildRecent(
  training: ExerciseDto[] | undefined,
  physio: ExerciseDto[] | undefined,
  strategies: StrategyDto[] | undefined,
): RecentItem[] {
  const items: RecentItem[] = [];
  for (const e of training ?? []) {
    items.push({
      href: `/admin/exercises/${e.id}/edit`,
      title: e.name,
      meta: `Trénink · ${e.categoryName ?? 'bez kategorie'}`,
      source: e.source,
      updatedAt: e.updatedAt,
    });
  }
  for (const e of physio ?? []) {
    items.push({
      href: `/admin/fyzio/${e.id}`,
      title: e.name,
      meta: `Fyzio · ${e.categoryName ?? 'bez kategorie'}`,
      source: e.source,
      updatedAt: e.updatedAt,
    });
  }
  for (const s of strategies ?? []) {
    items.push({
      href: `/admin/library/strategies/${s.id}`,
      title: s.name,
      meta: `Strategie · ${categoryLabel(s.category)}`,
      source: s.source,
      updatedAt: s.updatedAt,
    });
  }
  items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  return items.slice(0, 8);
}

function categoryLabel(c: string): string {
  switch (c) {
    case 'OFFENSE': return 'Útok';
    case 'DEFENSE': return 'Obrana';
    case 'TRANSITION': return 'Přechod';
    case 'SET_PIECE': return 'Standardka';
    case 'SPECIAL': return 'Speciální';
    default: return c;
  }
}

function formatRelative(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'právě teď';
  if (mins < 60) return `před ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `před ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `před ${days} d`;
  return new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
}
