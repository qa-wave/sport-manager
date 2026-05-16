'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, CreditCard, X } from 'lucide-react';
import { apiFetch, ApiError, type MemberBadgesResponse, type EventSummary, type ChildDashboardEntry } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ---------- Types ----------

interface MemberStats {
  attendance: {
    total: number;
    attended: number;
    rate: number;
    trend: 'up' | 'down' | 'stable';
    teamAverage: number;
  };
  rsvp: { total: number; onTime: number; reliability: number };
  recentForm: Array<{
    eventTitle: string;
    date: string;
    rsvpStatus: string;
    attended: boolean | null;
  }>;
  streak: number;
}

// ---------- Helpers ----------

function attendanceColor(rate: number): string {
  if (rate >= 80) return 'text-green-600 dark:text-green-400';
  if (rate >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function progressBarColor(rate: number): string {
  if (rate >= 80) return 'bg-green-500';
  if (rate >= 50) return 'bg-amber-500';
  return 'bg-red-500';
}

const RSVP_STATUS_COLOR: Record<string, string> = {
  YES: 'text-green-600 dark:text-green-400',
  NO: 'text-red-600 dark:text-red-400',
  MAYBE: 'text-amber-600 dark:text-amber-400',
  PENDING: 'text-muted-foreground',
};

const EVENT_TYPE_ABBR: Record<string, string> = {
  PRACTICE: 'TRÉ',
  MATCH: 'ZÁP',
  TOURNAMENT: 'TUR',
  MEETING: 'SCH',
  SOCIAL: 'AKC',
};

const EVENT_TYPE_COLOR: Record<string, string> = {
  PRACTICE: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  MATCH: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  TOURNAMENT: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
  MEETING: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
  SOCIAL: 'bg-pink-500/15 text-pink-700 dark:text-pink-400',
};

// ---------- Component ----------

interface ChildProgressCardProps {
  child: ChildDashboardEntry;
}

export function ChildProgressCard({ child }: ChildProgressCardProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const childId = child.childMemberId;

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = useQuery<MemberStats, ApiError>({
    queryKey: ['member-stats', childId, auth.clubId],
    queryFn: () => apiFetch<MemberStats>(`/members/${childId}/stats`),
    enabled: auth.isAuthenticated && !!auth.clubId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch badges
  const { data: badgesData } = useQuery<MemberBadgesResponse, ApiError>({
    queryKey: ['member-badges', childId, auth.clubId],
    queryFn: () => apiFetch<MemberBadgesResponse>(`/members/${childId}/badges`),
    enabled: auth.isAuthenticated && !!auth.clubId,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch upcoming events for child's team (max 3)
  const now = new Date().toISOString();
  const { data: upcomingEvents } = useQuery<EventSummary[], ApiError>({
    queryKey: ['events-upcoming', child.childMemberId, auth.clubId],
    queryFn: () => apiFetch<EventSummary[]>(`/events?from=${now}`),
    enabled: auth.isAuthenticated && !!auth.clubId,
    staleTime: 2 * 60 * 1000,
    select: (events) => events.slice(0, 3),
  });

  // RSVP mutation (on behalf of child)
  const rsvpMutation = useMutation({
    mutationFn: (args: { eventId: string; status: 'YES' | 'NO' }) =>
      apiFetch(`/events/${args.eventId}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({ memberId: childId, status: args.status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard-feed'] });
      queryClient.invalidateQueries({ queryKey: ['events-upcoming', childId] });
    },
  });

  // Recent badges (last 30 days, max 3)
  const recentBadges =
    badgesData?.badges
      .filter((b) => {
        if (!b.earned || !b.earnedAt) return false;
        const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
        return new Date(b.earnedAt).getTime() >= thirtyDaysAgo;
      })
      .slice(0, 3) ?? [];

  // Avatar initials
  const initials = child.name
    .split(' ')
    .map((n) => n[0])
    .join('');

  // This month attendance rate from stats
  const monthRate = stats?.attendance.rate ?? child.attendanceRate;
  const streak = stats?.streak ?? child.streak;

  return (
    <Card className="overflow-hidden relative">
      {/* Gradient border effect */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, hsl(250 85% 60% / 0.15), hsl(170 70% 42% / 0.1))',
          zIndex: 0,
        }}
      />
      <div className="absolute inset-[1px] rounded-xl bg-card z-0" />

      <CardContent className="relative z-10 p-4 space-y-4">
        {/* Header: avatar + name + link */}
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center text-sm font-bold text-primary ring-2 ring-primary/20">
              {initials}
            </div>
            {streak >= 3 && (
              <span
                title={`${streak} tréninků v řadě`}
                className="absolute -bottom-1 -right-1 rounded-full bg-orange-500 px-1 py-0.5 text-[10px] font-bold text-white leading-none"
              >
                🔥
              </span>
            )}
          </div>

          {/* Name + team */}
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{child.name}</div>
            {child.teamName && (
              <div className="truncate text-xs text-muted-foreground">{child.teamName}</div>
            )}
          </div>

          <Link
            href={`/admin/members/${childId}`}
            className="shrink-0 text-[11px] font-medium text-primary/70 hover:text-primary hover:underline"
          >
            Profil →
          </Link>
        </div>

        {/* Attendance streak + progress bar */}
        {streak >= 1 && (
          <div className="rounded-lg bg-orange-500/10 border border-orange-500/20 px-3 py-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                🔥 {streak} {streak === 1 ? 'trénink' : streak < 5 ? 'tréninky' : 'tréninků'} v řadě
              </span>
              {badgesData && (
                <span className="text-[10px] text-muted-foreground">
                  nejdelší: {badgesData.longestStreak}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Docházka tento měsíc */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Docházka celkem
            </span>
            {statsLoading ? (
              <Skeleton className="h-3 w-8" />
            ) : (
              <span className={`text-sm font-bold tabular-nums ${attendanceColor(monthRate)}`}>
                {monthRate}%
              </span>
            )}
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            {statsLoading ? (
              <div className="h-full w-full animate-pulse bg-muted" />
            ) : (
              <div
                className={`h-full rounded-full transition-all duration-700 ${progressBarColor(monthRate)}`}
                style={{ width: `${monthRate}%` }}
              />
            )}
          </div>
          {stats && (
            <div className="text-[10px] text-muted-foreground">
              {stats.attendance.attended} z {stats.attendance.total} událostí
              {stats.attendance.teamAverage > 0 && (
                <span className="ml-2 text-muted-foreground/60">
                  (průměr týmu: {stats.attendance.teamAverage}%)
                </span>
              )}
            </div>
          )}
        </div>

        {/* Nadcházející události — max 3 */}
        {upcomingEvents && upcomingEvents.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Nadcházející
            </div>
            <div className="space-y-1">
              {upcomingEvents.map((ev) => {
                const isPending =
                  child.nextEvent?.id === ev.id && child.rsvpStatus === 'PENDING';
                const rsvpStatus =
                  child.nextEvent?.id === ev.id ? child.rsvpStatus : null;

                return (
                  <div
                    key={ev.id}
                    className="flex items-center gap-2 rounded-md border border-border/40 bg-secondary/30 px-2.5 py-1.5"
                  >
                    {/* Type badge */}
                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${EVENT_TYPE_COLOR[ev.type] ?? 'bg-muted text-muted-foreground'}`}
                    >
                      {EVENT_TYPE_ABBR[ev.type] ?? ev.type.slice(0, 3)}
                    </span>

                    {/* Date */}
                    <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">
                      {new Date(ev.startsAt).toLocaleDateString('cs-CZ', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'numeric',
                      })}
                    </span>

                    <span className="flex-1 min-w-0 truncate text-xs font-medium">
                      {ev.title}
                    </span>

                    {/* Quick RSVP — only if pending */}
                    {isPending ? (
                      <div className="flex shrink-0 gap-1">
                        <button
                          onClick={() => rsvpMutation.mutate({ eventId: ev.id, status: 'YES' })}
                          disabled={rsvpMutation.isPending}
                          title="Zúčastním se"
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500/15 text-green-600 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => rsvpMutation.mutate({ eventId: ev.id, status: 'NO' })}
                          disabled={rsvpMutation.isPending}
                          title="Nemohu"
                          className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500/15 text-red-600 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : rsvpStatus ? (
                      <span className={`shrink-0 text-[11px] font-semibold ${RSVP_STATUS_COLOR[rsvpStatus] ?? 'text-muted-foreground'}`}>
                        {rsvpStatus === 'YES' ? '✓' : rsvpStatus === 'NO' ? '✗' : '?'}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Poslední odznaky */}
        {recentBadges.length > 0 && (
          <div className="rounded-lg border border-primary/20 bg-primary/[0.03] px-3 py-2">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary/70">
              Nové odznaky
            </div>
            <div className="flex flex-wrap gap-2">
              {recentBadges.map((badge) => (
                <div
                  key={badge.id}
                  title={badge.description}
                  className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium"
                >
                  <span>{badge.icon}</span>
                  <span>{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending payments warning */}
        {child.pendingPaymentsCount > 0 && (
          <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2.5 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <CreditCard className="h-3.5 w-3.5 shrink-0" />
            {child.pendingPaymentsCount}{' '}
            {child.pendingPaymentsCount > 1 ? 'platby čekají' : 'platba čeká'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
