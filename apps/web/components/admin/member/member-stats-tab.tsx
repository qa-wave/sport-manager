'use client';

import { Minus, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MemberStats } from '@/lib/api';

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
