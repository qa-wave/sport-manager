'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Search, UserCircle } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/empty-state';
import { apiFetch, ApiError, type MemberSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROLE_VARIANT, STATUS_VARIANT } from '@/lib/role-colors';

function age(dob: string | null): string {
  if (!dob) return '--';
  const y = new Date().getFullYear() - new Date(dob).getFullYear();
  return `${y}y`;
}

export default function MembersPage() {
  const auth = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery<MemberSummary[], ApiError>({
    queryKey: ['members', auth.clubId],
    queryFn: () => apiFetch<MemberSummary[]>('/members'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    retry: false,
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter(
      (m) =>
        m.firstName.toLowerCase().includes(q) ||
        m.lastName.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [data, search]);

  return (
    <>
      <PageHeader
        title="Members"
        subtitle={`${data?.length ?? '--'} members in club`}
      />

      {/* Search */}
      {auth.isAuthenticated && data && data.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {!auth.isAuthenticated ? (
        <EmptyState
          icon={UserCircle}
          title="Sign in to see members"
          description="Requires authenticated session."
          cta={
            <Button asChild size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          }
        />
      ) : isLoading ? (
        <Card>
          <div className="p-4 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-12" />
                <Skeleton className="h-5 w-10" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="ml-auto h-5 w-14" />
              </div>
            ))}
          </div>
        </Card>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <div className="p-4 text-sm text-destructive">Failed to load members</div>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title={search ? 'No matches' : 'No members'}
          description={search ? `No members matching "${search}".` : 'No members found in this club.'}
        />
      ) : (
        <Card className="overflow-hidden ">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-10 text-[11px] uppercase tracking-wider">#</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider">Name</TableHead>
                <TableHead className="w-14 text-[11px] uppercase tracking-wider">Age</TableHead>
                <TableHead className="w-14 text-[11px] uppercase tracking-wider">Pos</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider">Teams & Roles</TableHead>
                <TableHead className="w-20 text-[11px] uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow
                  key={m.id}
                  className="group cursor-pointer border-border/30 transition-colors hover:bg-primary/[0.03]"
                  onClick={() => router.push(`/admin/members/${m.id}`)}
                >
                  <TableCell className="font-mono text-xs font-bold text-primary/70">
                    {m.jerseyNumber ?? <span className="text-muted-foreground/50">--</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <Avatar className="h-8 w-8 ring-1 ring-border/50 transition-all group-hover:ring-primary/30">
                        <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                          {m.firstName[0]}{m.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-semibold transition-colors group-hover:text-primary">{m.firstName} {m.lastName}</div>
                        <div className="text-xs text-muted-foreground">{m.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {age(m.dateOfBirth)}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-muted-foreground">
                    {m.position ?? <span className="text-muted-foreground/40">--</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {m.clubRoles.map((r) => (
                        <Badge key={r} variant={ROLE_VARIANT[r] ?? 'default'}>
                          {r}
                        </Badge>
                      ))}
                      {m.teamRoles.map((tr) => (
                        <Badge
                          key={`${tr.teamId}-${tr.role}`}
                          variant={ROLE_VARIANT[tr.role] ?? 'default'}
                        >
                          {tr.teamName} · {tr.role.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {m.guardianOf.length > 0 && (
                        <Badge variant="warning">
                          Guardian x {m.guardianOf.length}
                        </Badge>
                      )}
                    </div>
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
        </Card>
      )}
    </>
  );
}
