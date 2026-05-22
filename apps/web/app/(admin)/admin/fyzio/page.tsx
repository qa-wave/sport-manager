'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, Clock, Plus, HeartPulse, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { LibraryTabs } from '@/components/admin/library-tabs';
import { EmptyState } from '@/components/admin/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch, type ExerciseDto } from '@/lib/api';
import { useMemberContext } from '@/lib/member-context';
import {
  PHYSIO_EXERCISES,
  PHYSIO_CATEGORIES,
  PHYSIO_CATEGORY_LABELS,
  PHYSIO_CATEGORY_COLORS,
  PHYSIO_CATEGORY_ICONS,
  BODY_AREAS,
  BODY_AREA_LABELS,
  PHYSIO_TYPES,
  PHYSIO_TYPE_LABELS,
  PHYSIO_EQUIPMENT,
  PHYSIO_EQUIPMENT_LABELS,
  filterPhysioExercises,
  type PhysioCategory,
  type BodyArea,
  type PhysioType,
  type PhysioEquipment,
} from '@/lib/physio-library';

type UnifiedItem =
  | {
      kind: 'builtin';
      id: string;
      name: string;
      description: string;
      categorySlug: PhysioCategory;
      categoryLabel: string;
      categoryColor: string;
      icon: string;
      durationMin: number;
      bodyAreas: BodyArea[];
      equipment: string[];
      imageUrl?: string;
    }
  | {
      kind: 'custom';
      id: string;
      name: string;
      description: string;
      categorySlug: string | null;
      categoryLabel: string;
      categoryColor: string;
      icon: string;
      durationMin: number | null;
      bodyAreas: string[];
      equipment: string[];
      imageUrl?: string;
    };

