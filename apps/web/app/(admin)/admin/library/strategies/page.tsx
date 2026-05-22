'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  Plus,
  ScrollText,
  Sparkles,
  PlayCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { LibraryTabs } from '@/components/admin/library-tabs';
import { EmptyState } from '@/components/admin/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  apiFetch,
  type StrategyDto,
  type StrategyListResponse,
  type StrategyCategory,
} from '@/lib/api';
import { useMemberContext } from '@/lib/member-context';
import {
  STRATEGY_CATEGORIES,
  STRATEGY_CATEGORY_LABELS,
  STRATEGY_CATEGORY_ICONS,
  STRATEGY_CATEGORY_COLORS,
  STRATEGY_SPORTS,
} from '@/lib/strategy-options';

export default function StrategiesListPage() {
  const { data: memberCtx } = useMemberContext();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<StrategyCategory | 'all'>('all');
  const [sport, setSport] = useState<string>('all');

  const canEdit =
    !!memberCtx &&
    (memberCtx.clubRoles.includes('OWNER') ||
      memberCtx.clubRoles.includes('ADMIN') ||
      memberCtx.teamRoles.some((tr) => tr.role === 'HEAD_COACH'));

  const query = useQuery({
    queryKey: ['strategies'],
    queryFn: () => apiFetch<StrategyListResponse>(`/strategies`),
    enabled: !!memberCtx,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const rows = query.data?.strategies ?? [];
    return rows.filter((s) => {
      if (activeCategory !== 'all' && s.category !== activeCategory) return false;
      if (sport !== 'all' && !s.sports.includes(sport)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay =
          `${s.name} ${s.description ?? ''} ${s.tags.join(' ')} ${s.formation ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [query.data, activeCategory, sport, search]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: query.data?.strategies.length ?? 0 };
    for (const c of STRATEGY_CATEGORIES) counts[c] = 0;
    for (const s of query.data?.strategies ?? []) {
      counts[s.category] = (counts[s.category] ?? 0) + 1;
    }
    return counts;
  }, [query.data]);

  return (
    <div className="space-y-6">
      <LibraryTabs />
      <PageHeader
        title="Strategie"
        subtitle="Taktické herní systémy s animovaným videem. Kdy strategii nasadit, proti čemu funguje a co dělá každá role."
        actions={
          canEdit ? (
            <Button asChild>
              <Link href={'/admin/library/strategies/new' as never}>
                <Plus className="h-4 w-4 mr-2" />
                Vytvořit strategii
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            activeCategory === 'all'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          Vše ({categoryCounts.all ?? 0})
        </button>
        {STRATEGY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {STRATEGY_CATEGORY_ICONS[cat]} {STRATEGY_CATEGORY_LABELS[cat]} ({categoryCounts[cat] ?? 0})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hledat strategii…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <select
          value={sport}
          onChange={(e) => setSport(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">Sport</option>
          {STRATEGY_SPORTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {query.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="Žádné strategie"
          description={
            canEdit
              ? 'Vytvořte první strategii klubu nebo upravte filtry.'
              : 'Pro tyto filtry nejsou žádné strategie.'
          }
          cta={
            canEdit ? (
              <Button asChild>
                <Link href={'/admin/library/strategies/new' as never}>
                  <Plus className="h-4 w-4 mr-2" />
                  Vytvořit strategii
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
            <StrategyCard key={s.id} strategy={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function StrategyCard({ strategy, index }: { strategy: StrategyDto; index: number }) {
  const isCustom = strategy.source === 'CUSTOM';
  return (
    <Link href={`/admin/library/strategies/${strategy.id}` as never}>
      <Card
        className="h-full overflow-hidden hover-lift cursor-pointer"
        style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      >
        <CardContent className="p-0">
          <div className="relative h-32 bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-primary/30 flex items-center justify-center border-b border-border/30">
            {strategy.posterUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={strategy.posterUrl}
                alt={strategy.name}
                className="h-full w-full object-cover"
              />
            ) : strategy.imageUrls[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={strategy.imageUrls[0]}
                alt={strategy.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <ScrollText className="h-12 w-12 text-white/80" strokeWidth={1.5} />
            )}
            {strategy.videoUrl && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors">
                <PlayCircle className="h-10 w-10 text-white/0 hover:text-white/95 transition-colors" />
              </div>
            )}
            {isCustom && (
              <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground text-[10px]">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                Klubová
              </Badge>
            )}
          </div>
          <div className="p-4">
            <div className="mb-2 flex flex-wrap items-center gap-1.5">
              <Badge
                variant="outline"
                className={`text-[10px] border-0 ${STRATEGY_CATEGORY_COLORS[strategy.category]}`}
              >
                {STRATEGY_CATEGORY_ICONS[strategy.category]}{' '}
                {STRATEGY_CATEGORY_LABELS[strategy.category]}
              </Badge>
              {strategy.formation && (
                <Badge variant="outline" className="text-[10px]">
                  {strategy.formation}
                </Badge>
              )}
            </div>
            <h3 className="text-sm font-semibold mb-1.5 line-clamp-1">{strategy.name}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
              {strategy.description ?? strategy.whenToUse ?? '—'}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
              {strategy.roles.length > 0 && (
                <span>{strategy.roles.length} rolí</span>
              )}
              {strategy.sports.length > 0 && (
                <span className="capitalize">{strategy.sports.join(', ')}</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
