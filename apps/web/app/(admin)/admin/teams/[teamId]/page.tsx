'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Users } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError, type TeamDetail, type TeamRosterEntry } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ROLE_VARIANT, STATUS_VARIANT } from '@/lib/role-colors';

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
                Zpet na tymy
              </Link>
            </Button>
          }
        />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Nepodarilo se nacist detail tymu.
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
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/teams">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Zpet na tymy
            </Link>
          </Button>
        }
      />

      {/* Info karta */}
      <div className="grid gap-3 sm:grid-cols-4">
        <InfoTile label="Sport" value={team.sport} />
        <InfoTile label="Kategorie" value={team.ageGroup ?? '--'} />
        <InfoTile label="Sezona" value={team.season} />
        <InfoTile
          label="Celkem clenu"
          value={
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 font-mono text-sm font-bold text-primary">
              {team.memberCount}
            </span>
          }
        />
      </div>

      {/* Realizacni tym */}
      {coaches.length > 0 && (
        <Card className="gradient-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Realizacni tym</CardTitle>
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
      <Card className="overflow-hidden gradient-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Soupiska{players.length > 0 ? ` (${players.length})` : ''}
          </CardTitle>
        </CardHeader>

        {players.length === 0 ? (
          <CardContent className="py-8 text-center text-xs text-muted-foreground">
            <Users className="mx-auto mb-2 h-8 w-8 opacity-30" />
            Zadni hraci v tymu
          </CardContent>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-wider">Hrac</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Role</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Dres</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Pozice</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Stav</TableHead>
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
                        <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
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
    </>
  );
}

function InfoTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card className="gradient-card">
      <CardContent className="p-4">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="mt-1 text-sm font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}

function CoachChip({ member }: { member: TeamRosterEntry }) {
  return (
    <Link href={`/admin/members/${member.memberId}` as any}>
      <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 transition-colors hover:bg-secondary/60">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-primary/10 text-[10px] font-bold text-primary">
            {member.firstName[0]}{member.lastName[0]}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="text-xs font-medium">{member.firstName} {member.lastName}</div>
          <div className="text-[10px] text-muted-foreground">{ROLE_LABEL[member.role] ?? member.role}</div>
        </div>
        <Badge variant={ROLE_VARIANT[member.role] ?? 'default'} className="ml-1 text-[10px]">
          {member.role.replace(/_/g, ' ')}
        </Badge>
      </div>
    </Link>
  );
}