export default function FyzioPage() {
  const { data: memberCtx } = useMemberContext();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<PhysioCategory | 'all'>('all');
  const [bodyArea, setBodyArea] = useState<BodyArea | 'all'>('all');
  const [physioType, setPhysioType] = useState<PhysioType | 'all'>('all');
  const [equipment, setEquipment] = useState<PhysioEquipment | 'all'>('all');

  const canEdit =
    !!memberCtx &&
    (memberCtx.clubRoles.includes('OWNER') ||
      memberCtx.clubRoles.includes('ADMIN') ||
      memberCtx.teamRoles.some((tr) => tr.role === 'HEAD_COACH'));

  const customQuery = useQuery({
    queryKey: ['exercises', 'physio'],
    queryFn: () =>
      apiFetch<{ exercises: ExerciseDto[] }>(`/exercises?type=PHYSIO`),
    enabled: !!memberCtx,
    staleTime: 30_000,
  });

  const builtinFiltered = useMemo(
    () =>
      filterPhysioExercises({
        category: activeCategory,
        bodyArea,
        type: physioType,
        equipment,
        search,
      }),
    [activeCategory, bodyArea, physioType, equipment, search],
  );

  const customFiltered = useMemo(() => {
    const rows = customQuery.data?.exercises ?? [];
    return rows.filter((ex) => {
      if (activeCategory !== 'all') {
        // Custom exercises store their own slug — if the user picked a built-in category,
        // only match when the custom category slug equals it.
        if ((ex.categorySlug ?? '') !== activeCategory) return false;
      }
      if (bodyArea !== 'all' && !ex.bodyAreas.includes(bodyArea)) return false;
      if (physioType !== 'all' && ex.physioType !== physioType) return false;
      if (equipment !== 'all' && !ex.equipment.includes(equipment)) return false;
      if (search) {
        const q = search.toLowerCase();
        const hay = `${ex.name} ${ex.description ?? ''} ${ex.tags.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [customQuery.data, activeCategory, bodyArea, physioType, equipment, search]);

  const items: UnifiedItem[] = useMemo(() => {
    const builtins: UnifiedItem[] = builtinFiltered.map((b) => ({
      kind: 'builtin',
      id: b.id,
      name: b.name,
      description: b.description,
      categorySlug: b.category,
      categoryLabel: PHYSIO_CATEGORY_LABELS[b.category],
      categoryColor: PHYSIO_CATEGORY_COLORS[b.category],
      icon: b.icon,
      durationMin: b.durationMin,
      bodyAreas: b.bodyAreas,
      equipment: b.equipment.map((e) => PHYSIO_EQUIPMENT_LABELS[e] ?? e),
      imageUrl: b.imageUrl,
    }));
    const customs: UnifiedItem[] = customFiltered.map((c) => {
      const matchedCategory =
        c.categorySlug && (PHYSIO_CATEGORIES as string[]).includes(c.categorySlug)
          ? (c.categorySlug as PhysioCategory)
          : undefined;
      return {
        kind: 'custom',
        id: c.id,
        name: c.name,
        description: c.description ?? '',
        categorySlug: c.categorySlug,
        categoryLabel: c.categoryName ?? (matchedCategory ? PHYSIO_CATEGORY_LABELS[matchedCategory] : 'Vlastní'),
        categoryColor: matchedCategory
          ? PHYSIO_CATEGORY_COLORS[matchedCategory]
          : 'bg-muted text-muted-foreground',
        icon: c.icon ?? '💪',
        durationMin: c.durationMinutes,
        bodyAreas: c.bodyAreas,
        equipment: c.equipment,
        imageUrl: c.imageUrls[0],
      };
    });
    return [...customs, ...builtins];
  }, [builtinFiltered, customFiltered]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const c of PHYSIO_CATEGORIES) counts[c] = 0;
    for (const it of items) {
      const key = String(it.categorySlug ?? 'all');
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [items]);

  return (
    <div className="space-y-6">
      <LibraryTabs />
      <PageHeader
        title="Fyzio"
        subtitle="Mobilita, core, prevence a regenerace — knihovna fyzio cviků a vlastní cviky klubu."
        actions={
          canEdit ? (
            <Button asChild>
              <Link href={'/admin/exercises/new?type=PHYSIO' as never}>
                <Plus className="h-4 w-4 mr-2" />
                Vytvořit cvik
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
        {PHYSIO_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {PHYSIO_CATEGORY_ICONS[cat]} {PHYSIO_CATEGORY_LABELS[cat]} ({categoryCounts[cat] ?? 0})
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Hledat cvik…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <select
          value={bodyArea}
          onChange={(e) => setBodyArea(e.target.value as BodyArea | 'all')}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">Oblast těla</option>
          {BODY_AREAS.map((b) => (
            <option key={b} value={b}>
              {BODY_AREA_LABELS[b]}
            </option>
          ))}
        </select>
        <select
          value={physioType}
          onChange={(e) => setPhysioType(e.target.value as PhysioType | 'all')}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">Typ</option>
          {PHYSIO_TYPES.map((t) => (
            <option key={t} value={t}>
              {PHYSIO_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
        <select
          value={equipment}
          onChange={(e) => setEquipment(e.target.value as PhysioEquipment | 'all')}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="all">Pomůcky</option>
          {PHYSIO_EQUIPMENT.map((e) => (
            <option key={e} value={e}>
              {PHYSIO_EQUIPMENT_LABELS[e]}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {customQuery.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={HeartPulse}
          title="Žádné cviky"
          description={
            canEdit
              ? 'Vytvořte první vlastní fyzio cvik nebo upravte filtry.'
              : 'Pro tyto filtry nejsou žádné cviky.'
          }
          cta={
            canEdit ? (
              <Button asChild>
                <Link href={'/admin/exercises/new?type=PHYSIO' as never}>
                  <Plus className="h-4 w-4 mr-2" />
                  Vytvořit cvik
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <PhysioCard key={`${item.kind}-${item.id}`} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

function PhysioCard({ item, index }: { item: UnifiedItem; index: number }) {
  const href =
    item.kind === 'custom'
      ? (`/admin/fyzio/${item.id}` as never)
      : (`/admin/fyzio/builtin/${item.id}` as never);

  return (
    <Link href={href}>
      <Card
        className="h-full overflow-hidden hover-lift cursor-pointer"
        style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      >
        <CardContent className="p-0">
          <div className="relative h-32 bg-gradient-to-br from-muted/30 via-muted/50 to-muted/30 flex items-center justify-center border-b border-border/30">
            {item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imageUrl}
                alt={item.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-5xl opacity-60">{item.icon}</span>
            )}
            {item.kind === 'custom' && (
              <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground text-[10px]">
                <Sparkles className="h-2.5 w-2.5 mr-0.5" />
                Klubový
              </Badge>
            )}
          </div>
          <div className="p-4">
            <div className="mb-2">
              <Badge variant="outline" className={`text-[10px] ${item.categoryColor}`}>
                {item.categoryLabel}
              </Badge>
            </div>
            <h3 className="text-sm font-semibold mb-1.5 line-clamp-1">{item.name}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
              {item.description}
            </p>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
              {item.durationMin && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {item.durationMin} min
                </span>
              )}
              {item.bodyAreas.length > 0 && (
                <span className="capitalize">
                  {item.bodyAreas
                    .slice(0, 2)
                    .map((b) => BODY_AREA_LABELS[b as BodyArea] ?? b)
                    .join(', ')}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
