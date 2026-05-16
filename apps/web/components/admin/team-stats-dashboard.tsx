'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Trophy, Target, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch, ApiError, type TeamStats, type AttendanceStatsResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

// ── SVG inline čárový graf ────────────────────────────────────────────────────

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  showDots?: boolean;
  strokeWidth?: number;
}

function Sparkline({
  data,
  width = 300,
  height = 80,
  color = 'var(--color-primary)',
  fillColor,
  showDots = true,
  strokeWidth = 2,
}: SparklineProps) {
  if (data.length === 0) return null;

  const paddingX = 12;
  const paddingY = 10;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal || 1;

  const points = data.map((v, i) => {
    const x = paddingX + (i / Math.max(data.length - 1, 1)) * chartWidth;
    const y = paddingY + chartHeight - ((v - minVal) / range) * chartHeight;
    return { x, y, value: v };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Area fill path (closed polygon)
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const areaPath =
    firstPoint && lastPoint
      ? `M ${firstPoint.x},${paddingY + chartHeight} ${points.map((p) => `L ${p.x},${p.y}`).join(' ')} L ${lastPoint.x},${paddingY + chartHeight} Z`
      : '';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="none"
    >
      {/* Horizontal grid lines */}
      {[0, 0.5, 1].map((pct, i) => (
        <line
          key={i}
          x1={paddingX}
          y1={paddingY + chartHeight * (1 - pct)}
          x2={width - paddingX}
          y2={paddingY + chartHeight * (1 - pct)}
          stroke="currentColor"
          strokeOpacity={0.08}
          strokeWidth={1}
          className="text-foreground"
        />
      ))}

      {/* Area fill */}
      {fillColor && areaPath && (
        <path d={areaPath} fill={fillColor} opacity={0.15} />
      )}

      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Data dots */}
      {showDots && points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={3}
          fill={color}
          stroke="hsl(var(--background))"
          strokeWidth={1.5}
        >
          <title>{`${p.value}%`}</title>
        </circle>
      ))}
    </svg>
  );
}

// ── Attendance Trend sekce ────────────────────────────────────────────────────

