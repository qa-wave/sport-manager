'use client';

import { useState, useMemo, useCallback, type DragEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Clock, Users, GripVertical, CalendarPlus, ChevronLeft, ChevronRight, X, PlayCircle, BookOpen, Repeat, Plus } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { LibraryTabs } from '@/components/admin/library-tabs';
import { DrillDiagram } from '@/components/admin/drill-diagram';
import { EmptyState } from '@/components/admin/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { apiFetch, ApiError, type TeamSummary, type EventSummary, type TrainingTemplateListItem } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import {
  DRILLS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  AGE_GROUP_LABELS,
  filterDrills,
  formatAgeGroups,
  getPrimaryAgeGroup,
  type DrillCategory,
  type Difficulty,
  type AgeGroup,
  type Sport,
  type Drill,
} from '@/lib/training-library';
import { DAYS_CS, EVENT_TYPE_LABEL } from '@/lib/event-labels';

type PageView = 'library' | 'recurring';

const AGE_GROUPS: AgeGroup[] = ['U7', 'U9', 'U11', 'U13', 'U15', 'U17', 'senior'];
const SPORTS: { value: Sport; label: string }[] = [
  { value: 'fotbal', label: 'Fotbal' },
  { value: 'florbal', label: 'Florbal' },
  { value: 'universal', label: 'Univerzální' },
];

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 - 20:00

