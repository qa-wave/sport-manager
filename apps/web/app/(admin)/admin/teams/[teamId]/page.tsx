'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Pencil, Users } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError, type TeamDetail, type TeamRosterEntry } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext } from '@/lib/member-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ROLE_VARIANT, STATUS_VARIANT } from '@/lib/role-colors';
import { AttendanceHeatmap } from '@/components/admin/attendance-heatmap';

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

      {/* Realizacni tym */}
      {coaches.length > 0 && (
        <Card className="">
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

      {/* Soupiska */}
      <Card className="overflow-hidden ">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Soupiska{players.length > 0 ? ` (${players.length})` : ''}
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
                <TableHead className="text-[11px] uppercase tracking-widest">Hrac</TableHead>
                <TableHead className="text-[11px] uppercase tracking-widest">Role</TableHead>
                <TableHead className="text-[11px] uppercase tracking-widest">Dres</TableHead>
                <TableHead className="text-[11px] uppercase tracking-widest">Pozice</TableHead>
                <TableHead className="text-[11px] uppercase tracking-widest">Stav</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Heatmap docházky */}
      <AttendanceHeatmap teamId={teamId} />
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
