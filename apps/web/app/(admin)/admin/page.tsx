'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  Heart,
  MapPin,
  Plus,
  UserCircle,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError, type DashboardFeed, type EventSummary, type MeResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext, isAdmin, isCoach, isGuardian, getPrimaryRoleLabel } from '@/lib/member-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function dayNum(d: string) { return new Date(d).getDate().toString(); }
function weekdayShort(d: string) { return new Date(d).toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(); }
function formatTime(d: string) { return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); }

function relativeTime(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const EVENT_BORDER: Record<string, string> = {
  PRACTICE: 'border-l-emerald-500',
  MATCH: 'border-l-amber-500',
  TOURNAMENT: 'border-l-blue-500',
  MEETING: 'border-l-violet-500',
  SOCIAL: 'border-l-pink-500',
};

const EVENT_LABEL: Record<string, string> = {
  PRACTICE: 'Practice',
  MATCH: 'Match',
  TOURNAMENT: 'Tournament',
  MEETING: 'Meeting',
  SOCIAL: 'Social',
};

function getRoleGreeting(roleLabel: string): string {
  switch (roleLabel) {
    case 'Parent':
      return "Here's what's coming up for your kids.";
    case 'Head Coach':
    case 'Asst. Coach':
      return 'Your teams at a glance.';
    case 'Team Manager':
      return 'Your teams at a glance.';
    default:
      return 'Club overview at a glance.';
  }
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Dobré ráno';
  if (h < 18) return 'Dobré odpoledne';
  return 'Dobrý večer';
}

export default function DashboardPage() {
  const auth = useAuth();
  const router = useRouter();
  const { data: memberCtx } = useMemberContext();

  const { data: feed, isLoading } = useQuery<DashboardFeed, ApiError>({
    queryKey: ['dashboard-feed', auth.clubId],
    queryFn: () => apiFetch<DashboardFeed>('/dashboard/feed'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    refetchInterval: 30_000,
  });

  const me = useQuery<MeResponse, ApiError>({
    queryKey: ['me', auth.accessToken],
    queryFn: () => apiFetch<MeResponse>('/me'),
    enabled: auth.isAuthenticated,
  });

  const admin = memberCtx ? isAdmin(memberCtx) : true;
  const coach = memberCtx ? isCoach(memberCtx) : false;
  const guardian = memberCtx ? isGuardian(memberCtx) : false;
  const roleLabel = memberCtx ? getPrimaryRoleLabel(memberCtx) : 'Admin';
  const firstName = me.data?.firstName;

  return (
    <>
      <PageHeader
        title={firstName ? `${getTimeGreeting()}, ${firstName}` : 'Dashboard'}
        subtitle={feed?.stats ? (admin
          ? `${feed.stats.members} členů · ${feed.stats.teams} týmů · ${feed.stats.upcomingEvents} nadcházejících`
          : getRoleGreeting(roleLabel)
        ) : undefined}
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      ) : !feed ? null : (
        <div className="space-y-6">
          {/* This Week */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                This Week
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/events">
                  All events <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>

            {feed.thisWeek.length === 0 ? (
              <Card className="">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">No events this week</p>
                  <Button asChild size="sm" className="mt-3">
                    <Link href="/admin/events/new">
                      <Plus className="mr-1 h-4 w-4" />Schedule one
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {feed.thisWeek.map((event) => {
                  const isMatch = event.type === 'MATCH' || event.type === 'TOURNAMENT';
                  const rsvp = event.rsvpSummary;
                  const total = rsvp.yes + rsvp.maybe + rsvp.no + rsvp.pending;

                  return (
                    <div
                      key={event.id}
                      className={`group cursor-pointer overflow-hidden rounded-xl border border-border/50 bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md border-l-[3px] ${
                        EVENT_BORDER[event.type] ?? 'border-l-border'
                      }`}
                      onClick={() => router.push(`/admin/events/${event.id}`)}
                    >
                      <div className="flex items-stretch">
                        <div className="flex w-[64px] shrink-0 flex-col items-center justify-center border-r border-border/30 py-3">
                          <span className="text-xl font-bold leading-none">{dayNum(event.startsAt)}</span>
                          <span className="mt-0.5 text-[11px] font-medium tracking-wider text-muted-foreground">{weekdayShort(event.startsAt)}</span>
                          <span className="mt-1 text-[11px] font-semibold text-primary">{formatTime(event.startsAt)}</span>
                        </div>
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2.5">
                          <div className="min-w-0">
                            <span className="text-sm font-bold uppercase tracking-wide transition-colors group-hover:text-primary">
                              {isMatch ? event.title : EVENT_LABEL[event.type] ?? event.type}
                            </span>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{total}</span>
                              {event.teamName && <span className="font-medium text-primary/70">{event.teamName}</span>}
                              {event.location && (
                                <span className="hidden items-center gap-1 sm:flex">
                                  <MapPin className="h-3 w-3" />
                                  <span className="max-w-[100px] truncate">{event.location}</span>
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="shrink-0">
                            {total === 0 ? (
                              <span className="text-xs text-muted-foreground/50">No RSVPs</span>
                            ) : rsvp.pending > 0 && rsvp.pending >= rsvp.yes ? (
                              <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-500">RSVP?</span>
                            ) : (
                              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-500">{rsvp.yes} going</span>
                            )}
                          </div>
                          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-primary" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Needs Attention — only shown to admins and coaches */}
          {(admin || coach) && feed.needsAttention.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Needs Attention
              </h2>
              <div className="space-y-2">
                {feed.needsAttention.map((item, i) => (
                  <Card
                    key={i}
                    className={`cursor-pointer overflow-hidden transition-colors hover:bg-card/80 ${
                      item.severity === 'critical'
                        ? 'border-destructive/30 bg-destructive/[0.03]'
                        : 'border-warning/20 bg-warning/[0.03]'
                    }`}
                    onClick={() => router.push(item.link)}
                  >
                    <CardContent className="flex items-center gap-3 p-3 sm:p-4">
                      <AlertTriangle
                        className={`h-4 w-4 shrink-0 ${
                          item.severity === 'critical' ? 'text-destructive' : 'text-warning'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold">{item.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{item.description}</div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Quick Actions */}
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Quick Actions
            </h2>
            <div className={`grid gap-3 ${admin ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
              {(admin || coach) && (
                <QuickAction
                  href="/admin/events/new"
                  icon={Plus}
                  title="Schedule Event"
                  desc="Create a practice, match, or meeting"
                  primary
                />
              )}
              {guardian && !admin && !coach && (
                <QuickAction
                  href="/admin/events"
                  icon={Heart}
                  title="Upcoming Events"
                  desc="See & RSVP for your children"
                  primary
                />
              )}
              {admin && (
                <QuickAction
                  href="/admin/members"
                  icon={UserCircle}
                  title="Members"
                  desc="View and manage club members"
                />
              )}
              {(admin || coach) && (
                <QuickAction
                  href="/admin/teams"
                  icon={Users}
                  title="Teams"
                  desc="Rosters and coaching staff"
                />
              )}
              {!admin && !coach && (
                <QuickAction
                  href="/admin/events"
                  icon={CalendarDays}
                  title="All Events"
                  desc="View schedule and RSVPs"
                />
              )}
            </div>
          </section>

          {/* Recent Activity */}
          {feed.recentActivity.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Recent Activity
              </h2>
              <Card className="">
                <CardContent className="divide-y divide-border/30 p-0">
                  {feed.recentActivity.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-primary/[0.02] cursor-pointer"
                      onClick={() => item.link && router.push(item.link)}
                    >
                      <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50" />
                      <p className="flex-1 text-xs text-muted-foreground">{item.message}</p>
                      <span className="shrink-0 text-[11px] text-muted-foreground/50">
                        {relativeTime(item.timestamp)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      )}
    </>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  desc,
  primary,
}: {
  href: string;
  icon: typeof Plus;
  title: string;
  desc: string;
  primary?: boolean;
}) {
  return (
    <Link href={href}>
      <Card className={`group relative overflow-hidden transition-all duration-200 hover:border-primary/30 ${
        primary ? 'border-primary/20 bg-primary/[0.03]' : ''
      }`}>
        <CardContent className="flex items-center gap-3 p-4">
          <div className={`rounded-lg p-2 transition-all group-hover:shadow-md ${
            primary ? 'bg-primary/15 text-primary' : 'bg-primary/10 text-primary'
          }`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold">{title}</div>
            <div className="mt-0.5 text-xs text-muted-foreground">{desc}</div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
        </CardContent>
      </Card>
    </Link>
  );
}
