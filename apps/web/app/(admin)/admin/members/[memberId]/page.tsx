'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError, type MemberDetail } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext, isAdmin } from '@/lib/member-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROLE_VARIANT, PAYMENT_VARIANT, STATUS_VARIANT, RSVP_VARIANT } from '@/lib/role-colors';

type MemberStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ARCHIVED';

const STATUS_OPTIONS: Array<{ value: MemberStatus; label: string }> = [
  { value: 'ACTIVE', label: 'Aktivní' },
  { value: 'INACTIVE', label: 'Neaktivní' },
  { value: 'SUSPENDED', label: 'Pozastavený' },
  { value: 'ARCHIVED', label: 'Archivovaný' },
];

function formatDate(d: string | null): string {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatCurrency(cents: number, currency: string): string {
  return new Intl.NumberFormat('en', { style: 'currency', currency, minimumFractionDigits: 0 }).format(cents / 100);
}

function memberAge(dob: string | null): string | null {
  if (!dob) return null;
  return `${new Date().getFullYear() - new Date(dob).getFullYear()}`;
}

export default function MemberProfilePage() {
  const { memberId } = useParams<{ memberId: string }>();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { data: memberCtx } = useMemberContext();
  const canManage = memberCtx ? isAdmin(memberCtx) : false;

  const { data: m, isLoading, isError } = useQuery<MemberDetail, ApiError>({
    queryKey: ['member', memberId, auth.clubId],
    queryFn: () => apiFetch<MemberDetail>(`/members/${memberId}`),
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
              <Link href="/admin/members"><ChevronLeft className="mr-1 h-4 w-4" />Zpět</Link>
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

  const ageStr = memberAge(m.dateOfBirth);

  return (
    <>
      <PageHeader
        title={`${m.firstName} ${m.lastName}`}
        subtitle={m.isMinor ? 'Nezletilý' : 'Dospělý člen'}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/members"><ChevronLeft className="mr-1 h-4 w-4" />Zpět na členy</Link>
          </Button>
        }
      />

      {/* Hero card */}
      <Card className="relative overflow-hidden ">
        {/* Sport accent gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-cyan-500/[0.02]" />
        <CardContent className="relative p-6">
          <div className="flex items-start gap-5">
            <div className="relative">
              <Avatar className="h-16 w-16 ring-2 ring-primary/20 ring-offset-2 ring-offset-card">
                <AvatarFallback className="bg-primary/15 text-lg font-bold text-primary">
                  {m.firstName[0]}{m.lastName[0]}
                </AvatarFallback>
              </Avatar>
              {m.jerseyNumber != null && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground shadow-sm">
                  {m.jerseyNumber}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-lg font-bold tracking-tight">{m.firstName} {m.lastName}</h2>
                {canManage ? (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Stav:</span>
                    <select
                      value={m.status}
                      disabled={statusMutation.isPending}
                      onChange={(e) => statusMutation.mutate(e.target.value as MemberStatus)}
                      className="h-7 rounded-md border border-input bg-transparent px-2 py-0 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {statusMutation.isPending && (
                      <span className="text-[11px] text-muted-foreground">Ukládám...</span>
                    )}
                    {statusMutation.isError && (
                      <span className="text-[11px] text-destructive">Chyba</span>
                    )}
                  </div>
                ) : (
                  <Badge variant={STATUS_VARIANT[m.status] ?? 'default'}>{m.status}</Badge>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>{m.email}</span>
                {m.phone && <span>{m.phone}</span>}
                {ageStr && <span className="font-medium text-foreground/70">{ageStr} let</span>}
                {m.dateOfBirth && <span>Narozen {formatDate(m.dateOfBirth)}</span>}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {m.position && (
                  <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
                    {m.position}
                  </Badge>
                )}
                {m.clubRoles.map((r) => (
                  <Badge key={r} variant={ROLE_VARIANT[r] ?? 'default'}>{r}</Badge>
                ))}
              </div>
            </div>
            <div className="hidden text-right text-xs text-muted-foreground sm:block">
              <div className="rounded-md bg-secondary/50 px-2.5 py-1.5">
                <div className="font-medium text-foreground/80">Přidal se {formatDate(m.joinedAt)}</div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wide">{m.locale}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed content */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Přehled</TabsTrigger>
          <TabsTrigger value="attendance">Docházka</TabsTrigger>
          <TabsTrigger value="payments">Platby</TabsTrigger>
          <TabsTrigger value="waivers">Souhlasy</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid gap-3 lg:grid-cols-2">
            {/* Teams */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Týmy a role</CardTitle>
              </CardHeader>
              <CardContent>
                {m.teamRoles.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Žádná přiřazení k týmu</p>
                ) : (
                  <div className="space-y-2">
                    {m.teamRoles.map((tr) => (
                      <div key={`${tr.teamId}-${tr.role}`} className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium">{tr.teamName}</div>
                          <div className="text-xs text-muted-foreground">
                            {(tr as any).sport} · {(tr as any).season}{tr.ageGroup ? ` · ${tr.ageGroup}` : ''}
                          </div>
                        </div>
                        <Badge variant={ROLE_VARIANT[tr.role] ?? 'default'}>
                          {tr.role.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Guardians */}
            {m.guardians.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Zákonní zástupci</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(m.guardians as any[]).map((g: any) => (
                    <div key={g.memberId}>
                      <div className="flex items-center justify-between">
                        <Link href={`/admin/members/${g.memberId}` as any} className="text-sm font-medium hover:text-primary">
                          {g.name}
                        </Link>
                        <div className="flex gap-1">
                          {g.isPrimary && <Badge variant="success">PRIMÁRNÍ</Badge>}
                          <Badge variant="outline">{g.relationship}</Badge>
                        </div>
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{g.email}{g.phone ? ` · ${g.phone}` : ''}</div>
                      <div className="mt-1 flex gap-2 text-xs">
                        <PermBadge label="Platby (zobrazit)" on={g.canViewPayments} />
                        <PermBadge label="Platby (provést)" on={g.canMakePayments} />
                        <PermBadge label="Zdravotní" on={g.canViewMedical} />
                        <PermBadge label="Souhlasy" on={g.canSignWaivers} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Guardian of */}
            {m.guardianOf.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Zákonný zástupce ({m.guardianOf.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(m.guardianOf as any[]).map((c: any) => (
                    <div key={c.memberId}>
                      <div className="flex items-center justify-between">
                        <Link href={`/admin/members/${c.memberId}` as any} className="text-sm font-medium hover:text-primary">
                          {c.name}
                        </Link>
                        {c.jerseyNumber != null && (
                          <Badge variant="outline" className="font-mono">#{c.jerseyNumber}</Badge>
                        )}
                      </div>
                      {c.teams?.length > 0 && (
                        <div className="mt-0.5 text-xs text-muted-foreground">{c.teams.join(' · ')}</div>
                      )}
                      <div className="mt-1 flex gap-2 text-xs">
                        <PermBadge label="Platby" on={c.canViewPayments} />
                        <PermBadge label="Zdravotní" on={c.canViewMedical} />
                        <PermBadge label="Souhlasy" on={c.canSignWaivers} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Medical notes */}
            {m.medicalNotes && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Zdravotní poznámky</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{m.medicalNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>
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
                      <TableCell className="text-xs text-muted-foreground">{formatDate(a.eventDate)}</TableCell>
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
                        <TableCell className="text-xs text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : 'Nezaplaceno'}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{formatCurrency(p.amountCents, p.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={PAYMENT_VARIANT[p.status] ?? 'default'}>{p.status}</Badge>
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
                        <TableCell className="text-xs text-muted-foreground">{p.paidAt ? formatDate(p.paidAt) : 'Nezaplaceno'}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">{formatCurrency(p.amountCents, p.currency)}</TableCell>
                        <TableCell>
                          <Badge variant={PAYMENT_VARIANT[p.status] ?? 'default'}>{p.status}</Badge>
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
                      <TableCell className="text-xs text-muted-foreground">{formatDate(w.signedAt)}</TableCell>
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

// ---------- Attendance statistics ----------

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

  // Percentage attended (where attended is not null)
  const withRecord = attendance.filter((a) => a.attended !== null);
  const attendedCount = withRecord.filter((a) => a.attended === true).length;
  const attendancePct = withRecord.length > 0 ? Math.round((attendedCount / withRecord.length) * 100) : null;

  // RSVP reliability: RSVP matched actual outcome
  // YES + attended=true, NO + attended=false, MAYBE/PENDING excluded (unclear intent)
  const rsvpComparable = attendance.filter(
    (a) => a.attended !== null && (a.status === 'YES' || a.status === 'NO'),
  );
  const rsvpMatched = rsvpComparable.filter(
    (a) => (a.status === 'YES' && a.attended === true) || (a.status === 'NO' && a.attended === false),
  ).length;
  const rsvpPct =
    rsvpComparable.length > 0 ? Math.round((rsvpMatched / rsvpComparable.length) * 100) : null;

  // Current consecutive streak (most-recent first — assume array is newest first)
  // Sort defensively by date desc
  const sorted = [...attendance].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );
  let streak = 0;
  for (const a of sorted) {
    if (a.attended === true) {
      streak++;
    } else if (a.attended === false) {
      break;
    }
    // attended === null → skip (no record), don't break streak
  }

  // Last 10 events for mini bar chart (chronological order, oldest first)
  const last10 = [...attendance]
    .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    .slice(-10);

  return (
    <div className="mb-3 space-y-3">
      {/* Stat cards */}
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
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${attendanceColor(attendancePct)}`}>
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
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${attendanceColor(rsvpPct)}`}>
                  {rsvpComparable.length} zázn.
                </span>
              </div>
            ) : (
              <div className="mt-1 text-sm text-muted-foreground">Nedostatek dat</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Streak + mini bar chart */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            {/* Streak */}
            <div className="shrink-0">
              <div className="text-xs text-muted-foreground">Aktuální série</div>
              <div className="mt-1 text-base font-semibold">
                {streak > 0 ? (
                  <span className="text-green-600 dark:text-green-400">{streak} {streak === 1 ? 'trénink' : streak < 5 ? 'tréninky' : 'tréninků'} v řadě</span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>

            {/* Mini bar chart — last 10 events */}
            {last10.length > 0 && (
              <div className="flex-1">
                <div className="mb-1 text-xs text-muted-foreground">Posledních {last10.length} událostí</div>
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
                        style={{ height: a.attended === true ? '100%' : a.attended === false ? '60%' : '25%' }}
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

function PermBadge({ label, on }: { label: string; on: boolean }) {
  return (
    <span className={on ? 'text-accent-foreground' : 'text-muted-foreground line-through opacity-50'}>
      {label}
    </span>
  );
}
