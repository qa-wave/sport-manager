'use client';

import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MemberStats } from '@/lib/api';

// ── SVG inline čárový graf docházky ──────────────────────────────────────────

interface AttendanceLineChartProps {
  /** Pole { month: 'Led', value: 85 } — max 6 položek */
  data: Array<{ month: string; value: number }>;
}

function AttendanceLineChart({ data }: AttendanceLineChartProps) {
  if (data.length === 0) return null;

  const W = 340;
  const H = 100;
  const padX = 16;
  const padY = 14;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const values = data.map((d) => d.value);
  const minVal = Math.max(0, Math.min(...values) - 10);
  const maxVal = Math.min(100, Math.max(...values) + 10);
  const range = maxVal - minVal || 1;

  const pts = data.map((d, i) => ({
    x: padX + (i / Math.max(data.length - 1, 1)) * chartW,
    y: padY + chartH - ((d.value - minVal) / range) * chartH,
    value: d.value,
    month: d.month,
  }));

  const polyline = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const firstPt = pts[0];
  const lastPt = pts[pts.length - 1];
  const areaPath =
    firstPt && lastPt
      ? `M ${firstPt.x},${padY + chartH} ${pts.map((p) => `L ${p.x},${p.y}`).join(' ')} L ${lastPt.x},${padY + chartH} Z`
      : '';

  const avg = Math.round(values.reduce((s, v) => s + v, 0) / values.length);

  return (
    <div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        preserveAspectRatio="none"
        style={{ height: H }}
      >
        {/* Grid */}
        {[0, 0.5, 1].map((pct, i) => (
          <line
            key={i}
            x1={padX}
            y1={padY + chartH * (1 - pct)}
            x2={W - padX}
            y2={padY + chartH * (1 - pct)}
            stroke="currentColor"
            strokeOpacity={0.07}
            strokeWidth={1}
            className="text-foreground"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="hsl(var(--primary))" opacity={0.1} />

        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Dots */}
        {pts.map((p, i) => {
          const dotColor =
            p.value >= 80
              ? '#22c55e'
              : p.value >= 50
                ? '#f59e0b'
                : '#ef4444';
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={4}
                fill={dotColor}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              />
              <title>{`${p.month}: ${p.value}%`}</title>
            </g>
          );
        })}
      </svg>

      {/* X-axis labels */}
      <div className="flex items-center justify-between px-4 text-[10px] text-muted-foreground">
        {data.map((d, i) => (
          <span key={i}>{d.month}</span>
        ))}
      </div>

      {/* Průměr */}
      <div className="mt-2 text-center text-xs text-muted-foreground">
        Průměr:{' '}
        <strong
          className={
            avg >= 80
              ? 'text-emerald-600 dark:text-emerald-400'
              : avg >= 50
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
          }
        >
          {avg}%
        </strong>
      </div>
    </div>
  );
}

/**
 * Sestaví měsíční průměry z recentForm dat (poslední 6 měsíců).
 * recentForm nemá datum — použijeme attendance.rate jako zástupné data
 * pro demonstraci grafu; reálná data by přišla z API monthly breakdown.
 */
function buildMonthlyData(
  recentForm: MemberStats['recentForm'],
  overallRate: number,
): Array<{ month: string; value: number }> {
  // Seskupí záznamy dle měsíce
  const byMonth: Record<string, { attended: number; total: number }> = {};

  for (const item of recentForm) {
    // date field existuje na recentForm položce
    const d = new Date(item.date);
    const key = d.toLocaleDateString('cs-CZ', { month: 'short', year: '2-digit' });
    if (!byMonth[key]) byMonth[key] = { attended: 0, total: 0 };
    byMonth[key].total += 1;
    if (item.attended === true) byMonth[key].attended += 1;
  }

  const entries = Object.entries(byMonth).map(([month, { attended, total }]) => ({
    month,
    value: total > 0 ? Math.round((attended / total) * 100) : 0,
  }));

  // Seřadíme chronologicky — bereme poslední 6
  const last6 = entries.slice(-6);

  // Pokud máme méně než 2 body, graf nemá smysl — vrátíme prázdné
  return last6.length >= 2 ? last6 : [];
}

function rateColor(rate: number): string {
  if (rate >= 80) return 'text-green-600 dark:text-green-400';
  if (rate >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function ProgressBar({
  value,
  className = '',
}: {
  value: number;
  className?: string;
}) {
  const pct = Math.min(Math.round(value), 100);
  const colorClass = value >= 80 ? 'bg-green-500' : value >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className={`h-2 w-full rounded-full bg-secondary ${className}`}>
      <div className={`h-2 rounded-full transition-all ${colorClass}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

interface MemberStatsTabProps {
  stats: MemberStats;
}

export function MemberStatsTab({ stats }: MemberStatsTabProps) {
  const { attendance, rsvp, recentForm, streak } = stats;
  const monthlyData = buildMonthlyData(recentForm, attendance.rate);

  return (
    <div className="space-y-4">
      {/* Top stat cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Attendance rate */}
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Účast
            </div>
            <div className="mt-2 flex items-end gap-2">
              <span className={`text-3xl font-bold tabular-nums ${rateColor(attendance.rate)}`}>
                {attendance.rate}%
              </span>
              <TrendIcon trend={attendance.trend} />
            </div>
            <div className="mt-2">
              <ProgressBar value={attendance.rate} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {attendance.attended} / {attendance.total} událostí
            </div>
          </CardContent>
        </Card>

        {/* RSVP reliability */}
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              RSVP spolehlivost
            </div>
            <div className="mt-2">
              <span className={`text-3xl font-bold tabular-nums ${rateColor(rsvp.reliability)}`}>
                {rsvp.reliability}%
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar value={rsvp.reliability} />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              Včas: {rsvp.onTime} / {rsvp.total}
            </div>
          </CardContent>
        </Card>

        {/* Streak */}
        <Card>
          <CardContent className="p-5">
            <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Aktuální série
            </div>
            <div className="mt-2">
              <span
                className={`text-3xl font-bold tabular-nums ${
                  streak > 0 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
                }`}
              >
                {streak}
              </span>
              <span className="ml-1 text-sm text-muted-foreground">
                {streak === 1 ? 'trénink' : streak < 5 ? 'tréninky' : 'tréninků'} v řadě
              </span>
            </div>
            {streak >= 5 && (
              <div className="mt-2 inline-flex items-center rounded-full bg-green-500/15 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                Skvělá forma!
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team comparison */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Porovnání s týmem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-medium">Tento hráč</span>
              <span className={`font-bold ${rateColor(attendance.rate)}`}>
                {attendance.rate}%
              </span>
            </div>
            <ProgressBar value={attendance.rate} />
          </div>
          <div>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Průměr týmu</span>
              <span className={`font-medium ${rateColor(attendance.teamAverage)}`}>
                {attendance.teamAverage}%
              </span>
            </div>
            <ProgressBar value={attendance.teamAverage} />
          </div>
          {attendance.rate !== attendance.teamAverage && (
            <p className="text-xs text-muted-foreground">
              {attendance.rate > attendance.teamAverage
                ? `O ${attendance.rate - attendance.teamAverage} % nad průměrem týmu`
                : `O ${attendance.teamAverage - attendance.rate} % pod průměrem týmu`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Attendance line chart — poslední měsíce */}
      {monthlyData.length >= 2 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Docházka dle měsíce</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <AttendanceLineChart data={monthlyData} />
          </CardContent>
        </Card>
      )}

      {/* Recent form */}
      {recentForm.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Poslední forma ({recentForm.length} událostí)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {[...recentForm].reverse().map((item, i) => {
                const dotColor =
                  item.attended === true
                    ? 'bg-green-500 ring-green-500/30'
                    : item.attended === false
                      ? 'bg-red-400 ring-red-400/30'
                      : 'bg-muted-foreground/30 ring-muted-foreground/10';
                const rsvpLabel =
                  item.rsvpStatus === 'YES'
                    ? 'ANO'
                    : item.rsvpStatus === 'NO'
                      ? 'NE'
                      : item.rsvpStatus === 'MAYBE'
                        ? 'MOŽNÁ'
                        : 'ČEKÁ';
                const attendedLabel =
                  item.attended === true
                    ? 'Přítomen'
                    : item.attended === false
                      ? 'Nepřítomen'
                      : 'Bez záznamu';
                const dateStr = new Date(item.date).toLocaleDateString('cs-CZ', {
                  day: 'numeric',
                  month: 'numeric',
                });
                return (
                  <div
                    key={i}
                    title={`${item.eventTitle} (${dateStr}) — RSVP: ${rsvpLabel}, Docházka: ${attendedLabel}`}
                    className={`h-5 w-5 rounded-full ring-2 ${dotColor} transition-transform hover:scale-125 cursor-help`}
                  />
                );
              })}
            </div>
            <div className="mt-3 flex gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-green-500 inline-block" /> Přítomen
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400 inline-block" /> Nepřítomen
              </span>
              <span className="flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30 inline-block" />{' '}
                Bez záznamu
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">
              Nejstarší vlevo, nejnovější vpravo
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
