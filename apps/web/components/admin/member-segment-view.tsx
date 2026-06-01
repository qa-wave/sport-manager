'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, Volleyball, ClipboardList, HeartHandshake, type LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/empty-state';
import { MemberListSkeleton } from '@/components/admin/skeleton-loaders';
import { apiFetch, ApiError, type MemberSummary } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROLE_VARIANT, STATUS_VARIANT } from '@/lib/role-colors';

export type MemberSegment = 'players' | 'coaches' | 'parents';

const COACH_ROLES = ['HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER', 'MEDIC'];

interface SegmentConfig {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  /** Third column header + cell renderer (segment-specific). */
  col3: string;
  match: (m: MemberSummary) => boolean;
}

const SEGMENTS: Record<MemberSegment, SegmentConfig> = {
  players: {
    title: 'Hráči',
    subtitle: 'Členové s hráčskou rolí v týmu',
    icon: Volleyball,
    col3: 'Týmy',
    match: (m) => m.teamRoles.some((tr) => tr.role === 'PLAYER'),
  },
  coaches: {
    title: 'Trenéři',
    subtitle: 'Hlavní a asistentští trenéři, vedoucí týmů, zdravotníci',
    icon: ClipboardList,
    col3: 'Role',
    match: (m) => m.teamRoles.some((tr) => COACH_ROLES.includes(tr.role)),
  },
  parents: {
    title: 'Rodiče',
    subtitle: 'Rodiče a zákonní zástupci hráčů',
    icon: HeartHandshake,
    col3: 'Děti',
    match: (m) => m.guardianOf.length > 0,
  },
};

function age(dob: string | null): string {
  if (!dob) return '--';
  const d = new Date(dob);
  if (Number.isNaN(d.getTime())) return '--';
  const diff = Date.now() - d.getTime();
  return String(Math.floor(diff / (365.25 * 24 * 3600 * 1000)));
}

export function MemberSegmentView({ segment }: { segment: MemberSegment }) {
  const cfg = SEGMENTS[segment];
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery<MemberSummary[], ApiError>({
    queryKey: ['members'],
    queryFn: () => apiFetch<MemberSummary[]>('/members'),
  });

  const filtered = useMemo(() => {
    const inSegment = (data ?? []).filter(cfg.match);
    const q = search.trim().toLowerCase();
    if (!q) return inSegment;
    return inSegment.filter(
      (m) =>
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q),
    );
  }, [data, search, cfg]);

  return (
    <>
      <PageHeader title={cfg.title} subtitle={cfg.subtitle} />

      <div className="relative mt-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Hledat v sekci ${cfg.title.toLowerCase()}…`}
          className="pl-9"
        />
      </div>

      {isLoading ? (
        <MemberListSkeleton />
      ) : isError ? (
        <EmptyState title="Nepodařilo se načíst data" description="Zkuste to prosím znovu." />
      ) : filtered.length === 0 ? (
        <EmptyState title={`Žádní ${cfg.title.toLowerCase()}`} description="V této sekci zatím nikdo není." />
      ) : (
        <Card className="mt-4 overflow-hidden">
          <div className="border-b border-border/40 px-4 py-2.5 text-xs font-medium text-muted-foreground">
            {filtered.length} {cfg.title.toLowerCase()}
          </div>
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-[11px] uppercase tracking-wider">Jméno</TableHead>
                <TableHead className="w-14 text-[11px] uppercase tracking-wider">Věk</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider">{cfg.col3}</TableHead>
                <TableHead className="w-20 text-[11px] uppercase tracking-wider">Stav</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow
                  key={m.id}
                  data-testid="member-row"
                  className="group cursor-pointer border-border/30 transition-colors hover:bg-primary/[0.03]"
                  onClick={() => router.push(`/admin/members/${m.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 ring-1 ring-border/50 transition-all group-hover:ring-primary/30">
                        {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt="" />}
                        <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                          {m.firstName[0]}{m.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-semibold transition-colors group-hover:text-primary">
                          {m.firstName} {m.lastName}
                        </div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-xs text-muted-foreground">
                    {age(m.dateOfBirth)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {segment === 'parents' ? (
                        m.guardianOf.length > 0 ? (
                          m.guardianOf.map((g) => (
                            <Badge key={g.memberId} variant="info">{g.name}</Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground/40">--</span>
                        )
                      ) : segment === 'coaches' ? (
                        m.teamRoles
                          .filter((tr) => COACH_ROLES.includes(tr.role))
                          .map((tr) => (
                            <Badge key={`${tr.teamId}-${tr.role}`} variant={ROLE_VARIANT[tr.role] ?? 'default'}>
                              {tr.teamName} · {tr.role.replace(/_/g, ' ')}
                            </Badge>
                          ))
                      ) : (
                        m.teamRoles
                          .filter((tr) => tr.role === 'PLAYER')
                          .map((tr) => (
                            <Badge key={tr.teamId} variant="outline">{tr.teamName}</Badge>
                          ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[m.status] ?? 'default'}>{m.status}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </>
  );
}
