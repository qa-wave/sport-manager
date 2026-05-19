'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  Baby,
  CalendarDays,
  ChevronRight,
  Heart,
  MapPin,
  Plus,
  UserCircle,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { UpgradeBanner } from '@/components/admin/upgrade-banner';
import { ChildProgressCard } from '@/components/admin/child-progress-card';
import { DashboardSkeleton } from '@/components/admin/skeleton-loaders';
import { apiFetch, ApiError, type DashboardFeed, type MeResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useTranslation } from '@/lib/i18n';
import { useMemberContext, isAdmin, isCoach, isGuardian, getPrimaryRoleLabel } from '@/lib/member-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function dayNum(d: string) { return new Date(d).getDate().toString(); }
function weekdayShort(d: string) { return new Date(d).toLocaleDateString('cs-CZ', { weekday: 'short' }).toUpperCase(); }
function formatTime(d: string) { return new Date(d).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }); }

function isHappeningNow(startsAt: string, endsAt: string): boolean {
  const now = Date.now();
  return new Date(startsAt).getTime() <= now && new Date(endsAt).getTime() >= now;
}

// relativeTime is now a hook-based function inside DashboardPage — see below

const EVENT_BORDER: Record<string, string> = {
  PRACTICE: 'border-l-emerald-500',
  MATCH: 'border-l-amber-500',
  TOURNAMENT: 'border-l-blue-500',
  MEETING: 'border-l-emerald-500',
  SOCIAL: 'border-l-pink-500',
};

// EVENT_LABEL is now built dynamically using t() inside DashboardPage


export default function DashboardPage() {
  const auth = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: memberCtx } = useMemberContext();

  // Build event label map from translations
  const EVENT_LABEL: Record<string, string> = {
    PRACTICE: t('events.practice'),
    MATCH: t('events.match'),
    TOURNAMENT: t('events.tournament'),
    MEETING: t('events.meeting'),
    SOCIAL: t('events.social'),
  };

  function getRoleGreeting(roleLabel: string): string {
    switch (roleLabel) {
      case 'Parent':
        return t('dashboard.greetingParent');
      case 'Head Coach':
      case 'Asst. Coach':
        return t('dashboard.greetingCoach');
      case 'Team Manager':
        return t('dashboard.greetingCoach');
      default:
        return t('dashboard.greetingAdmin');
    }
  }

  function getTimeGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return t('dashboard.greeting.morning');
    if (h < 18) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  }

  function relativeTime(d: string): string {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('time.justNow');
    if (mins < 60) return t('time.minutesAgo', { n: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return t('time.hoursAgo', { n: hours });
    const days = Math.floor(hours / 24);
    return t('time.daysAgo', { n: days });
  }

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

  // Redirect to onboarding wizard for new empty clubs (no events, <=1 member)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('onboarding-complete')) return;
    if (!feed) return;
    const stats = feed.stats;
    if (!stats) return;
    // Empty club: 0 upcoming events and at most 1 member (the owner themselves)
    if (stats.upcomingEvents === 0 && stats.members <= 1) {
      router.push('/admin/onboarding');
    }
  }, [feed, router]);

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
        <DashboardSkeleton />
      ) : !feed ? null : (
        <div data-tour="dashboard" className="space-y-8 animate-fade-up">
          {/* Upgrade banner — shown to admins/owners on FREE plan near limit */}
          {admin && <UpgradeBanner />}

          {/* Moje děti — only for pure guardians (not admin or coach) */}
          {guardian && !admin && !coach && feed.children && feed.children.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Baby className="h-4 w-4 text-primary" />
                {t('dashboard.myChildren')}
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {feed.children.map((child) => (
                  <ChildProgressCard key={child.childMemberId} child={child} />
                ))}
              </div>
            </section>
          )}

          {/* This Week */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <CalendarDays className="h-4 w-4 text-primary" />
                {t('dashboard.thisWeek')}
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin/events">
                  {t('dashboard.allEvents')} <ChevronRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>

            {feed.thisWeek.length === 0 ? (
              <Card className="">
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">{t('dashboard.noEvents')}</p>
                  <Button asChild size="sm" className="mt-3">
                    <Link href="/admin/events/new">
                      <Plus className="mr-1 h-4 w-4" />{t('dashboard.schedule')}
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
                  const live = isMatch && isHappeningNow(event.startsAt, event.endsAt ?? event.startsAt);

                  return (
                    <div
                      key={event.id}
                      className={`group cursor-pointer overflow-hidden rounded-xl border bg-card transition-all duration-200 hover:border-primary/40 hover:shadow-md border-l-[3px] ${
                        live
                          ? 'border-red-500/40 border-l-red-500'
                          : `border-border/50 ${EVENT_BORDER[event.type] ?? 'border-l-border'}`
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
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold uppercase tracking-wide transition-colors group-hover:text-primary">
                                {isMatch ? event.title : EVENT_LABEL[event.type] ?? event.type}
                              </span>
                              {live && (
                                <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[11px] font-bold text-red-500">
                                  <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                                  LIVE
                                </span>
                              )}
                            </div>
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
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            {total === 0 ? (
                              <span className="text-xs text-muted-foreground/70">{t('dashboard.noRsvp')}</span>
                            ) : rsvp.pending > 0 && rsvp.pending >= rsvp.yes ? (
                              <>
                                <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-500">RSVP?</span>
                                {guardian && !admin && !coach && (
                                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                    Potvrďte účast →
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-xs font-bold text-emerald-500">{rsvp.yes} {t('dashboard.going')}</span>
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
                {t('dashboard.needsAttention')}
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
              {t('dashboard.quickActions')}
            </h2>
            <div className={`grid gap-3 ${admin ? 'xs:grid-cols-2 sm:grid-cols-3' : 'xs:grid-cols-2 sm:grid-cols-2'}`}>
              {(admin || coach) && (
                <QuickAction
                  href="/admin/events/new"
                  icon={Plus}
                  title={t('dashboard.qa.createEvent')}
                  desc={t('dashboard.qa.createEventDesc')}
                  primary
                />
              )}
              {guardian && !admin && !coach && (
                <QuickAction
                  href="/admin/events"
                  icon={Heart}
                  title={t('dashboard.qa.upcomingEvents')}
                  desc={t('dashboard.qa.upcomingEventsDesc')}
                  primary
                />
              )}
              {admin && (
                <QuickAction
                  href="/admin/members"
                  icon={UserCircle}
                  title={t('nav.members')}
                  desc={t('dashboard.qa.membersDesc')}
                />
              )}
              {(admin || coach) && (
                <QuickAction
                  href="/admin/teams"
                  icon={Users}
                  title={t('nav.teams')}
                  desc={t('dashboard.qa.teamsDesc')}
                />
              )}
              {!admin && !coach && (
                <QuickAction
                  href="/admin/events"
                  icon={CalendarDays}
                  title={t('dashboard.allEvents')}
                  desc={t('dashboard.qa.allEventsDesc')}
                />
              )}
            </div>
          </section>

          {/* Recent Activity */}
          {feed.recentActivity.length > 0 && (
            <section>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {t('dashboard.recentActivity')}
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
                      <span className="shrink-0 text-[11px] text-muted-foreground/70">
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