const DAY_LABELS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatShortDate(d: Date): string {
  return `${d.getDate()}. ${d.getMonth() + 1}.`;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

function DayBadges({ days }: { days: number[] }) {
  const sorted = [...days].sort((a, b) => a - b);
  return (
    <div className="flex flex-wrap gap-1">
      {sorted.map((d) => (
        <span
          key={d}
          className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary"
        >
          {DAY_LABELS[d]}
        </span>
      ))}
    </div>
  );
}

export default function TrainingLibraryPage() {
  const [view, setView] = useState<PageView>('library');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DrillCategory | undefined>();
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();
  const [ageGroup, setAgeGroup] = useState<AgeGroup | undefined>();
  const [sport, setSport] = useState<Sport | undefined>();
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [weekStart, setWeekStart] = useState(() => getMonday(new Date()));

  const filtered = useMemo(
    () => filterDrills({ category, difficulty, ageGroup, sport, search: search || undefined }),
    [category, difficulty, ageGroup, sport, search],
  );

  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    DRILLS.forEach(d => { map[d.category] = (map[d.category] ?? 0) + 1; });
    return map;
  }, []);

  return (
    <>
      <LibraryTabs />
      <PageHeader
        title={view === 'library' ? 'Knihovna tréninků' : 'Opakované tréninky'}
        subtitle={
          view === 'library'
            ? `${DRILLS.length} cvičení — přetáhněte do kalendáře`
            : 'Pravidelné šablony pro automatické generování tréninků'
        }
        actions={
          <div className="flex items-center gap-2">
            {/* Segmented control */}
            <div className="flex items-center rounded-lg border border-border bg-muted p-0.5 gap-0.5">
              <button
                onClick={() => setView('library')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  view === 'library'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Knihovna
              </button>
              <button
                onClick={() => setView('recurring')}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  view === 'recurring'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Repeat className="h-3.5 w-3.5" />
                Opakované
              </button>
            </div>

            {view === 'library' && (
              <>
                <Button size="sm" variant="outline" asChild>
                  <Link href={'/admin/exercises/new?type=TRAINING' as never}>
                    <Plus className="mr-1 h-4 w-4" />
                    Vlastní drill
                  </Link>
                </Button>
                <Button
                  variant={plannerOpen ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setPlannerOpen(!plannerOpen)}
                >
                  <CalendarPlus className="mr-1.5 h-4 w-4" />
                  {plannerOpen ? 'Zavřít plánovač' : 'Otevřít plánovač'}
                </Button>
              </>
            )}
            {view === 'recurring' && (
              <Button size="sm" asChild>
                <Link href="/admin/training-templates/new">
                  <Plus className="mr-1 h-4 w-4" />Nová šablona
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {view === 'library' ? (
        <div className={`flex gap-6 ${plannerOpen ? '' : ''}`}>
          {/* Left: Library */}
          <div className={`${plannerOpen ? 'w-1/2 min-w-0' : 'w-full'} space-y-4 transition-all`}>
            {/* Category pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setCategory(undefined)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                  !category ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'
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
                  {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]} ({categoryStats[cat] ?? 0})
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[180px]">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Hledat..." className="pl-8 h-8 text-xs" />
              </div>
              <select value={difficulty ?? ''} onChange={e => setDifficulty((e.target.value || undefined) as Difficulty | undefined)} className="h-8 rounded-lg border border-input bg-background px-2 text-xs">
                <option value="">Náročnost</option>
                <option value="easy">Začátečník</option>
                <option value="medium">Pokročilý</option>
                <option value="hard">Expert</option>
              </select>
              <select value={ageGroup ?? ''} onChange={e => setAgeGroup((e.target.value || undefined) as AgeGroup | undefined)} className="h-8 rounded-lg border border-input bg-background px-2 text-xs">
                <option value="">Věk</option>
                {AGE_GROUPS.map(ag => <option key={ag} value={ag}>{AGE_GROUP_LABELS[ag]}</option>)}
              </select>
              <select value={sport ?? ''} onChange={e => setSport((e.target.value || undefined) as Sport | undefined)} className="h-8 rounded-lg border border-input bg-background px-2 text-xs">
                <option value="">Sport</option>
                {SPORTS.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="text-3xl mb-3">🔍</div>
                  <p className="text-sm font-semibold">Žádné cvičení</p>
                </CardContent>
              </Card>
            ) : (
              <div className={`grid gap-2 ${plannerOpen ? 'grid-cols-1 lg:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
                {filtered.map((drill, i) => (
                  <DrillCard key={drill.id} drill={drill} index={i} compact={plannerOpen} />
                ))}
              </div>
            )}
          </div>

          {/* Right: Planner calendar */}
          {plannerOpen && (
            <div className="w-1/2 min-w-0 sticky top-20">
              <WeekPlanner weekStart={weekStart} onWeekChange={setWeekStart} />
            </div>
          )}
        </div>
      ) : (
        <RecurringTemplatesList />
      )}
    </>
  );
}

// ─── Recurring Templates List ───

function RecurringTemplatesList() {
  const auth = useAuth();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery<TrainingTemplateListItem[], ApiError>({
    queryKey: ['training-templates', auth.clubId],
    queryFn: () => apiFetch<TrainingTemplateListItem[]>('/training-templates'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    retry: false,
  });

  if (!auth.isAuthenticated) {
    return (
      <EmptyState
        icon={Repeat}
        title="Přihlaste se pro zobrazení šablon"
        description="Vyžaduje přihlášenou session."
        cta={
          <Button asChild size="sm">
            <Link href="/login">Přihlásit se</Link>
          </Button>
        }
      />
    );
  }

  if (isLoading) {
    return (
      <Card>
        <div className="p-4 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="ml-auto h-5 w-16" />
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <div className="p-4 text-sm text-destructive">Nepodařilo se načíst šablony.</div>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={Repeat}
        title="Žádné opakované tréninky"
        description="Vytvořte první šablonu pro automatické generování pravidelných tréninků."
        cta={
          <Button asChild size="sm">
            <Link href="/admin/training-templates/new">
              <Plus className="mr-1 h-4 w-4" />Nová šablona
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 hover:bg-transparent">
            <TableHead className="text-[11px] uppercase tracking-wider">Název</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider">Tým</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider">Dny</TableHead>
            <TableHead className="text-[11px] uppercase tracking-wider">Čas</TableHead>
            <TableHead className="w-24 text-[11px] uppercase tracking-wider">Platnost</TableHead>
            <TableHead className="w-20 text-center text-[11px] uppercase tracking-wider">Události</TableHead>
            <TableHead className="w-20 text-[11px] uppercase tracking-wider">Stav</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((tpl) => (
            <TableRow
              key={tpl.id}
              className="group cursor-pointer border-border/30 transition-colors hover:bg-primary/[0.03]"
              onClick={() => router.push(`/admin/training-templates/${tpl.id}`)}
            >
              <TableCell>
                <div className="font-semibold text-sm transition-colors group-hover:text-primary">
                  {tpl.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {EVENT_TYPE_LABEL[tpl.eventType] ?? tpl.eventType}
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {tpl.teamName}
              </TableCell>
              <TableCell>
                <DayBadges days={tpl.daysOfWeek} />
              </TableCell>
              <TableCell className="font-mono tabular-nums text-xs text-muted-foreground">
                {tpl.startTime}–{tpl.endTime}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                <div>{formatDate(tpl.validFrom)}</div>
                <div>{formatDate(tpl.validUntil)}</div>
              </TableCell>
              <TableCell className="text-center">
                <div className="text-sm font-bold">{tpl.upcomingEventsCount}</div>
                <div className="text-[11px] text-muted-foreground">
                  {tpl.generatedEventsCount} celkem
                </div>
              </TableCell>
              <TableCell>
                {tpl.active ? (
                  <Badge variant="success">Aktivní</Badge>
                ) : (
                  <Badge variant="default">Pozastaveno</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ─── Draggable Drill Card ───

function DrillCard({ drill, index, compact }: { drill: Drill; index: number; compact: boolean }) {
  const primaryAgeGroup = getPrimaryAgeGroup(drill);
  const ageLabel = drill.ageGroups.length > 1
    ? `${AGE_GROUP_LABELS[primaryAgeGroup]} +${drill.ageGroups.length - 1}`
    : AGE_GROUP_LABELS[primaryAgeGroup];

  function handleDragStart(e: DragEvent) {
    e.dataTransfer.setData('application/drill-id', drill.id);
    e.dataTransfer.setData('text/plain', drill.name);
    e.dataTransfer.effectAllowed = 'copy';
  }

  if (compact) {
    return (
      <div
        draggable
        onDragStart={handleDragStart}
        className="group flex items-center gap-3 rounded-lg border border-border/50 bg-card p-2.5 cursor-grab active:cursor-grabbing hover:shadow-md hover:border-primary/30 transition-all"
      >
        <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-primary/60" />
        <div className="text-lg">{CATEGORY_ICONS[drill.category]}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold truncate">{drill.name}</div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>{drill.durationMin} min</span>
            <span>{ageLabel}</span>
            <span>{DIFFICULTY_LABELS[drill.difficulty]}</span>
          </div>
        </div>
        <Link href={`/admin/treninky/${drill.id}` as any} onClick={e => e.stopPropagation()} className="text-[11px] text-primary hover:underline shrink-0">
          Detail
        </Link>
      </div>
    );
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="group cursor-grab active:cursor-grabbing"
    >
      <Link href={`/admin/treninky/${drill.id}` as any}>
        <Card className="h-full overflow-hidden hover-lift" style={{ animationDelay: `${Math.min(index, 8) * 30}ms` }}>
          <CardContent className="p-0">
            <DrillDiagram drillId={drill.id} category={drill.category} compact className="border-b border-border/30" />
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex flex-wrap gap-1.5">
                  <Badge className={`text-[11px] ${DIFFICULTY_COLORS[drill.difficulty]}`}>
                    {DIFFICULTY_LABELS[drill.difficulty]}
                  </Badge>
                  <Badge variant="outline" className="text-[11px]">
                    {ageLabel}
                  </Badge>
                </div>
                <GripVertical className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary/50" />
              </div>
              <h3 className="text-sm font-semibold mb-1.5 group-hover:text-primary transition-colors">{drill.name}</h3>
              <div className="flex items-center gap-1.5 mb-3">
                <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[drill.category]}`}>{CATEGORY_LABELS[drill.category]}</Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">{drill.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{drill.durationMin} min</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" />{drill.playersMin}–{drill.playersMax}</span>
                <span className="flex items-center gap-1"><PlayCircle className="h-3 w-3" />video</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

// ─── Week Planner (drop target) ───

function WeekPlanner({ weekStart, onWeekChange }: { weekStart: Date; onWeekChange: (d: Date) => void }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [dropTarget, setDropTarget] = useState<{ day: number; hour: number } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState<{ drill: Drill; date: Date } | null>(null);
  const [selectedTeam, setSelectedTeam] = useState('');

  // Fetch teams for the dialog
  const teams = useQuery<TeamSummary[]>({
    queryKey: ['teams', auth.clubId],
    queryFn: () => apiFetch<TeamSummary[]>('/teams'),
    enabled: auth.isAuthenticated && !!auth.clubId,
  });

  // Fetch existing events for the week
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const events = useQuery<EventSummary[]>({
    queryKey: ['events', 'planner', auth.clubId, weekStart.toISOString()],
    queryFn: () => apiFetch<EventSummary[]>(`/events?from=${weekStart.toISOString()}&to=${weekEnd.toISOString()}`),
    enabled: auth.isAuthenticated && !!auth.clubId,
  });

  const createEvent = useMutation({
    mutationFn: (body: any) => apiFetch('/events', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setShowCreateDialog(null);
    },
  });

  function handleDrop(e: DragEvent, dayIndex: number, hour: number) {
    e.preventDefault();
    setDropTarget(null);
    const drillId = e.dataTransfer.getData('application/drill-id');
    const drill = DRILLS.find(d => d.id === drillId);
    if (!drill) return;

    const date = new Date(weekStart);
    date.setDate(date.getDate() + dayIndex);
    date.setHours(hour, 0, 0, 0);

    setShowCreateDialog({ drill, date });
  }

  function handleDragOver(e: DragEvent, dayIndex: number, hour: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDropTarget({ day: dayIndex, hour });
  }

  function confirmCreate() {
    if (!showCreateDialog) return;
    const { drill, date } = showCreateDialog;
    const endDate = new Date(date);
    endDate.setMinutes(endDate.getMinutes() + drill.durationMin);

    createEvent.mutate({
      type: 'PRACTICE',
      title: drill.name,
      description: `${drill.description}\n\nVěk: ${formatAgeGroups(drill.ageGroups)}\n\n📋 Postup:\n${drill.instructions.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n💡 Coaching points:\n${drill.coachingPoints.map(p => `• ${p}`).join('\n')}`,
      startsAt: date.toISOString(),
      endsAt: endDate.toISOString(),
      teamId: selectedTeam || undefined,
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div className="space-y-3">
      {/* Week nav */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() - 7); onWeekChange(d); }}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold">
          {formatShortDate(weekStart)} — {formatShortDate(new Date(weekStart.getTime() + 6 * 86400000))}
        </div>
        <Button variant="ghost" size="sm" onClick={() => { const d = new Date(weekStart); d.setDate(d.getDate() + 7); onWeekChange(d); }}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="grid grid-cols-[40px_repeat(7,1fr)] min-w-[500px]">
            {/* Header */}
            <div className="border-b border-border/30 p-1" />
            {DAYS_CS.map((day, i) => {
              const d = new Date(weekStart);
              d.setDate(d.getDate() + i);
              const isToday = d.getTime() === today.getTime();
              return (
                <div key={i} className={`border-b border-l border-border/30 p-1.5 text-center ${isToday ? 'bg-primary/5' : ''}`}>
                  <div className="text-[10px] text-muted-foreground">{day.slice(0, 2)}</div>
                  <div className={`text-xs font-semibold ${isToday ? 'text-primary' : ''}`}>{d.getDate()}</div>
                </div>
              );
            })}

            {/* Time slots */}
            {HOURS.map(hour => (
              <>
                <div key={`h${hour}`} className="border-b border-border/20 p-1 text-[10px] text-muted-foreground text-right pr-2">
                  {hour}:00
                </div>
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const isDrop = dropTarget?.day === dayIndex && dropTarget?.hour === hour;
                  // Check for existing events in this slot
                  const slotDate = new Date(weekStart);
                  slotDate.setDate(slotDate.getDate() + dayIndex);
                  slotDate.setHours(hour);
                  const slotEvents = events.data?.filter(ev => {
                    const evDate = new Date(ev.startsAt);
                    return evDate.getDate() === slotDate.getDate() &&
                      evDate.getMonth() === slotDate.getMonth() &&
                      evDate.getHours() === hour;
                  }) ?? [];

                  return (
                    <div
                      key={`${hour}-${dayIndex}`}
                      className={`border-b border-l border-border/20 min-h-[28px] transition-colors relative ${
                        isDrop ? 'bg-primary/10 ring-1 ring-primary/30 ring-inset' : 'hover:bg-muted/30'
                      }`}
                      onDragOver={e => handleDragOver(e, dayIndex, hour)}
                      onDragLeave={() => setDropTarget(null)}
                      onDrop={e => handleDrop(e, dayIndex, hour)}
                    >
                      {slotEvents.map(ev => (
                        <div
                          key={ev.id}
                          className="absolute inset-x-0.5 top-0.5 rounded bg-primary/20 px-1 py-0.5 text-[9px] font-medium text-primary truncate cursor-pointer hover:bg-primary/30"
                          onClick={() => router.push(`/admin/events/${ev.id}`)}
                        >
                          {ev.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center">
        Přetáhněte trénink z knihovny do kalendáře
      </p>

      {/* Create event dialog */}
      {showCreateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in" onClick={() => setShowCreateDialog(null)}>
          <Card className="w-full max-w-md mx-4 animate-scale-in" onClick={e => e.stopPropagation()}>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-semibold">Naplánovat trénink</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {showCreateDialog.drill.name}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowCreateDialog(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarPlus className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {showCreateDialog.date.toLocaleDateString('cs-CZ', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {showCreateDialog.date.getHours()}:00 — {showCreateDialog.date.getHours() + Math.ceil(showCreateDialog.drill.durationMin / 60)}:{(showCreateDialog.drill.durationMin % 60).toString().padStart(2, '0')}
                  <span className="text-[11px]">({showCreateDialog.drill.durationMin} min)</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tým (volitelné)</label>
                <select
                  value={selectedTeam}
                  onChange={e => setSelectedTeam(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm"
                >
                  <option value="">Bez týmu</option>
                  {teams.data?.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => setShowCreateDialog(null)}>Zrušit</Button>
                <Button size="sm" onClick={confirmCreate} disabled={createEvent.isPending} className="bg-gradient-brand">
                  {createEvent.isPending ? 'Vytvářím...' : 'Vytvořit událost'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
