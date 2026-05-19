'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  Building2,
  Users,
  UserCheck,
  CalendarDays,
  Activity,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError, type MeResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type PlatformAnalytics = {
  totalClubs: number;
  totalUsers: number;
  totalMembers: number;
  totalEvents: number;
  activeClubsLast7Days: number;
  newUsersLast30Days: number;
  clubsByTier: Record<string, number>;
};

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Building2;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-lg p-2 ${color ?? 'bg-primary/10 text-primary'}`}>
            <Icon className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="text-2xl font-bold tabular-nums">{value}</div>
            {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const TIER_LABEL: Record<string, string> = {
  free: 'Zdarma',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const TIER_COLOR: Record<string, string> = {
  free: 'bg-secondary/50 text-secondary-foreground',
  pro: 'bg-primary/10 text-primary',
  enterprise: 'bg-amber-500/10 text-amber-600',
};

export default function PlatformAnalyticsPage() {
  const auth = useAuth();

  const me = useQuery<MeResponse, ApiError>({
    queryKey: ['me', auth.accessToken],
    queryFn: () => apiFetch<MeResponse>('/me'),
    enabled: auth.isAuthenticated,
  });

  const analytics = useQuery<PlatformAnalytics, ApiError>({
    queryKey: ['platform-analytics'],
    queryFn: () =>
      apiFetch<PlatformAnalytics>('/platform-admin/clubs/analytics', { clubId: null }),
    enabled: auth.isAuthenticated && me.data?.isPlatformAdmin === true,
    retry: false,
  });

  // Block non-platform-admins
  if (me.isSuccess && !me.data?.isPlatformAdmin) {
    return (
      <>
        <PageHeader title="Platform Analytics" />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-6">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <div>
              <div className="text-sm font-semibold text-destructive">Nedostatecna opravneni</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Tato stranka je dostupna pouze pro platform administratory.
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="ml-auto">
              <Link href="/admin">Zpet</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const data = analytics.data;
  const isLoading = analytics.isLoading || me.isLoading;

  const tierEntries = data
    ? Object.entries(data.clubsByTier).filter(([, count]) => count > 0 || true)
    : [];

  const maxTierCount = Math.max(1, ...Object.values(data?.clubsByTier ?? {}));

  return (
    <>
      <PageHeader
        title="Platform Analytics"
        subtitle="Souhrn uzivatelskych dat na urovni platformy"
        actions={
          <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-600 text-xs">
            Platform Admin
          </Badge>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-20 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : analytics.isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Nepodarilo se nacist data: {analytics.error?.message}
          </CardContent>
        </Card>
      ) : data ? (
        <div className="space-y-6">
          {/* Main stat cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={Building2}
              label="Kluby celkem"
              value={data.totalClubs}
              color="bg-blue-500/10 text-blue-600"
            />
            <StatCard
              icon={Users}
              label="Uzivatele"
              value={data.totalUsers}
              sub={`+${data.newUsersLast30Days} za 30 dni`}
              color="bg-emerald-500/10 text-emerald-600"
            />
            <StatCard
              icon={UserCheck}
              label="Clenove"
              value={data.totalMembers}
              color="bg-emerald-500/10 text-emerald-600"
            />
            <StatCard
              icon={CalendarDays}
              label="Udalosti"
              value={data.totalEvents}
              color="bg-amber-500/10 text-amber-600"
            />
          </div>

          {/* Active clubs badge */}
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Aktivni kluby (posledni 7 dni)</div>
                <div className="text-xs text-muted-foreground">
                  Kluby, ktere maji alespon jednu udalost v poslednim tydnu
                </div>
              </div>
              <div className="ml-auto">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-bold text-emerald-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {data.activeClubsLast7Days} / {data.totalClubs}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Clubs by tier */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Kluby podle tarifu</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {tierEntries.map(([tier, count]) => (
                <div key={tier} className="flex items-center gap-3">
                  <div className="w-20 shrink-0">
                    <span
                      className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${TIER_COLOR[tier] ?? 'bg-secondary/50 text-secondary-foreground'}`}
                    >
                      {TIER_LABEL[tier] ?? tier}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-full rounded-full bg-border/50">
                      <div
                        className="h-2 rounded-full bg-primary/60 transition-all"
                        style={{ width: `${Math.round((count / maxTierCount) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-8 text-right font-mono tabular-nums text-sm font-bold">
                    {count}
                  </div>
                </div>
              ))}
              {tierEntries.length === 0 && (
                <p className="text-xs text-muted-foreground">Zadne kluby</p>
              )}
            </CardContent>
          </Card>

          {/* New users trend */}
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold">Novy uzivatele (posledni 30 dni)</div>
                <div className="text-xs text-muted-foreground">
                  Pocet novych registraci v poslednim mesici
                </div>
              </div>
              <div className="ml-auto font-mono text-2xl font-bold text-emerald-600">
                +{data.newUsersLast30Days}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </>
  );
}
