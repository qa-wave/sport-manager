'use client';

/**
 * Month-grid calendar view for events.
 *
 * Layout: 7 columns (Mon–Sun) × 6 rows. Leading/trailing days from
 * adjacent months are rendered dimmed so the grid is always rectangular.
 *
 * Each day cell shows a date number and up to N event chips. Extra events
 * collapse to a "+N more" pill. Clicking a chip navigates to the event
 * detail page. Today is highlighted with the brand ring.
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { EventSummary } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const MONTH_NAMES = [
  'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
  'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec',
];

const EVENT_TYPE_BG: Record<string, string> = {
  PRACTICE: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
  MATCH: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400',
  TOURNAMENT: 'bg-primary/15 text-primary border-primary/30',
  MEETING: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
  SOCIAL: 'bg-pink-500/15 text-pink-600 border-pink-500/30 dark:text-pink-400',
};

const EVENT_TYPE_DOT: Record<string, string> = {
  PRACTICE: 'bg-emerald-500',
  MATCH: 'bg-amber-500',
  TOURNAMENT: 'bg-primary',
  MEETING: 'bg-emerald-500',
  SOCIAL: 'bg-pink-500',
};

type CalendarDay = {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  events: EventSummary[];
};

/** Build a 42-day grid starting on Monday for the given month. */
function buildGrid(year: number, month: number, events: EventSummary[]): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const jsWeekday = firstOfMonth.getDay(); // 0 Sun, 1 Mon ...
  // Offset so Monday is column 0
  const offset = (jsWeekday + 6) % 7;
  const gridStart = new Date(year, month, 1 - offset);

  // Bucket events by yyyy-mm-dd
  const byDay = new Map<string, EventSummary[]>();
  for (const e of events) {
    const d = new Date(e.startsAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (!byDay.has(key)) byDay.set(key, []);
    byDay.get(key)!.push(e);
  }

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

  const cells: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    cells.push({
      date: d,
      inMonth: d.getMonth() === month,
      isToday: key === todayKey,
      events: (byDay.get(key) ?? []).sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    });
  }
  return cells;
}

function formatEventTime(d: string): string {
  return new Date(d).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

export function EventCalendar({
  year,
  month,
  events,
  onPrev,
  onNext,
  onToday,
}: {
  year: number;
  month: number; // 0-indexed
  events: EventSummary[];
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const grid = useMemo(() => buildGrid(year, month, events), [year, month, events]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrev} aria-label="Previous month">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="min-w-[180px] text-center text-lg font-bold">
            {MONTH_NAMES[month]} {year}
          </h3>
          <Button variant="outline" size="sm" onClick={onNext} aria-label="Next month">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={onToday}>
          Dnes
        </Button>
      </div>

      {/* Grid */}
      <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
        {/* Weekday header */}
        <div className="grid grid-cols-7 border-b border-border/50 bg-muted/30">
          {WEEKDAYS.map((w) => (
            <div
              key={w}
              className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
            >
              {w}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {grid.map((cell, idx) => (
            <DayCell key={idx} cell={cell} isLastRow={idx >= 35} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DayCell({ cell, isLastRow }: { cell: CalendarDay; isLastRow: boolean }) {
  const visibleEvents = cell.events.slice(0, 3);
  const moreCount = cell.events.length - visibleEvents.length;

  return (
    <div
      className={cn(
        'min-h-[110px] border-r border-border/40 p-1.5 transition-colors',
        !isLastRow && 'border-b',
        !cell.inMonth && 'bg-muted/20',
        cell.isToday && 'bg-primary/5',
      )}
    >
      {/* Day number */}
      <div className="mb-1 flex items-center justify-between">
        <span
          className={cn(
            'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
            cell.isToday
              ? 'bg-primary text-primary-foreground'
              : cell.inMonth
                ? 'text-foreground'
                : 'text-muted-foreground/50',
          )}
        >
          {cell.date.getDate()}
        </span>
        {cell.events.length > 0 && (
          <span className="text-[10px] font-medium text-muted-foreground/60">
            {cell.events.length}
          </span>
        )}
      </div>

      {/* Events */}
      <div className="space-y-1">
        {visibleEvents.map((event) => (
          <Link
            key={event.id}
            href={`/admin/events/${event.id}`}
            className={cn(
              'block truncate rounded border px-1.5 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80',
              EVENT_TYPE_BG[event.type] ?? 'border-border bg-muted text-foreground',
              !cell.inMonth && 'opacity-50',
            )}
            title={`${formatEventTime(event.startsAt)} · ${event.title}`}
          >
            <span className="flex items-center gap-1">
              <span
                className={cn(
                  'inline-block h-1.5 w-1.5 shrink-0 rounded-full',
                  EVENT_TYPE_DOT[event.type] ?? 'bg-foreground',
                )}
              />
              <span className="tabular-nums opacity-80">
                {formatEventTime(event.startsAt)}
              </span>
              <span className="truncate">{event.title}</span>
            </span>
          </Link>
        ))}
        {moreCount > 0 && (
          <div className="px-1.5 text-[10px] font-medium text-muted-foreground">
            + {moreCount} další
          </div>
        )}
      </div>
    </div>
  );
}
