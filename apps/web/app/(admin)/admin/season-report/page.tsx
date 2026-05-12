'use client';

import { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError, type EventSummary, type MeResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type TeamSummary = {
  id: string;
  name: string;
  sport: string;
  memberCount: number;
};

type PaymentItem = {
  id: string;
  feeName: string;
  payerName: string;
  amountCents: number;
  currency: string;
  status: string;
};

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('cs-CZ', { style: 'currency', currency }).format(cents / 100);
}

function AttendanceBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-10 text-right text-xs font-medium tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  );
}

export default function SeasonReportPage() {
  const auth = useAuth();
  const printRef = useRef<HTMLDivElement>(null);

  const { data: events, isLoading: eventsLoading } = useQuery<EventSummary[], ApiError>({
    queryKey: ['events', 'report', auth.clubId],
    queryFn: () => apiFetch<EventSummary[]>('/events?from=2024-01-01T00:00:00Z'),
    enabled: auth.isAuthenticated && !!auth.clubId,
  });

  const { data: teams, isLoading: teamsLoading } = useQuery<TeamSummary[], ApiError>({
    queryKey: ['teams', auth.clubId],
    queryFn: () => apiFetch<TeamSummary[]>('/teams'),
    enabled: auth.isAuthenticated && !!auth.clubId,
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery<{ items: PaymentItem[] }, ApiError>({
    queryKey: ['payments', auth.clubId],
    queryFn: () => apiFetch<{ items: PaymentItem[] }>('/payments'),
    enabled: auth.isAuthenticated && !!auth.clubId,
  });

  const { data: me } = useQuery<MeResponse, ApiError>({
    queryKey: ['me', auth.accessToken],
    queryFn: () => apiFetch<MeResponse>('/me'),
    enabled: auth.isAuthenticated,
  });

  const isLoading = eventsLoading || teamsLoading || paymentsLoading;

  // Derived stats
  const totalEvents = events?.length ?? 0;
  const matchEvents = events?.filter((e) => e.type === 'MATCH').length ?? 0;
  const practiceEvents = events?.filter((e) => e.type === 'PRACTICE').length ?? 0;
  const avgRsvp =
    events && events.length > 0
      ? Math.round(events.reduce((sum, e) => sum + e.rsvpSummary.yes, 0) / events.length)
      : 0;

  const paidPayments = payments?.items.filter((p) => p.status === 'PAID') ?? [];
  const totalRevenueCents = paidPayments.reduce((sum, p) => sum + p.amountCents, 0);
  const pendingPayments = payments?.items.filter((p) => p.status === 'PENDING') ?? [];

  // Per-team stats
  const teamStats = teams?.map((team) => {
    const teamEvents = events?.filter((e) => e.teamId === team.id) ?? [];
    const totalRsvpYes = teamEvents.reduce((sum, e) => sum + e.rsvpSummary.yes, 0);
    const totalRsvpTotal = teamEvents.reduce((sum, e) => sum + e.rsvpSummary.total, 0);
    const attendancePct = totalRsvpTotal > 0 ? Math.round((totalRsvpYes / totalRsvpTotal) * 100) : 0;
    return { team, teamEvents, attendancePct };
  }) ?? [];

  const clubMember = me?.members.find((m) => m.clubId === auth.clubId);
  const clubName = clubMember?.club.name ?? 'Klub';

  const generatedAt = new Date().toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  function handlePrint() {
    window.print();
  }

  return (
    <>
      <PageHeader
        title="Zpráva o sezoně"
        subtitle="Přehled sezony — tisk nebo uložení jako PDF"
        actions={
          <Button size="sm" onClick={handlePrint}>
            <Printer className="mr-1.5 h-4 w-4" />Vytisknout / Uložit PDF
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <>
          {/* Print styles — injected as a style tag; Tailwind @media print works for screen */}
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
                  <p>Vygenerováno: {generatedAt}</p>
                </div>
              </div>
            </div>

            {/* Přehled sezony */}
            <Card>
              <CardHeader><CardTitle>Přehled sezony</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {[
                    { label: 'Celkem událostí', value: totalEvents },
                    { label: 'Zápasů', value: matchEvents },
                    { label: 'Tréninků', value: practiceEvents },
                    { label: 'Průměrná účast', value: `${avgRsvp} hráčů` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-secondary/40 p-4 text-center">
                      <div className="text-3xl font-bold tabular-nums">{value}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistiky docházky per tým */}
            <Card>
              <CardHeader><CardTitle>Statistiky docházky</CardTitle></CardHeader>
              <CardContent>
                {teamStats.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Žádné týmy</p>
                ) : (
                  <div className="space-y-4">
                    {teamStats.map(({ team, teamEvents, attendancePct }) => (
                      <div key={team.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-sm">{team.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">
                              {team.sport} · {team.memberCount} členů · {teamEvents.length} událostí
                            </span>
                          </div>
                        </div>
                        <AttendanceBar pct={attendancePct} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Platební přehled */}
            <Card>
              <CardHeader><CardTitle>Platební přehled</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 mb-4">
                  <div className="rounded-lg bg-emerald-500/10 p-4 text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {formatAmount(totalRevenueCents, 'CZK')}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Přijato celkem</div>
                  </div>
                  <div className="rounded-lg bg-amber-500/10 p-4 text-center">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                      {pendingPayments.length}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">Čekající platby</div>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-4 text-center">
                    <div className="text-2xl font-bold tabular-nums">{(payments?.items.length ?? 0)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">Celkem plateb</div>
                  </div>
                </div>

                {(payments?.items.length ?? 0) > 0 && (
                  <div className="overflow-hidden rounded-lg border border-border/50">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border/50 bg-muted/30">
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Člen</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Popis</th>
                          <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Částka</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stav</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments!.items.map((p) => (
                          <tr key={p.id} className="border-b border-border/30 last:border-0">
                            <td className="px-3 py-2 font-medium">{p.payerName}</td>
                            <td className="px-3 py-2 text-muted-foreground">{p.feeName}</td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium">
                              {formatAmount(p.amountCents, p.currency)}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                p.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-amber-500/15 text-amber-600'
                              }`}>
                                {p.status === 'PAID' ? 'Zaplaceno' : 'Čeká'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Výsledky zápasů */}
            {matchEvents > 0 && (
              <Card>
                <CardHeader><CardTitle>Výsledky zápasů</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {events!
                      .filter((e) => e.type === 'MATCH')
                      .map((e) => (
                        <div
                          key={e.id}
                          className="flex items-center justify-between rounded-lg border border-border/40 px-4 py-2.5"
                        >
                          <div>
                            <span className="text-sm font-medium">{e.title}</span>
                            {e.opponent && (
                              <span className="ml-2 text-xs text-muted-foreground">vs {e.opponent}</span>
                            )}
                          </div>
                          <div className="text-right text-xs text-muted-foreground">
                            {new Date(e.startsAt).toLocaleDateString('cs-CZ', {
                              weekday: 'short', day: 'numeric', month: 'short',
                            })}
                            {e.location && <span className="ml-2">{e.location}</span>}
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Footer */}
            <div className="text-center text-xs text-muted-foreground py-4">
              Sport Manager · {clubName} · {generatedAt}
            </div>
          </div>
        </>
      )}
    </>
  );
}
