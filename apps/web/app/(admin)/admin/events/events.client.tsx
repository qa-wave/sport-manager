'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CalendarRange, ChevronDown, ChevronLeft, ChevronRight, LayoutList, MapPin, Plus, Trash2, Users, X } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/empty-state';
import { EventCalendar } from '@/components/admin/event-calendar';
import { apiFetch, ApiError, type EventSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext, isAdmin, isCoach } from '@/lib/member-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/* ── Date helpers ─────────────────────────────────── */

function dayNum(d: string): string {
  return new Date(d).getDate().toString();
}

function weekdayShort(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase();
}

function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

function monthYear(d: string): string {
  return new Date(d).toLocaleDateString('cs-CZ', { month: 'long', year: 'numeric' });
}

function isToday(d: string): boolean {
  const now = new Date();
  const date = new Date(d);
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function isTomorrow(d: string): boolean {
  const now = new Date();
  const tmrw = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const date = new Date(d);
  return (
    date.getDate() === tmrw.getDate() &&
    date.getMonth() === tmrw.getMonth() &&
    date.getFullYear() === tmrw.getFullYear()
  );
}

/** Returns the Monday of the ISO week containing `date`. */
function getWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = (day + 6) % 7; // distance back to Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Adds `n` days to `date`, returning a new Date. */
function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/* ── Grouping ─────────────────────────────────────── */

type EventGroup = { label: string; events: EventSummary[] };

function groupByMonth(events: EventSummary[]): EventGroup[] {
  const groups = new Map<string, EventSummary[]>();
  for (const event of events) {
    const key = monthYear(event.startsAt);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(event);
  }
  return Array.from(groups).map(([label, evts]) => ({ label, events: evts }));
}

/* ── RSVP display ─────────────────────────────────── */

const EVENT_BORDER_COLOR: Record<string, string> = {
  PRACTICE: 'border-l-emerald-500',
  MATCH: 'border-l-amber-500',
  TOURNAMENT: 'border-l-blue-500',
  MEETING: 'border-l-violet-500',
  SOCIAL: 'border-l-pink-500',
};

const EVENT_BG_COLOR: Record<string, string> = {
  PRACTICE: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
  MATCH: 'bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-400',
  TOURNAMENT: 'bg-blue-500/15 border-blue-500/30 text-blue-700 dark:text-blue-400',
  MEETING: 'bg-violet-500/15 border-violet-500/30 text-violet-700 dark:text-violet-400',
  SOCIAL: 'bg-pink-500/15 border-pink-500/30 text-pink-700 dark:text-pink-400',
};

const EVENT_TYPE_LABEL: Record<string, string> = {
  PRACTICE: 'Trénink',
  MATCH: 'Zápas',
  TOURNAMENT: 'Turnaj',
  MEETING: 'Schůzka',
  SOCIAL: 'Akce',
};

const CZECH_WEEKDAYS_LONG = ['Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota', 'Neděle'];
const CZECH_WEEKDAYS_SHORT = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

const WEEK_HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8–21

function RsvpBadge({ summary }: { summary: EventSummary['rsvpSummary'] }) {
  const total = summary.yes + summary.maybe + summary.no + summary.pending;
  if (total === 0) {
    return (
      <span className="text-xs text-muted-foreground/60">Bez RSVP</span>
    );
  }
  if (summary.pending > 0 && summary.pending >= summary.yes) {
    return (
      <span className="rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-500">
        RSVP?
      </span>
    );
  }
  return (
    <span className="rounded-md bg-emerald-500/15 px-2.5 py-1 text-xs font-bold text-emerald-500">
      {summary.yes} jde
    </span>
  );
}

/* ── Week view ────────────────────────────────────── */

function WeekView({
  weekStart,
  events,
  onPrev,
  onNext,
  onToday,
}: {
  weekStart: Date;
  events: EventSummary[];
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const router = useRouter();
  const today = new Date();

  // Build array of 7 day Date objects (Mon–Sun)
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Range label for header: "5. – 11. května 2026" etc.
  const weekEnd = days[6];
  const rangeLabel = (() => {
    const startDay = weekStart.getDate();
    const endDay = weekEnd.getDate();
    const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
    const startStr = weekStart.toLocaleDateString('cs-CZ', { day: 'numeric', month: sameMonth ? undefined : 'long' });
    const endStr = weekEnd.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
    return `${startStr} – ${endStr}`;
  })();

  // Index events by day column
  const eventsByDay: EventSummary[][] = days.map((day) =>
    events
      .filter((e) => isSameDay(new Date(e.startsAt), day))
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
  );

  /**
   * Calculate top offset (%) and height (%) within the grid for an event.
   * Grid covers 8:00–22:00 = 14 hours total.
   */
  const GRID_START_HOUR = 8;
  const GRID_TOTAL_HOURS = 14; // 8–22

  function eventGeometry(event: EventSummary) {
    const start = new Date(event.startsAt);
    const end = event.endsAt ? new Date(event.endsAt) : new Date(start.getTime() + 60 * 60 * 1000);
    const startMinutes = (start.getHours() - GRID_START_HOUR) * 60 + start.getMinutes();
    const endMinutes = (end.getHours() - GRID_START_HOUR) * 60 + end.getMinutes();
    const totalMinutes = GRID_TOTAL_HOURS * 60;
    const top = Math.max(0, (startMinutes / totalMinutes) * 100);
    const height = Math.max(2, ((endMinutes - startMinutes) / totalMinutes) * 100);
    return { top, height };
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Navigation header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-label="Předchozí týden"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={onNext}
            className="flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-card text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            aria-label="Následující týden"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={onToday}
            className="ml-1 rounded-md border border-border/60 bg-card px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            Dnes
          </button>
        </div>
        <span className="text-sm font-medium text-foreground">{rangeLabel}</span>
      </div>

      {/* Desktop: 7-column time grid */}
      <div className="hidden overflow-hidden rounded-xl border border-border/50 bg-card md:block">
        {/* Day headers */}
        <div className="grid border-b border-border/40" style={{ gridTemplateColumns: '3rem repeat(7, 1fr)' }}>
          {/* Time gutter header */}
          <div className="border-r border-border/40" />
          {days.map((day, i) => {
            const todayCol = isSameDay(day, today);
            return (
              <div
                key={i}
                className={cn(
                  'flex flex-col items-center justify-center py-2 text-center text-xs font-medium',
                  i < 6 && 'border-r border-border/40',
                  todayCol && 'bg-primary/5',
                )}
              >
                <span className={cn('text-[11px] uppercase tracking-wider', todayCol ? 'text-primary' : 'text-muted-foreground')}>
                  {CZECH_WEEKDAYS_SHORT[i]}
                </span>
                <span
                  className={cn(
                    'mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold',
                    todayCol ? 'bg-primary text-primary-foreground' : 'text-foreground',
                  )}
                >
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Time grid body */}
        <div
          className="relative"
          style={{ gridTemplateColumns: '3rem repeat(7, 1fr)' }}
        >
          {/* Row grid: time labels + day columns */}
          <div className="grid" style={{ gridTemplateColumns: '3rem repeat(7, 1fr)' }}>
            {/* Time labels column */}
            <div className="flex flex-col border-r border-border/40">
              {WEEK_HOURS.map((h) => (
                <div
                  key={h}
                  className="flex h-14 shrink-0 items-start justify-end pr-2 pt-1 text-[10px] text-muted-foreground/50"
                >
                  {h}:00
                </div>
              ))}
            </div>

            {/* Day columns */}
            {days.map((day, colIdx) => {
              const todayCol = isSameDay(day, today);
              const colEvents = eventsByDay[colIdx];
              return (
                <div
                  key={colIdx}
                  className={cn(
                    'relative',
                    colIdx < 6 && 'border-r border-border/40',
                    todayCol && 'bg-primary/[0.03]',
                  )}
                >
                  {/* Hour lines */}
                  {WEEK_HOURS.map((h) => (
                    <div
                      key={h}
                      className="h-14 border-b border-border/20 last:border-b-0"
                    />
                  ))}

                  {/* Events positioned absolutely */}
                  {colEvents.map((event) => {
                    const { top, height } = eventGeometry(event);
                    const colorClass = EVENT_BG_COLOR[event.type] ?? 'bg-muted/30 border-border text-foreground';
                    return (
                      <button
                        key={event.id}
                        onClick={() => router.push(`/admin/events/${event.id}`)}
                        className={cn(
                          'absolute inset-x-0.5 overflow-hidden rounded border px-1.5 py-1 text-left text-[11px] leading-tight transition-opacity hover:opacity-80',
                          colorClass,
                        )}
                        style={{
                          top: `${top}%`,
                          height: `${height}%`,
                          minHeight: '1.5rem',
                        }}
                        title={event.title}
                      >
                        <div className="truncate font-semibold">
                          {event.title}
                        </div>
                        <div className="truncate opacity-80">
                          {formatTime(event.startsAt)}
                          {event.endsAt ? ` – ${formatTime(event.endsAt)}` : ''}
                        </div>
                        <div className="mt-0.5 flex items-center gap-0.5 opacity-70">
                          <Users className="h-2.5 w-2.5 shrink-0" />
                          <span>{event.rsvpSummary.yes}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile: vertical day list */}
      <div className="flex flex-col gap-4 md:hidden">
        {days.map((day, i) => {
          const todayCol = isSameDay(day, today);
          const colEvents = eventsByDay[i];
          return (
            <div key={i} className="rounded-xl border border-border/50 bg-card overflow-hidden">
              {/* Day header */}
              <div
                className={cn(
                  'flex items-center gap-2 border-b border-border/40 px-3 py-2',
                  todayCol && 'bg-primary/5',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold',
                    todayCol ? 'bg-primary text-primary-foreground' : 'text-foreground',
                  )}
                >
                  {day.getDate()}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium',
                    todayCol ? 'text-primary' : 'text-foreground',
                  )}
                >
                  {CZECH_WEEKDAYS_LONG[i]}
                </span>
                {todayCol && (
                  <span className="ml-auto rounded-full bg-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
                    Dnes
                  </span>
                )}
              </div>

              {/* Events or empty message */}
              {colEvents.length === 0 ? (
                <div className="px-3 py-3 text-xs text-muted-foreground/50">Žádné události</div>
              ) : (
                <div className="divide-y divide-border/30">
                  {colEvents.map((event) => {
                    const colorClass = EVENT_BG_COLOR[event.type] ?? 'bg-muted/20 text-foreground';
                    return (
                      <button
                        key={event.id}
                        onClick={() => router.push(`/admin/events/${event.id}`)}
                        className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/30"
                      >
                        <span
                          className={cn(
                            'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold border',
                            colorClass,
                          )}
                        >
                          {EVENT_TYPE_LABEL[event.type] ?? event.type}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium">{event.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(event.startsAt)}
                            {event.endsAt ? ` – ${formatTime(event.endsAt)}` : ''}
                            {event.location ? ` · ${event.location}` : ''}
                          </div>
                        </div>
                        <div className="shrink-0 flex items-center gap-0.5 text-xs text-muted-foreground/70 pt-0.5">
                          <Users className="h-3 w-3" />
                          <span>{event.rsvpSummary.yes}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────── */

export default function EventsPage() {
  const auth = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const queryClient = useQueryClient();
  const { data: memberCtx } = useMemberContext();
  const canCreate = memberCtx ? (isAdmin(memberCtx) || isCoach(memberCtx)) : false;
  const canBulkDelete = memberCtx ? (isAdmin(memberCtx) || isCoach(memberCtx)) : false;

  // Bulk selection state
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  function toggleEvent(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(ids: string[]) {
    setSelected((prev) => {
      if (ids.every((id) => prev.has(id))) {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...prev, ...ids]);
    });
  }

  async function handleBulkDelete() {
    setIsDeleting(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          apiFetch(`/events/${id}`, { method: 'DELETE' }),
        ),
      );
      await queryClient.invalidateQueries({ queryKey: ['events'] });
      setSelected(new Set());
      setConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  }

  const rawView = search.get('view');
  const view: 'list' | 'calendar' | 'week' =
    rawView === 'calendar' ? 'calendar' : rawView === 'week' ? 'week' : 'list';

  // Calendar view: fetch a month at a time
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  // Week view: Monday of the current week
  const [weekStart, setWeekStart] = useState<Date>(() => getWeekMonday(new Date()));

  // List view: from today onwards
  const listQuery = useQuery<EventSummary[], ApiError>({
    queryKey: ['events', 'list', auth.clubId],
    queryFn: () => apiFetch<EventSummary[]>(`/events?from=${new Date().toISOString()}`),
    enabled: auth.isAuthenticated && !!auth.clubId && view === 'list',
    retry: false,
  });

  // Calendar view: fetch the 6-week window covering the current month grid
  const calendarQuery = useQuery<EventSummary[], ApiError>({
    queryKey: ['events', 'cal', auth.clubId, cursor.year, cursor.month],
    queryFn: () => {
      const first = new Date(cursor.year, cursor.month, 1);
      const jsWeekday = first.getDay();
      const offset = (jsWeekday + 6) % 7;
      const from = new Date(cursor.year, cursor.month, 1 - offset);
      const to = new Date(from);
      to.setDate(from.getDate() + 42);
      return apiFetch<EventSummary[]>(
        `/events?from=${from.toISOString()}&to=${to.toISOString()}`,
      );
    },
    enabled: auth.isAuthenticated && !!auth.clubId && view === 'calendar',
    retry: false,
  });

  // Week view: fetch the 7-day window
  const weekEnd = addDays(weekStart, 7);
  const weekQuery = useQuery<EventSummary[], ApiError>({
    queryKey: ['events', 'week', auth.clubId, weekStart.toISOString()],
    queryFn: () =>
      apiFetch<EventSummary[]>(
        `/events?from=${weekStart.toISOString()}&to=${weekEnd.toISOString()}`,
      ),
    enabled: auth.isAuthenticated && !!auth.clubId && view === 'week',
    retry: false,
  });

  const data =
    view === 'calendar' ? calendarQuery.data : view === 'week' ? weekQuery.data : listQuery.data;
  const isLoading =
    view === 'calendar'
      ? calendarQuery.isLoading
      : view === 'week'
        ? weekQuery.isLoading
        : listQuery.isLoading;
  const isError =
    view === 'calendar'
      ? calendarQuery.isError
      : view === 'week'
        ? weekQuery.isError
        : listQuery.isError;

  const groups = useMemo(
    () => (view === 'list' && data ? groupByMonth(data) : []),
    [view, data],
  );

  return (
    <>
      <PageHeader
        title="Události"
        subtitle="Nadcházející program a RSVP"
        actions={
          <div className="flex items-center gap-2">
            <ViewToggle view={view} />
            {canCreate && (
              <Button size="sm" asChild>
                <Link href="/admin/events/new">
                  <Plus className="mr-1 h-4 w-4" />Nová událost
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {!auth.isAuthenticated ? (
        <EmptyState
          icon={CalendarDays}
          title="Přihlaste se pro zobrazení událostí"
          description="Vyžaduje přihlášenou relaci."
          cta={
            <Button asChild size="sm">
              <Link href="/login">Přihlásit se</Link>
            </Button>
          }
        />
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-xl border border-border/50 bg-card p-4">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Nepodařilo se načíst události
          </CardContent>
        </Card>
      ) : view === 'calendar' ? (
        <EventCalendar
          year={cursor.year}
          month={cursor.month}
          events={data ?? []}
          onPrev={() =>
            setCursor((c) =>
              c.month === 0
                ? { year: c.year - 1, month: 11 }
                : { year: c.year, month: c.month - 1 },
            )
          }
          onNext={() =>
            setCursor((c) =>
              c.month === 11
                ? { year: c.year + 1, month: 0 }
                : { year: c.year, month: c.month + 1 },
            )
          }
          onToday={() => {
            const d = new Date();
            setCursor({ year: d.getFullYear(), month: d.getMonth() });
          }}
        />
      ) : view === 'week' ? (
        <WeekView
          weekStart={weekStart}
          events={data ?? []}
          onPrev={() => setWeekStart((ws) => addDays(ws, -7))}
          onNext={() => setWeekStart((ws) => addDays(ws, 7))}
          onToday={() => setWeekStart(getWeekMonday(new Date()))}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Žádné nadcházející události"
          description="Naplánujte svou první událost a začněte."
          cta={canCreate ? (
            <Button asChild size="sm">
              <Link href="/admin/events/new">
                <Plus className="mr-1 h-4 w-4" />Nová událost
              </Link>
            </Button>
          ) : undefined}
        />
      ) : (
        <>
          {/* Bulk action bar */}
          {canBulkDelete && selected.size > 0 && (
            <div className="sticky top-2 z-10 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 shadow-md backdrop-blur">
              <span className="text-sm font-medium text-destructive">
                Vybráno: {selected.size} {selected.size === 1 ? 'událost' : selected.size < 5 ? 'události' : 'událostí'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => { setSelected(new Set()); setConfirmDelete(false); }}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Zrušit výběr
                </Button>
                {!confirmDelete ? (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" />
                    Smazat vybrané ({selected.size})
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-destructive font-medium">Opravdu smazat {selected.size} {selected.size === 1 ? 'událost' : selected.size < 5 ? 'události' : 'událostí'}?</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setConfirmDelete(false)}
                      disabled={isDeleting}
                    >
                      Ne
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleBulkDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? 'Mažu...' : 'Ano, smazat'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-8">
            {groups.map((group) => {
              const groupIds = group.events.map((e) => e.id);
              const allGroupSelected = canBulkDelete && groupIds.length > 0 && groupIds.every((id) => selected.has(id));

              return (
                <div key={group.label}>
                  <div className="mb-3 flex items-center gap-3">
                    {canBulkDelete && (
                      <input
                        type="checkbox"
                        checked={allGroupSelected}
                        onChange={() => toggleAll(groupIds)}
                        className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-primary"
                        title="Vybrat vše v měsíci"
                      />
                    )}
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      {group.label}
                    </h3>
                    <div className="h-px flex-1 bg-border/50" />
                  </div>
                  <div className="space-y-3">
                    {group.events.map((event) => {
                      const isMatch = event.type === 'MATCH' || event.type === 'TOURNAMENT';
                      const isSelected = selected.has(event.id);

                      return (
                        <div
                          key={event.id}
                          className={cn(
                            'group overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-200 border-l-[3px]',
                            EVENT_BORDER_COLOR[event.type] ?? 'border-l-border',
                            isSelected
                              ? 'border-destructive/40 bg-destructive/5'
                              : 'cursor-pointer hover:border-primary/40 hover:shadow-md',
                          )}
                          onClick={(e) => {
                            // If clicking the checkbox area, don't navigate
                            if ((e.target as HTMLElement).closest('[data-checkbox]')) return;
                            if (canBulkDelete && selected.size > 0) {
                              toggleEvent(event.id);
                              return;
                            }
                            router.push(`/admin/events/${event.id}`);
                          }}
                        >
                          <div className="flex items-stretch">
                            {/* Checkbox column */}
                            {canBulkDelete && (
                              <div
                                data-checkbox="1"
                                className="flex w-10 shrink-0 items-center justify-center border-r border-border/20 cursor-pointer"
                                onClick={(e) => { e.stopPropagation(); toggleEvent(event.id); }}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleEvent(event.id)}
                                  className="h-3.5 w-3.5 cursor-pointer accent-primary"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}

                            {/* Date column */}
                            <div className="flex w-[72px] shrink-0 flex-col items-center justify-center border-r border-border/30 py-4">
                              <span className="text-2xl font-bold leading-none">
                                {dayNum(event.startsAt)}
                              </span>
                              <span className="mt-0.5 text-[11px] font-medium tracking-wider text-muted-foreground">
                                {weekdayShort(event.startsAt)}
                              </span>
                              <span className="mt-1.5 text-xs font-semibold text-primary">
                                {formatTime(event.startsAt)}
                              </span>
                              {isToday(event.startsAt) && (
                                <span className="mt-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[11px] font-bold text-primary">
                                  DNES
                                </span>
                              )}
                              {isTomorrow(event.startsAt) && (
                                <span className="mt-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary/70">
                                  ZÍTRA
                                </span>
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3">
                              <div className="min-w-0 flex-1">
                                {/* Event type / title */}
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold uppercase tracking-wide transition-colors group-hover:text-primary">
                                    {isMatch ? event.title : EVENT_TYPE_LABEL[event.type] ?? event.type}
                                  </span>
                                  {event.homeAway && (
                                    <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                      {event.homeAway}
                                    </span>
                                  )}
                                </div>

                                {/* Team + member count */}
                                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {event.rsvpSummary.total}
                                  </span>
                                  {event.teamName ? (
                                    <span className="font-medium text-primary/70">
                                      {event.teamName}
                                    </span>
                                  ) : (
                                    <span className="text-amber-500/70">Celý klub</span>
                                  )}
                                </div>

                                {/* Location */}
                                {event.location && (
                                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/60">
                                    <MapPin className="h-3 w-3 shrink-0" />
                                    <span className="truncate">{event.location}</span>
                                  </div>
                                )}
                              </div>

                              {/* RSVP status */}
                              <div className="shrink-0 text-right">
                                <RsvpBadge summary={event.rsvpSummary} />
                                {!isSelected && (
                                  <div className="mt-1.5 flex items-center justify-end gap-0.5 text-[11px] text-muted-foreground/40 transition-colors group-hover:text-primary/50">
                                    <span>Detail</span>
                                    <ChevronDown className="h-3 w-3 -rotate-90" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

/* ── View toggle ─────────────────────────────────── */

function ViewToggle({ view }: { view: 'list' | 'calendar' | 'week' }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-border/60 bg-card">
      <Link
        href="/admin/events"
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium transition-colors',
          view === 'list'
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:bg-muted/50',
        )}
      >
        <LayoutList className="h-3.5 w-3.5" />
        Seznam
      </Link>
      <Link
        href="/admin/events?view=week"
        className={cn(
          'flex items-center gap-1.5 border-l border-border/60 px-2.5 py-1.5 text-xs font-medium transition-colors',
          view === 'week'
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:bg-muted/50',
        )}
      >
        <CalendarRange className="h-3.5 w-3.5" />
        Týden
      </Link>
      <Link
        href="/admin/events?view=calendar"
        className={cn(
          'flex items-center gap-1.5 border-l border-border/60 px-2.5 py-1.5 text-xs font-medium transition-colors',
          view === 'calendar'
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:bg-muted/50',
        )}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        Měsíc
      </Link>
    </div>
  );
}
