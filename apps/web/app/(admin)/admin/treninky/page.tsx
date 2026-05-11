'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Filter, Clock, Users, Dumbbell } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { DrillDiagram } from '@/components/admin/drill-diagram';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DRILLS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  filterDrills,
  type DrillCategory,
  type Difficulty,
  type AgeGroup,
  type Sport,
  type Drill,
} from '@/lib/training-library';

const AGE_GROUPS: AgeGroup[] = ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'senior'];
const SPORTS: { value: Sport; label: string }[] = [
  { value: 'fotbal', label: 'Fotbal' },
  { value: 'florbal', label: 'Florbal' },
  { value: 'universal', label: 'Univerzální' },
];

export default function TrainingLibraryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DrillCategory | undefined>();
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();
  const [ageGroup, setAgeGroup] = useState<AgeGroup | undefined>();
  const [sport, setSport] = useState<Sport | undefined>();

  const filtered = useMemo(
    () => filterDrills({ category, difficulty, ageGroup, sport, search: search || undefined }),
    [category, difficulty, ageGroup, sport, search],
  );

  // Stats
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    DRILLS.forEach(d => { map[d.category] = (map[d.category] ?? 0) + 1; });
    return map;
  }, []);

  return (
    <>
      <PageHeader
        title="Knihovna tréninků"
        subtitle={`${DRILLS.length} cvičení pro trenéry — vyberte, upravte, použijte`}
      />

      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategory(undefined)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
            !category
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Vše ({DRILLS.length})
        </button>
        {(Object.keys(CATEGORY_LABELS) as DrillCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(category === cat ? undefined : cat)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              category === cat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : `${CATEGORY_COLORS[cat]} hover:opacity-80`
            }`}
          >
            <span>{CATEGORY_ICONS[cat]}</span>
            {CATEGORY_LABELS[cat]}
            <span className="opacity-60">({categoryStats[cat] ?? 0})</span>
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Hledat cvičení..."
            className="pl-9 h-9"
          />
        </div>
        <select
          value={difficulty ?? ''}
          onChange={e => setDifficulty((e.target.value || undefined) as Difficulty | undefined)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
        >
          <option value="">Náročnost</option>
          <option value="easy">Začátečník</option>
          <option value="medium">Pokročilý</option>
          <option value="hard">Expert</option>
        </select>
        <select
          value={ageGroup ?? ''}
          onChange={e => setAgeGroup((e.target.value || undefined) as AgeGroup | undefined)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
        >
          <option value="">Kategorie</option>
          {AGE_GROUPS.map(ag => (
            <option key={ag} value={ag}>{ag === 'senior' ? 'Senior' : ag}</option>
          ))}
        </select>
        <select
          value={sport ?? ''}
          onChange={e => setSport((e.target.value || undefined) as Sport | undefined)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-xs"
        >
          <option value="">Sport</option>
          {SPORTS.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center animate-fade-up">
            <div className="mb-4 text-4xl">🔍</div>
            <p className="text-sm font-semibold">Žádné cvičení nenalezeno</p>
            <p className="mt-1 text-xs text-muted-foreground">Zkuste upravit filtry nebo vyhledávání.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((drill, i) => (
            <DrillCard key={drill.id} drill={drill} index={i} />
          ))}
        </div>
      )}
    </>
  );
}

function DrillCard({ drill, index }: { drill: Drill; index: number }) {
  return (
    <Link href={`/admin/treninky/${drill.id}` as any}>
      <Card
        className="group h-full overflow-hidden hover-lift cursor-pointer"
        style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}
      >
        <CardContent className="p-0">
          {/* Diagram thumbnail */}
          <DrillDiagram drillId={drill.id} category={drill.category} compact className="border-b border-border/30" />
          <div className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <Badge className={`text-[11px] ${DIFFICULTY_COLORS[drill.difficulty]}`}>
              {DIFFICULTY_LABELS[drill.difficulty]}
            </Badge>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold mb-1.5 group-hover:text-primary transition-colors">
            {drill.name}
          </h3>

          {/* Category + sport badge */}
          <div className="flex items-center gap-1.5 mb-3">
            <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[drill.category]}`}>
              {CATEGORY_LABELS[drill.category]}
            </Badge>
            {drill.sport !== 'universal' && (
              <Badge variant="outline" className="text-[10px]">
                {drill.sport === 'fotbal' ? '⚽' : '🏑'} {drill.sport}
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
            {drill.description}
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {drill.durationMin} min
            </span>
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {drill.playersMin}–{drill.playersMax}
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="h-3 w-3" />
              {drill.ageGroups.slice(0, 3).join(', ')}{drill.ageGroups.length > 3 ? '+' : ''}
            </span>
          </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
