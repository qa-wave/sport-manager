'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer, CalendarDays } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError, type MeResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type SeasonReportData = {
  generatedAt: string;
  period: { from: string | null; to: string | null };
  eventStats: {
    total: number;
    byType: Record<string, number>;
    avgAttendance: number;
  };
  teamStats: Array<{
    teamId: string;
    teamName: string;
    sport: string;
    attendanceRate: number;
    eventsCount: number;
  }>;
  topMembers: Array<{
    memberId: string;
    name: string;
    avatarUrl: string | null;
    attendedCount: number;
    totalCount: number;
    attendanceRate: number;
  }>;
  paymentSummary: {
    totalCollectedCents: number;
    totalOutstandingCents: number;
    currency: string;
    paidCount: number;
    pendingCount: number;
  };
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency }).format(cents / 100);
}

function AttendanceBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="w-10 text-right text-xs font-medium tabular-nums"
        style={{ color }}
      >
        {pct}%
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function SeasonReportPage() {
  const auth = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  // Default: current calendar year
  const thisYear = new Date().getFullYear();
  const [from, setFrom] = useState(`${thisYear}-01-01`);
  const [to, setTo] = useState(`${thisYear}-12-31`);

  const { data: me } = useQuery<MeResponse, ApiError>({
    queryKey: ['me', auth.accessToken],
    queryFn: () => apiFetch<MeResponse>('/me'),
    enabled: auth.isAuthenticated,
    staleTime: 5 * 60_000,
  });

  // Try to use club's currentSeason dates if available
  const clubMember = me?.members.find((m) => m.clubId === auth.clubId);
  const clubName = clubMember?.club.name ?? 'Klub';
  const seasonConfig = clubMember?.club.config as
    | { currentSeasonFrom?: string; currentSeasonTo?: string }
    | undefined;

  const queryFrom = (seasonConfig?.currentSeasonFrom ?? `${from}T00:00:00Z`).includes('T')
    ? (seasonConfig?.currentSeasonFrom ?? `${from}T00:00:00Z`)
    : `${from}T00:00:00Z`;
  const queryTo = (seasonConfig?.currentSeasonTo ?? `${to}T23:59:59Z`).includes('T')
    ? (seasonConfig?.currentSeasonTo ?? `${to}T23:59:59Z`)
    : `${to}T23:59:59Z`;

  const { data, isLoading, isError } = useQuery<SeasonReportData, ApiError>({
    queryKey: ['reports', 'season', auth.clubId, queryFrom, queryTo],
    queryFn: () =>
      apiFetch<SeasonReportData>(
        `/reports/season?from=${encodeURIComponent(queryFrom)}&to=${encodeURIComponent(queryTo)}`,
      ),
    enabled: auth.isAuthenticated && !!auth.clubId,
  });

  const generatedAt = new Date().toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <>
      <PageHeader
        title="Zpráva o sezoně"
        subtitle="Přehled sezony — tisk nebo uložení jako PDF"
        actions={
          <Button size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" />
            Vytisknout / Uložit PDF
          </Button>
        }
      />

      {/* Date range picker */}
      <Card className="mb-4 no-print">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Od</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Do</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-5">
              <CalendarDays className="h-3.5 w-3.5" />
              <span>
                {seasonConfig?.currentSeasonFrom
                  ? 'Sezona z konfigurace klubu'
                  : 'Vlastní rozsah'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Nepodařilo se načíst data. Zkuste to prosím znovu.
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <style>{`
            @media print {
              .no-print { display: none !important; }
              .print-page { background: white !important; color: black !important; }
              body { background: white !important; }
              .sidebar, header, nav, [data-sidebar] { display: none !important; }
            }
          `}</style>

          <div ref={printRef} className="print-page space-y-6">
            {/* Header */}
            <div className="rounded-xl border border-border/50 bg-card p-6 print:border-0 print:p-0">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{clubName}</h1>
                  <p className="text-muted-foreground mt-1">Přehled sezony</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>
                    Období:{' '}
                    {data.period.from
                      ? new Date(data.period.from).toLocaleDateString('cs-CZ')
                      : '—'}{' '}
                    –{' '}
                    {data.period.to
                      ? new Date(data.period.to).toLocaleDateString('cs-CZ')
                      : '—'}
                  </p>
                  <p>Vygenerováno: {generatedAt}</p>
                </div>
              </div>
            </div>

            {/* Přehled sezony */}
            <Card>
              <CardHeader>
                <CardTitle>Přehled sezony</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Celkem událostí', value: data.eventStats.total },
                    {
                      label: 'Zápasů',
                      value: data.eventStats.byType['MATCH'] ?? 0,
                    },
                    {
                      label: 'Tréninků',
                      value: data.eventStats.byType['PRACTICE'] ?? 0,
                    },
                    {
                      label: 'Průměrná účast',
                      value: `${data.eventStats.avgAttendance} hráčů`,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="rounded-lg bg-secondary/40 p-4 text-center"
                    >
                      <div className="text-3xl font-bold tabular-nums">{value}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistiky docházky per tým */}
            <Card>
              <CardHeader>
                <CardTitle>Statistiky docházky</CardTitle>
              </CardHeader>
              <CardContent>
                {data.teamStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Žádné týmy</p>
                ) : (
                  <div className="space-y-4">
                    {data.teamStats.map((ts) => (
                      <div key={ts.teamId} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">{ts.teamName}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {ts.sport} · {ts.eventsCount} událostí
                            </span>
                          </div>
                        </div>
                        <AttendanceBar pct={ts.attendanceRate} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top členové */}
            {data.topMembers.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Nejaktivnější členové</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.topMembers.map((m, idx) => (
                      <div
                        key={m.memberId}
                        className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-2.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-5 text-center text-sm font-bold text-muted-foreground tabular-nums">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium">{m.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-xs text-muted-foreground">
                            {m.attendedCount}/{m.totalCount} událostí
                          </span>
                          <div className="w-24">
                            <AttendanceBar pct={m.attendanceRate} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Platební přehled */}
            <Card>
              <CardHeader>
                <CardTitle>Platební přehled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div className="rounded-lg bg-emerald-500/10 p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatAmount(
                        data.paymentSummary.totalCollectedCents,
                        data.paymentSummary.currency,
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Přijato celkem</div>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {formatAmount(
                        data.paymentSummary.totalOutstandingCents,
                        data.paymentSummary.currency,
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Čekající platby</div>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-4 text-center">
                    <div className="text-2xl font-bold tabular-nums">
                      {data.paymentSummary.paidCount + data.paymentSummary.pendingCount}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Celkem plateb</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground py-4">
              Sport Manager · {clubName} · {generatedAt}
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
