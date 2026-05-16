'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import {
  apiFetch,
  ApiError,
  type MemberDetail,
  type MemberStats,
  type MemberBadgesResponse,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext, isAdmin } from '@/lib/member-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PAYMENT_VARIANT, RSVP_VARIANT } from '@/lib/role-colors';
import { formatDate } from '@/lib/date-utils';
import { MemberHeader } from '@/components/admin/member/member-header';
import { MemberStatsTab } from '@/components/admin/member/member-stats-tab';
const MemberBadgesTab = dynamic(
  () => import('@/components/admin/member/member-badges-tab').then((m) => m.MemberBadgesTab),
  { ssr: false },
);
const MemberTeamsTab = dynamic(
  () => import('@/components/admin/member/member-teams-tab').then((m) => m.MemberTeamsTab),
  { ssr: false },
);

type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('en', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

export default function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { data: memberCtx } = useMemberContext();
  const canManage = memberCtx ? isAdmin(memberCtx) : false;

  const {
    data: m,
    isLoading,
    isError,
  } = useQuery<MemberDetail, ApiError>({
    queryKey: ['member', memberId, auth.clubId],
    queryFn: () => apiFetch<MemberDetail>(`/members/${memberId}`),
    enabled: auth.isAuthenticated && !!auth.clubId && !!memberId,
    retry: false,
  });

  const { data: stats } = useQuery<MemberStats, ApiError>({
    queryKey: ['member-stats', memberId, auth.clubId],
    queryFn: () => apiFetch<MemberStats>(`/members/${memberId}/stats`),
    enabled: auth.isAuthenticated && !!auth.clubId && !!memberId,
    retry: false,
  });

  const { data: badges } = useQuery<MemberBadgesResponse, ApiError>({
    queryKey: ['member-badges', memberId, auth.clubId],
    queryFn: () => apiFetch<MemberBadgesResponse>(`/members/${memberId}/badges`),
    enabled: auth.isAuthenticated && !!auth.clubId && !!memberId,
    retry: false,
  });

  const statusMutation = useMutation<{ id: string; status: string }, ApiError, MemberStatus>({
    mutationFn: (status) =>
      apiFetch<{ id: string; status: string }>(`/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['member', memberId, auth.clubId] });
      queryClient.invalidateQueries({ queryKey: ['members', auth.clubId] });
    },
  });

  if (isLoading) {
    return (
      <>
        <PageHeader title="Member" />
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-60" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (isError || !m) {
    return (
      <>
        <PageHeader
          title="Member"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/members">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Zpět
              </Link>
            </Button>
          }
        />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Nepodařilo se načíst profil člena
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`${m.firstName} ${m.lastName}`}
        subtitle={m.isMinor ? 'Nezletilý' : 'Dospělý člen'}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/members">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Zpět na členy
            </Link>
          </Button>
        }
      />

      <MemberHeader
        member={m}
        canManage={canManage}
        statusIsPending={statusMutation.isPending}
        statusIsError={statusMutation.isError}
        onStatusChange={(status) => statusMutation.mutate(status)}
      />

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Přehled</TabsTrigger>
          <TabsTrigger value="statistiky">Statistiky</TabsTrigger>
          <TabsTrigger value="attendance">Docházka</TabsTrigger>
          <TabsTrigger value="badges">Odznaky</TabsTrigger>
          <TabsTrigger value="payments">Platby</TabsTrigger>
          <TabsTrigger value="waivers">Souhlasy</TabsTrigger>
        </TabsList>

        {/* Overview — teams, guardians */}
        <TabsContent value="overview">
          <MemberTeamsTab member={m} />
        </TabsContent>

        {/* Statistiky */}
        <TabsContent value="statistiky">
          {stats ? (
            <MemberStatsTab stats={stats} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-xs text-muted-foreground">
                Statistiky nejsou k dispozici
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance">
          {m.recentAttendance.length > 0 && (
            <AttendanceStats attendance={m.recentAttendance} />
          )}
          <Card>
            {m.recentAttendance.length === 0 ? (
              <CardContent className="py-8 text-center text-xs text-muted-foreground">
                Žádné záznamy o docházce
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Událost</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Datum</TableHead>
                    <TableHead>RSVP</TableHead>
                    <TableHead>Přítomen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.recentAttendance.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{a.eventTitle}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{a.eventType}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(a.eventDate)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={RSVP_VARIANT[a.status] ?? 'default'}>{a.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {a.attended != null ? (
                          <Badge variant={a.attended ? 'success' : 'danger'}>
                            {a.attended ? 'Ano' : 'Ne'}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">--</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Badges */}
        <TabsContent value="badges">
          {badges ? (
            <MemberBadgesTab badges={badges} />
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-xs text-muted-foreground">
                Odznaky nejsou k dispozici
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Payments */}
        <TabsContent value="payments">
          <div className="space-y-3">
            {m.paymentsMade.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Provedené platby</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Poplatek</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead className="text-right">Částka</TableHead>
                      <TableHead>Stav</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {m.paymentsMade.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.feeName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.paidAt ? formatDate(p.paidAt) : 'Nezaplaceno'}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatCurrency(p.amountCents, p.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={PAYMENT_VARIANT[p.status] ?? 'default'}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {m.paymentsFor.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Platby za tohoto člena</CardTitle>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Poplatek</TableHead>
                      <TableHead>Zaplatil</TableHead>
                      <TableHead>Datum</TableHead>
                      <TableHead className="text-right">Částka</TableHead>
                      <TableHead>Stav</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {m.paymentsFor.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">{p.feeName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{p.paidBy}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {p.paidAt ? formatDate(p.paidAt) : 'Nezaplaceno'}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {formatCurrency(p.amountCents, p.currency)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={PAYMENT_VARIANT[p.status] ?? 'default'}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}

            {m.paymentsMade.length === 0 && m.paymentsFor.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-xs text-muted-foreground">
                  Žádné záznamy o platbách
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Waivers */}
        <TabsContent value="waivers">
          <Card>
            {m.waivers.length === 0 ? (
              <CardContent className="py-8 text-center text-xs text-muted-foreground">
                Žádné podepsané souhlasy
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Souhlas</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Podepsal</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {m.waivers.map((w, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{w.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{w.type}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{w.signedBy}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(w.signedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

// ── Attendance stats (inline — pod 50 řádků) ──

type AttendanceRecord = {
  eventTitle: string;
  eventType: string;
  eventDate: string;
  status: string;
  attended: boolean | null;
};

function attendanceColor(pct: number): string {
  if (pct >= 80) return 'bg-green-500/15 text-green-700 dark:text-green-400';
  if (pct >= 50) return 'bg-amber-500/15 text-amber-700 dark:text-amber-400';
  return 'bg-red-500/15 text-red-700 dark:text-red-400';
}

function AttendanceStats({ attendance }: { attendance: AttendanceRecord[] }) {
  const total = attendance.length;
  const withRecord = attendance.filter((a) => a.attended !== null);
  const attendedCount = withRecord.filter((a) => a.attended === true).length;
  const attendancePct =
    withRecord.length > 0 ? Math.round((attendedCount / withRecord.length) * 100) : null;

  const rsvpComparable = attendance.filter(
    (a) => a.attended !== null && (a.status === 'YES' || a.status === 'NO'),
  );
  const rsvpMatched = rsvpComparable.filter(
    (a) =>
      (a.status === 'YES' && a.attended === true) || (a.status === 'NO' && a.attended === false),
  ).length;
  const rsvpPct =
    rsvpComparable.length > 0
      ? Math.round((rsvpMatched / rsvpComparable.length) * 100)
      : null;

  const sorted = [...attendance].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );
  let streak = 0;
  for (const a of sorted) {
    if (a.attended === true) streak++;
    else if (a.attended === false) break;
  }

  const last10 = [...attendance]
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(-10);

  return (
    <div className="mb-3 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Celkem událostí</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Účast</div>
            {attendancePct !== null ? (
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums">{attendancePct}%</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${attendanceColor(attendancePct)}`}
                >
                  {attendancePct >= 80 ? 'Výborná' : attendancePct >= 50 ? 'Průměrná' : 'Nízká'}
                </span>
              </div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">Bez záznamu</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">RSVP spolehlivost</div>
            {rsvpPct !== null ? (
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-bold tabular-nums">{rsvpPct}%</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${attendanceColor(rsvpPct)}`}
                >
                  {rsvpComparable.length} zázn.
                </span>
              </div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">Nedostatek dat</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="shrink-0">
              <div className="text-xs text-muted-foreground">Aktuální série</div>
              <div className="mt-1 text-base font-semibold">
                {streak > 0 ? (
                  <span className="text-green-600 dark:text-green-400">
                    {streak}{' '}
                    {streak === 1 ? 'trénink' : streak < 5 ? 'tréninky' : 'tréninků'} v řadě
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
            {last10.length > 0 && (
              <div className="flex-1">
                <div className="mb-1 text-xs text-muted-foreground">
                  Posledních {last10.length} událostí
                </div>
                <div className="flex items-end gap-1 h-10">
                  {last10.map((a, i) => {
                    const colorClass =
                      a.attended === true
                        ? 'bg-green-500'
                        : a.attended === false
                          ? 'bg-red-400'
                          : 'bg-muted-foreground/25';
                    const title = `${a.eventTitle} (${formatDate(a.eventDate)}): ${a.attended === true ? 'Přítomen' : a.attended === false ? 'Nepřítomen' : 'Bez záznamu'}`;
                    return (
                      <div
                        key={i}
                        title={title}
                        className={`flex-1 rounded-sm ${colorClass} transition-opacity hover:opacity-75`}
                        style={{
                          height:
                            a.attended === true ? '100%' : a.attended === false ? '60%' : '25%',
                        }}
                      />
                    );
                  })}
                </div>
                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span>starší</span>
                  <span>nejnovější</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