function AttendanceTrendSection({ stats }: { stats: TeamStats }) {
  const trend = stats.monthlyTrend;
  if (trend.length === 0) return null;

  const values = trend.map((t) => t.attendance);
  const last = values[values.length - 1] ?? 0;
  const prev = values[values.length - 2] ?? last;
  const delta = last - prev;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Trend docházky</CardTitle>
          <div className="flex items-center gap-1.5">
            {delta >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span
              className={`text-sm font-bold tabular-nums ${
                delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {delta >= 0 ? '+' : ''}{delta}%
            </span>
            <span className="text-xs text-muted-foreground">vs. předchozí měsíc</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="mb-1">
          <Sparkline
            data={values}
            height={88}
            color="hsl(var(--primary))"
            fillColor="hsl(var(--primary))"
            strokeWidth={2.5}
          />
        </div>
        {/* X-axis labels */}
        <div className="flex items-center justify-between px-3 text-[10px] text-muted-foreground">
          {trend.map((t, i) => (
            <span key={i}>{t.month}</span>
          ))}
        </div>
        {/* Y-axis reference */}
        <div className="mt-2 flex items-center gap-4 text-[11px] text-muted-foreground">
          <span>Min: <strong className="text-foreground">{Math.min(...values)}%</strong></span>
          <span>Max: <strong className="text-foreground">{Math.max(...values)}%</strong></span>
          <span>Průměr: <strong className="text-foreground">{Math.round(values.reduce((s, v) => s + v, 0) / values.length)}%</strong></span>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Top / Bottom hráči ────────────────────────────────────────────────────────

function PlayerRankingSection({ stats }: { stats: TeamStats }) {
  const all = [
    ...stats.topAttenders.map((p) => ({ ...p, tier: 'top' as const })),
    ...stats.worstAttenders.map((p) => ({ ...p, tier: 'bottom' as const })),
  ];

  if (all.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Top hráči */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
            <CardTitle className="text-sm">Nejlepší docházka</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {stats.topAttenders.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nedostatek dat</p>
          ) : (
            stats.topAttenders.map((p, i) => (
              <PlayerRow key={p.name} rank={i + 1} name={p.name} rate={p.rate} tier="top" />
            ))
          )}
        </CardContent>
      </Card>

      {/* Hráči vyžadující pozornost */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-sm">Potřebují pozornost</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {stats.worstAttenders.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nedostatek dat</p>
          ) : (
            stats.worstAttenders.map((p, i) => (
              <PlayerRow key={p.name} rank={i + 1} name={p.name} rate={p.rate} tier="bottom" />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlayerRow({
  rank,
  name,
  rate,
  tier,
}: {
  rank: number;
  name: string;
  rate: number;
  tier: 'top' | 'bottom';
}) {
  const barColor = tier === 'top' ? 'bg-emerald-500' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500';
  const trackColor = tier === 'top' ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-amber-100 dark:bg-amber-950';
  const textColor = tier === 'top' ? 'text-emerald-600 dark:text-emerald-400' : rate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center gap-2.5">
      <span className="w-4 shrink-0 text-center text-[11px] font-bold text-muted-foreground/60">
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="truncate text-xs font-medium">{name}</span>
          <span className={`shrink-0 text-xs font-bold tabular-nums ${textColor}`}>{rate}%</span>
        </div>
        <div className={`h-1.5 w-full rounded-full ${trackColor}`}>
          <div
            className={`h-1.5 rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.max(rate, 2)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ── RSVP Response Rate sekce ──────────────────────────────────────────────────

function RsvpSection({ stats }: { stats: TeamStats }) {
  const rate = stats.rsvpReliability;
  const color =
    rate >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
    rate >= 50 ? 'text-amber-600 dark:text-amber-400' :
    'text-red-600 dark:text-red-400';

  const bgColor =
    rate >= 80 ? 'bg-emerald-500' :
    rate >= 50 ? 'bg-amber-500' :
    'bg-red-500';

  const label =
    rate >= 80 ? 'Výborná' :
    rate >= 60 ? 'Dobrá' :
    rate >= 40 ? 'Průměrná' :
    'Nízká';

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">RSVP spolehlivost</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-4">
          <div>
            <span className={`text-4xl font-bold tabular-nums ${color}`}>{rate}%</span>
            <div className="mt-1 text-xs text-muted-foreground">
              členů odpovídá před deadline
            </div>
          </div>
          <div className="flex-1">
            <div className="mb-1 flex justify-end text-[11px] font-medium text-muted-foreground">
              {label}
            </div>
            <div className="h-3 w-full rounded-full bg-secondary">
              <div
                className={`h-3 rounded-full transition-all ${bgColor}`}
                style={{ width: `${Math.max(rate, 2)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Zápasová bilance ──────────────────────────────────────────────────────────

function MatchRecordSection({ stats }: { stats: TeamStats }) {
  if (stats.totalMatches === 0) return null;

  // TeamStats nemá W/D/L — zobrazíme co máme: počet zápasů a tréninků
  // Placeholder W/D/L bychom museli přidat do API; nyní zobrazíme dostupná data
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-500" />
          <CardTitle className="text-sm">Zápasy a tréninky</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-3">
            <div className="text-2xl font-bold text-primary tabular-nums">{stats.totalMatches}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">Zápasů</div>
          </div>
          <div className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-3">
            <div className="text-2xl font-bold tabular-nums">{stats.totalPractices}</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">Tréninků</div>
          </div>
          <div className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-3">
            <div className="text-2xl font-bold text-emerald-500 tabular-nums">{stats.avgAttendance}%</div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">Prům. účast</div>
          </div>
        </div>

        {/* Simple visual breakdown bar */}
        {stats.totalEvents > 0 && (
          <div className="mt-3">
            <div className="mb-1 text-[11px] text-muted-foreground">Poměr událostí</div>
            <div className="flex h-2 w-full overflow-hidden rounded-full">
              <div
                className="bg-amber-500"
                style={{ width: `${(stats.totalMatches / stats.totalEvents) * 100}%` }}
                title={`Zápasy: ${stats.totalMatches}`}
              />
              <div
                className="bg-primary/60"
                style={{ width: `${(stats.totalPractices / stats.totalEvents) * 100}%` }}
                title={`Tréninky: ${stats.totalPractices}`}
              />
              <div
                className="bg-secondary"
                style={{ width: `${Math.max(0, 100 - ((stats.totalMatches + stats.totalPractices) / stats.totalEvents) * 100)}%` }}
                title="Ostatní"
              />
            </div>
            <div className="mt-1.5 flex gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-500" />Zápasy</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-primary/60" />Tréninky</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-secondary border border-border/40" />Ostatní</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Přehledové stat karty ─────────────────────────────────────────────────────

function OverviewCards({ stats }: { stats: TeamStats }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
        <div className="text-2xl font-bold text-primary tabular-nums">{stats.totalEvents}</div>
        <div className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Událostí celkem</div>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
        <div className="text-2xl font-bold text-emerald-500 tabular-nums">{stats.avgAttendance}%</div>
        <div className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">Průměrná účast</div>
      </div>
      <div className="rounded-xl border border-border/50 bg-card p-4 text-center">
        <div className="text-2xl font-bold text-blue-500 tabular-nums">{stats.rsvpReliability}%</div>
        <div className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">RSVP spolehlivost</div>
      </div>
    </div>
  );
}

// ── Hlavní komponenta ─────────────────────────────────────────────────────────

interface TeamStatsDashboardProps {
  teamId: string;
}

export function TeamStatsDashboard({ teamId }: TeamStatsDashboardProps) {
  const auth = useAuth();

  const { data: stats, isLoading, isError } = useQuery<TeamStats, ApiError>({
    queryKey: ['team-stats', teamId, auth.clubId],
    queryFn: () => apiFetch<TeamStats>(`/teams/${teamId}/stats`),
    enabled: auth.isAuthenticated && !!auth.clubId && !!teamId,
    retry: false,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-52 rounded-xl" />
          <Skeleton className="h-52 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4 text-sm text-destructive">
          Nepodařilo se načíst statistiky týmu.
        </CardContent>
      </Card>
    );
  }

  if (stats.totalEvents === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Zatím žádná data</p>
          <p className="mt-1 text-xs text-muted-foreground/70">
            Statistiky se zobrazí po prvních událostech týmu.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <OverviewCards stats={stats} />
      <AttendanceTrendSection stats={stats} />
      <PlayerRankingSection stats={stats} />
      <div className="grid gap-4 sm:grid-cols-2">
        <RsvpSection stats={stats} />
        <MatchRecordSection stats={stats} />
      </div>
    </div>
  );
}
