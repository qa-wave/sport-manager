'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRightLeft, Check, ChevronLeft, Pencil, Users, BarChart2, TrendingUp, TrendingDown } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError, type TeamDetail, type TeamRosterEntry, type TeamStats, type TeamSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext } from '@/lib/member-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ROLE_VARIANT, STATUS_VARIANT } from '@/lib/role-colors';
import { AttendanceHeatmap } from '@/components/admin/attendance-heatmap';
import { TeamStatsDashboard } from '@/components/admin/team-stats-dashboard';

const ROLE_LABEL: Record<string, string> = {
  PLAYER: 'Hráč',
  HEAD_COACH: 'Hlavní trenér',
  ASSISTANT_COACH: 'Asistent trenéra',
  TEAM_MANAGER: 'Manažer',
  MEDIC: 'Zdravotník',
};

const COACHING_ROLES = new Set(['HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER']);

export default function TeamDetailPage() {
  const { teamId } = useParams<{ teamId: string }>();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { data: memberCtx } = useMemberContext();
  const [editing, setEditing] = useState(false);
  const isAdminUser = memberCtx && (memberCtx.clubRoles.includes('OWNER') || memberCtx.clubRoles.includes('ADMIN'));

  const { data: team, isLoading, isError } = useQuery<TeamDetail, ApiError>({
    queryKey: ['team', teamId, auth.clubId],
    queryFn: () => apiFetch<TeamDetail>(`/teams/${teamId}`),
    enabled: auth.isAuthenticated && !!auth.clubId && !!teamId,
    retry: false,
  });

  if (isLoading) {
    return (
      <>
        <PageHeader title="Tým" />
        <Card>
          <CardContent className="p-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="ml-auto h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </>
    );
  }

  if (isError || !team) {
    return (
      <>
        <PageHeader
          title="Tým"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/teams">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Zpět na týmy
              </Link>
            </Button>
          }
        />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Nepodařilo se načíst detail týmu.
          </CardContent>
        </Card>
      </>
    );
  }

  const coaches = team.roster.filter((m) => COACHING_ROLES.has(m.role));
  const players = team.roster.filter((m) => !COACHING_ROLES.has(m.role));

  // All teams in club (for transfer select)
  const { data: allTeams } = useQuery<TeamSummary[], ApiError>({
    queryKey: ['teams', auth.clubId],
    queryFn: () => apiFetch<TeamSummary[]>('/teams'),
    enabled: auth.isAuthenticated && !!auth.clubId && isAdminUser === true,
    retry: false,
  });
  const otherTeams = (allTeams ?? []).filter((t) => t.id !== teamId);

  return (
    <>
      <PageHeader
        title={team.name}
        subtitle={`${team.sport}${team.ageGroup ? ` · ${team.ageGroup}` : ''} · Sezona ${team.season}`}
        actions={
          <div className="flex gap-2">
            {isAdminUser && (
              <Button variant="outline" size="sm" onClick={() => setEditing(!editing)}>
                <Pencil className="mr-1 h-3 w-3" />
                {editing ? 'Zrušit' : 'Upravit'}
              </Button>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/teams">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Zpět
              </Link>
            </Button>
          </div>
        }
      />

      {editing && team && <TeamEditForm team={team} teamId={teamId} onDone={() => setEditing(false)} />}

      {/* Info karta */}
      <div className="grid gap-3 sm:grid-cols-4">
        <InfoTile label="Sport" value={team.sport} />
        <InfoTile label="Kategorie" value={team.ageGroup ?? '--'} />
        <InfoTile label="Sezona" value={team.season} />
        <InfoTile
          label="Celkem členů"
          value={
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 font-mono tabular-nums text-sm font-bold text-primary">
              {team.memberCount}
            </span>
          }
        />
      </div>

      {/* Taby — Soupiska / Statistiky / Docházka */}
      <Tabs defaultValue="roster">
        <TabsList>
          <TabsTrigger value="roster">Soupiska</TabsTrigger>
          {(isAdminUser || memberCtx?.teamRoles.some((r) => r.teamId === teamId && ['HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'].includes(r.role))) && (
            <TabsTrigger value="stats">Statistiky</TabsTrigger>
          )}
          <TabsTrigger value="attendance">Docházka</TabsTrigger>
        </TabsList>

        {/* TAB: Soupiska */}
        <TabsContent value="roster" className="space-y-4">
          {/* Realizační tým */}
          {coaches.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Realizační tým</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {coaches.map((c) => (
                    <CoachChip key={c.membershipId} member={c} />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Soupiska hráčů */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                Hráči{players.length > 0 ? ` (${players.length})` : ''}
              </CardTitle>
            </CardHeader>

            {players.length === 0 ? (
              <CardContent className="py-8 text-center text-xs text-muted-foreground">
                <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
                Žádní hráči v týmu
              </CardContent>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-[11px] uppercase tracking-widest">Hráč</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-widest">Role</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-widest">Dres</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-widest">Pozice</TableHead>
                    <TableHead className="text-[11px] uppercase tracking-widest">Stav</TableHead>
                    {isAdminUser && otherTeams.length > 0 && (
                      <TableHead className="text-[11px] uppercase tracking-widest">Přesun</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {players.map((m) => (
                    <TableRow
                      key={m.membershipId}
                      className="group border-border/30 transition-colors hover:bg-primary/[0.03]"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="bg-primary/10 text-[11px] font-bold text-primary">
                              {m.firstName[0]}{m.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <Link
                            href={`/admin/members/${m.memberId}` as any}
                            className="text-sm font-medium transition-colors hover:text-primary"
                          >
                            {m.firstName} {m.lastName}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ROLE_VARIANT[m.role] ?? 'default'}>
                          {ROLE_LABEL[m.role] ?? m.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {m.jerseyNumber != null ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                            {m.jerseyNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">--</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {m.position ?? '--'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_VARIANT[m.status] ?? 'default'}>
                          {m.status}
                        </Badge>
                      </TableCell>
                      {isAdminUser && otherTeams.length > 0 && (
                        <TableCell>
                          <TransferMemberSelect
                            memberId={m.memberId}
                            fromTeamId={teamId}
                            otherTeams={otherTeams}
                          />
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Quick stats pod soupiskou (coach/admin) */}
          {(isAdminUser || memberCtx?.teamRoles.some((r) => r.teamId === teamId && ['HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'].includes(r.role))) && (
            <CoachStatsSection teamId={teamId} />
          )}
        </TabsContent>

        {/* TAB: Statistiky */}
        {(isAdminUser || memberCtx?.teamRoles.some((r) => r.teamId === teamId && ['HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'].includes(r.role))) && (
          <TabsContent value="stats">
            <TeamStatsDashboard teamId={teamId} />
          </TabsContent>
        )}

        {/* TAB: Docházka */}
        <TabsContent value="attendance">
          <AttendanceHeatmap teamId={teamId} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function InfoTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="">
      <CardContent className="p-4">
        <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function TeamEditForm({ team, teamId, onDone }: { team: TeamDetail; teamId: string; onDone: () => void }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(team.name);
  const [sport, setSport] = useState(team.sport);
  const [ageGroup, setAgeGroup] = useState(team.ageGroup ?? '');
  const [season, setSeason] = useState(team.season);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/teams/${teamId}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, sport, ageGroup: ageGroup || null, season }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onDone();
    },
  });

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Název</label>
            <Input value={name} onChange={e => setName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Sport</label>
            <Input value={sport} onChange={e => setSport(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Kategorie</label>
            <Input value={ageGroup} onChange={e => setAgeGroup(e.target.value)} className="h-8 text-sm" placeholder="U13" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Sezona</label>
            <Input value={season} onChange={e => setSeason(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onDone}>Zrušit</Button>
          <Button size="sm" className="h-7 text-xs" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Ukládám...' : 'Uložit'}
          </Button>
        </div>
        {mutation.isError && <p className="text-xs text-destructive">Nepodařilo se uložit.</p>}
      </CardContent>
    </Card>
  );
}

function CoachStatsSection({ teamId }: { teamId: string }) {
  const auth = useAuth();
  const { data: stats, isLoading } = useQuery<TeamStats, ApiError>({
    queryKey: ['team-stats', teamId, auth.clubId],
    queryFn: () => apiFetch<TeamStats>(`/teams/${teamId}/stats`),
    enabled: auth.isAuthenticated && !!auth.clubId && !!teamId,
    retry: false,
  });

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Statistiky</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !stats ? null : (
          <>
            {/* Stat cards row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-center">
                <div className="text-xl font-bold text-primary">{stats.totalEvents}</div>
                <div className="text-[11px] text-muted-foreground">Událostí</div>
                <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                  {stats.totalPractices} trénink · {stats.totalMatches} zápas
                </div>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-center">
                <div className="text-xl font-bold text-emerald-500">{stats.avgAttendance}%</div>
                <div className="text-[11px] text-muted-foreground">Průměrná docházka</div>
              </div>
              <div className="rounded-lg border border-border/50 bg-secondary/20 p-3 text-center">
                <div className="text-xl font-bold text-blue-500">{stats.rsvpReliability}%</div>
                <div className="text-[11px] text-muted-foreground">RSVP spolehlivost</div>
              </div>
            </div>

            {/* Top/Bottom attenders */}
            {(stats.topAttenders.length > 0 || stats.worstAttenders.length > 0) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-emerald-600">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Nejlepší docházka
                  </div>
                  <div className="space-y-1.5">
                    {stats.topAttenders.map((a) => (
                      <div key={a.name} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="truncate text-xs font-medium">{a.name}</span>
                            <span className="shrink-0 text-xs font-bold text-emerald-600">{a.rate}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-emerald-100 dark:bg-emerald-950">
                            <div
                              className="h-1.5 rounded-full bg-emerald-500"
                              style={{ width: `${a.rate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-amber-600">
                    <TrendingDown className="h-3.5 w-3.5" />
                    Potřebují pozornost
                  </div>
                  <div className="space-y-1.5">
                    {stats.worstAttenders.map((a) => (
                      <div key={a.name} className="flex items-center gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="truncate text-xs font-medium">{a.name}</span>
                            <span className="shrink-0 text-xs font-bold text-amber-600">{a.rate}%</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-amber-100 dark:bg-amber-950">
                            <div
                              className="h-1.5 rounded-full bg-amber-500"
                              style={{ width: `${a.rate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Monthly trend bar chart */}
            {stats.monthlyTrend.length > 0 && (
              <div>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Trend docházky (6 měsíců)
                </div>
                <div className="flex items-end gap-1.5 h-20">
                  {stats.monthlyTrend.map((m) => (
                    <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-primary">{m.attendance > 0 ? `${m.attendance}%` : ''}</span>
                      <div className="w-full flex items-end" style={{ height: '3rem' }}>
                        <div
                          className="w-full rounded-t bg-primary/60 transition-all"
                          style={{ height: `${Math.max(m.attendance, 2)}%`, minHeight: m.attendance > 0 ? '4px' : '2px' }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{m.month}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.totalEvents === 0 && (
              <p className="text-center text-xs text-muted-foreground py-4">
                Zatím žádná data — statistiky se zobrazí po prvních událostech.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Transfer member select
// ---------------------------------------------------------------------------

function TransferMemberSelect({
  memberId,
  fromTeamId,
  otherTeams,
}: {
  memberId: string;
  fromTeamId: string;
  otherTeams: TeamSummary[];
}) {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const [selected, setSelected] = useState('');
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: (toTeamId: string) =>
      apiFetch(`/teams/${toTeamId}/transfer-member`, {
        method: 'POST',
        body: JSON.stringify({ memberId, fromTeamId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', fromTeamId] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      setSelected('');
      setDone(true);
    },
  });

  if (done) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
        <Check className="h-3 w-3" />
        Přesunuto
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value)}
        className="h-7 rounded border border-input bg-background px-2 text-xs text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        disabled={mutation.isPending}
      >
        <option value="">Přesunout do...</option>
        {otherTeams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      {selected && (
        <button
          onClick={() => mutation.mutate(selected)}
          disabled={mutation.isPending}
          className="inline-flex h-7 items-center gap-1 rounded bg-primary/10 px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
        >
          <ArrowRightLeft className="h-3 w-3" />
          {mutation.isPending ? '...' : 'OK'}
        </button>
      )}
      {mutation.isError && (
        <span className="text-[10px] text-destructive">Chyba</span>
      )}
    </div>
  );
}

function CoachChip({ member }: { member: TeamRosterEntry }) {
  return (
    <Link href={`/admin/members/${member.memberId}` as any}>
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 transition-colors hover:bg-secondary/60">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-primary/10 text-[11px] font-bold text-primary">
            {member.firstName[0]}{member.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="text-xs font-medium">{member.firstName} {member.lastName}</div>
          <div className="text-[11px] text-muted-foreground">{ROLE_LABEL[member.role] ?? member.role}</div>
        </div>
        <Badge variant={ROLE_VARIANT[member.role] ?? 'default'} className="ml-1 text-[11px]">
          {member.role.replace(/_/g, ' ')}
        </Badge>
      </div>
    </Link>
  );
}
