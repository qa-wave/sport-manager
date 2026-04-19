'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, ChevronDown, LayoutList, MapPin, Plus, Users } from 'lucide-react';
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
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function monthYear(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
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

const EVENT_TYPE_LABEL: Record<string, string> = {
  PRACTICE: 'Practice',
  MATCH: 'Match',
  TOURNAMENT: 'Tournament',
  MEETING: 'Meeting',
  SOCIAL: 'Social',
};

function RsvpBadge({ summary }: { summary: EventSummary['rsvpSummary'] }) {
  const total = summary.yes + summary.maybe + summary.no + summary.pending;
  if (total === 0) {
    return (
      <span className="text-xs text-muted-foreground/60">No RSVPs</span>
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
      {summary.yes} going
    </span>
  );
}

/* ── Page ─────────────────────────────────────────── */

export default function EventsPage() {
  const auth = useAuth();
  const router = useRouter();
  const search = useSearchParams();
  const { data: memberCtx } = useMemberContext();
  const canCreate = memberCtx ? (isAdmin(memberCtx) || isCoach(memberCtx)) : false;

  const view = search.get('view') === 'calendar' ? 'calendar' : 'list';

  // Calendar view: fetch a month at a time
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

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

  const data = view === 'calendar' ? calendarQuery.data : listQuery.data;
  const isLoading =
    view === 'calendar' ? calendarQuery.isLoading : listQuery.isLoading;
  const isError =
    view === 'calendar' ? calendarQuery.isError : listQuery.isError;

  const groups = useMemo(
    () => (view === 'list' && data ? groupByMonth(data) : []),
    [view, data],
  );

  return (
    <>
      <PageHeader
        title="Events"
        subtitle="Upcoming schedule and RSVPs"
        actions={
          <div className="flex items-center gap-2">
            <ViewToggle view={view} />
            {canCreate && (
              <Button size="sm" asChild>
                <Link href="/admin/events/new">
                  <Plus className="mr-1 h-4 w-4" />Schedule event
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {!auth.isAuthenticated ? (
        <EmptyState
          icon={CalendarDays}
          title="Sign in to see events"
          description="Requires authenticated session."
          cta={
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
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
            Failed to load events
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
      ) : groups.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No upcoming events"
          description="Schedule your first event to get started."
          cta={canCreate ? (
            <Button asChild size="sm">
              <Link href="/admin/events/new">
                <Plus className="mr-1 h-4 w-4" />Schedule event
              </Link>
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h3>
                <div className="h-px flex-1 bg-border/50" />
              </div>
              <div className="space-y-3">
                {group.events.map((event) => {
                  const isMatch = event.type === 'MATCH' || event.type === 'TOURNAMENT';

                  return (
                    <div
                      key={event.id}
                      className={`group cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-[0_0_20px_-6px_hsl(var(--primary)/0.15)] border-l-[3px] ${
                        EVENT_BORDER_COLOR[event.type] ?? 'border-l-border'
                      }`}
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                    >
                      <div className="flex items-stretch">
                        {/* Date column */}
                        <div className="flex w-[72px] shrink-0 flex-col items-center justify-center border-r border-border/30 py-4">
                          <span className="text-2xl font-bold leading-none">
                            {dayNum(event.startsAt)}
                          </span>
                          <span className="mt-0.5 text-[10px] font-medium tracking-wider text-muted-foreground">
                            {weekdayShort(event.startsAt)}
                          </span>
                          <span className="mt-1.5 text-xs font-semibold text-primary">
                            {formatTime(event.startsAt)}
                          </span>
                          {isToday(event.startsAt) && (
                            <span className="mt-1 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                              TODAY
                            </span>
                          )}
                          {isTomorrow(event.startsAt) && (
                            <span className="mt-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary/70">
                              TMRW
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
                                <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
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
                                <span className="text-amber-500/70">Club-wide</span>
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
                            <div className="mt-1.5 flex items-center justify-end gap-0.5 text-[10px] text-muted-foreground/40 transition-colors group-hover:text-primary/50">
                              <span>Details</span>
                              <ChevronDown className="h-3 w-3 -rotate-90" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

/* ── View toggle ─────────────────────────────────── */

function ViewToggle({ view }: { view: 'list' | 'calendar' }) {
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
        List
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
        Calendar
      </Link>
    </div>
  );
}
