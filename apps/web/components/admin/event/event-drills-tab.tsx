'use client';

import { useMemo, useState } from 'react';
import { BookOpen, Clock, Plus, Search, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';
import {
  DRILLS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  DIFFICULTY_LABELS,
  filterDrills,
  type DrillCategory,
  type Difficulty,
  type Drill,
} from '@/lib/training-library';

// ─── Marker helpers ───

const DRILL_MARKER_RE = /<!--\s*drills:\s*([^>]*?)\s*-->/;

function parseDrillIds(description: string): string[] {
  const match = DRILL_MARKER_RE.exec(description);
  if (!match || !match[1]) return [];
  return match[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function updateDrillMarker(description: string, ids: string[]): string {
  const marker = `<!-- drills: ${ids.join(',')} -->`;
  if (DRILL_MARKER_RE.test(description)) {
    return description.replace(DRILL_MARKER_RE, marker);
  }
  return description ? `${description}\n\n${marker}` : marker;
}

// ─── Drill Picker Modal ───

interface DrillPickerModalProps {
  onSelect: (drill: Drill) => void;
  onClose: () => void;
  alreadyAdded: string[];
}

function DrillPickerModal({ onSelect, onClose, alreadyAdded }: DrillPickerModalProps) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DrillCategory | undefined>();
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();

  const filtered = useMemo(
    () => filterDrills({ category, difficulty, search: search || undefined }),
    [category, difficulty, search],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col rounded-xl border border-border bg-background shadow-2xl animate-scale-in max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Vybrat cvičení z knihovny</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="border-b border-border/30 px-5 py-3 space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Hledat cvičení..."
              className="pl-8 h-8 text-xs"
            />
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setCategory(undefined)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
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
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                  category === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : `${CATEGORY_COLORS[cat]} hover:opacity-80`
                }`}
              >
                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {(['', 'easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty((d || undefined) as Difficulty | undefined)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                  difficulty === (d || undefined)
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {d === ''
                  ? 'Všechny'
                  : d === 'easy'
                    ? 'Začátečník'
                    : d === 'medium'
                      ? 'Pokročilý'
                      : 'Expert'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Žádné cvičení</div>
          ) : (
            filtered.map((drill) => {
              const alreadyIn = alreadyAdded.includes(drill.id);
              return (
                <button
                  key={drill.id}
                  disabled={alreadyIn}
                  onClick={() => !alreadyIn && onSelect(drill)}
                  className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                    alreadyIn
                      ? 'border-border/30 bg-muted/30 opacity-50 cursor-not-allowed'
                      : 'border-border/50 bg-card hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <div className="text-xl shrink-0">{CATEGORY_ICONS[drill.category]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate">{drill.name}</span>
                      {alreadyIn && (
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          Přidáno
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${CATEGORY_COLORS[drill.category]}`}
                      >
                        {CATEGORY_LABELS[drill.category]}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {drill.durationMin} min
                      </span>
                      <span>{DIFFICULTY_LABELS[drill.difficulty]}</span>
                    </div>
                  </div>
                  {!alreadyIn && (
                    <Plus className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="border-t border-border/30 px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'cvičení' : 'cvičení'}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Zavřít
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───

interface EventDrillsTabProps {
  eventId: string;
  description: string;
  isCoachOrAdmin: boolean;
  onDescriptionUpdate: (newDesc: string) => void;
}

export function EventDrillsTab({
  eventId,
  description,
  isCoachOrAdmin,
  onDescriptionUpdate,
}: EventDrillsTabProps) {
  const queryClient = useQueryClient();
  const [drillPickerOpen, setDrillPickerOpen] = useState(false);

  const drillIds = useMemo(() => parseDrillIds(description), [description]);
  const plannedDrills = useMemo(
    () => drillIds.map((id) => DRILLS.find((d) => d.id === id)).filter((d): d is Drill => !!d),
    [drillIds],
  );

  const patchMutation = useMutation({
    mutationFn: (newDesc: string) =>
      apiFetch(`/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({ description: newDesc }),
      }),
    onSuccess: (_data, newDesc) => {
      onDescriptionUpdate(newDesc);
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  function addDrill(drill: Drill) {
    const newIds = drillIds.includes(drill.id) ? drillIds : [...drillIds, drill.id];
    const newDesc = updateDrillMarker(description, newIds);
    patchMutation.mutate(newDesc);
    setDrillPickerOpen(false);
  }

  function removeDrill(drillId: string) {
    const newIds = drillIds.filter((id) => id !== drillId);
    const newDesc = updateDrillMarker(description, newIds);
    patchMutation.mutate(newDesc);
  }

  const totalMinutes = plannedDrills.reduce((sum, d) => sum + d.durationMin, 0);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Plán tréninku</CardTitle>
            {plannedDrills.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {plannedDrills.length} cvičení · {totalMinutes} min
              </span>
            )}
          </div>
          {isCoachOrAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDrillPickerOpen(true)}
              disabled={patchMutation.isPending}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Přidat z knihovny
            </Button>
          )}
        </CardHeader>

        {plannedDrills.length === 0 ? (
          <CardContent className="pb-6 pt-0">
            <div className="rounded-lg border border-dashed border-border/60 py-8 text-center">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Žádný plán tréninku</p>
              {isCoachOrAdmin && (
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Přidejte cvičení z knihovny kliknutím na tlačítko výše
                </p>
              )}
            </div>
          </CardContent>
        ) : (
          <CardContent className="pb-4 pt-0 space-y-2">
            {plannedDrills.map((drill, idx) => (
              <div
                key={drill.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {idx + 1}
                </div>
                <div className="text-base">{CATEGORY_ICONS[drill.category]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{drill.name}</span>
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${CATEGORY_COLORS[drill.category]}`}
                    >
                      {CATEGORY_LABELS[drill.category]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {drill.durationMin} min
                    </span>
                    <span>{DIFFICULTY_LABELS[drill.difficulty]}</span>
                  </div>
                </div>
                {isCoachOrAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeDrill(drill.id)}
                    disabled={patchMutation.isPending}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {drillPickerOpen && (
        <DrillPickerModal
          onSelect={addDrill}
          onClose={() => setDrillPickerOpen(false)}
          alreadyAdded={drillIds}
        />
      )}
    </>
  );
}
