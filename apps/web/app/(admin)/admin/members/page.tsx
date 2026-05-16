'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Download, Filter, Search, Upload, UserCircle, UserPlus } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/empty-state';
import { MemberListSkeleton } from '@/components/admin/skeleton-loaders';
import { apiFetch, ApiError, type MemberSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext, isAdmin } from '@/lib/member-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROLE_VARIANT, STATUS_VARIANT } from '@/lib/role-colors';
import { CsvImportDialog } from '@/components/members/csv-import-dialog';

function exportMembersCSV(members: MemberSummary[]) {
  const BOM = '\uFEFF';
  const header = 'Jméno;Příjmení;Email;Věk;Dres;Pozice;Stav;Týmy;Role\n';
  const rows = members
    .map((m) =>
      [
        m.firstName,
        m.lastName,
        m.email,
        m.dateOfBirth ? age(m.dateOfBirth) : '',
        m.jerseyNumber ?? '',
        m.position ?? '',
        m.status,
        m.teamRoles.map((t) => t.teamName).join(', '),
        m.clubRoles.join(', '),
      ].join(';')
    )
    .join('\n');

  const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clenove-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function age(dob: string | null): string {
  if (!dob) return '--';
  const y = new Date().getFullYear() - new Date(dob).getFullYear();
  return `${y} let`;
}

const STATUS_OPTIONS = [
  { value: '', label: 'Vše' },
  { value: 'ACTIVE', label: 'Aktivní' },
  { value: 'INACTIVE', label: 'Neaktivní' },
  { value: 'INVITED', label: 'Čeká na pozvánku' },
];

const ROLE_OPTIONS = [
  { value: '', label: 'Vše' },
  { value: 'PLAYER', label: 'Hráč' },
  { value: 'COACH', label: 'Trenér' },
  { value: 'PARENT', label: 'Rodič' },
  { value: 'ADMIN', label: 'Admin' },
];

function NativeSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm shadow-sm transition-colors hover:border-primary/40 focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
        aria-label={placeholder}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export default function MembersPage() {
  const auth = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [teamFilter, setTeamFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const { data: memberCtx } = useMemberContext();
  const canManage = memberCtx ? isAdmin(memberCtx) : false;

  const { data, isLoading, isError } = useQuery<MemberSummary[], ApiError>({
    queryKey: ['members', auth.clubId],
    queryFn: () => apiFetch<MemberSummary[]>('/members'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    retry: false,
  });

  // Derive unique team options from data
  const teamOptions = useMemo(() => {
    if (!data) return [{ value: '', label: 'Vše' }];
    const names = Array.from(
      new Set(data.flatMap((m) => m.teamRoles.map((tr) => tr.teamName)))
    ).sort();
    return [{ value: '', label: 'Vše' }, ...names.map((n) => ({ value: n, label: n }))];
  }, [data]);

  const hasActiveFilters = search.trim() || statusFilter || teamFilter || roleFilter;

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((m) => {
      // Text search
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesText =
          m.firstName.toLowerCase().includes(q) ||
          m.lastName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q);
        if (!matchesText) return false;
      }

      // Status filter
      if (statusFilter && m.status !== statusFilter) return false;

      // Team filter
      if (teamFilter && !m.teamRoles.some((tr) => tr.teamName === teamFilter)) return false;

      // Role filter — match against clubRoles or teamRoles
      if (roleFilter) {
        const hasClubRole = m.clubRoles.some((r) => r.includes(roleFilter));
        const hasTeamRole = m.teamRoles.some((tr) => tr.role.includes(roleFilter));
        const isParent = roleFilter === 'PARENT' && m.guardianOf.length > 0;
        if (!hasClubRole && !hasTeamRole && !isParent) return false;
      }

      return true;
    });
  }, [data, search, statusFilter, teamFilter, roleFilter]);

  const showData = auth.isAuthenticated && data && data.length > 0;

  return (
    <>
      <CsvImportDialog open={importOpen} onClose={() => setImportOpen(false)} />

      <PageHeader
        title="Členové"
        subtitle={`${data?.length ?? '--'} členů v klubu`}
        actions={
          canManage ? (
            <div className="flex items-center gap-2">
              {data && data.length > 0 && (
                <Button size="sm" variant="outline" onClick={() => exportMembersCSV(data)}>
                  <Download className="mr-1.5 h-4 w-4" />
                  Export CSV
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                <Upload className="mr-1.5 h-4 w-4" />
                Import CSV
              </Button>
              <Button size="sm" asChild>
                <Link href="/admin/members/new">
                  <UserPlus className="mr-1.5 h-4 w-4" />
                  Přidat člena
                </Link>
              </Button>
            </div>
          ) : undefined
        }
      />

      {/* Filter bar */}
      {showData && (
        <div className="space-y-3">
          {/* Desktop: inline filter bar */}
          <div className="hidden sm:flex items-center gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Hledat podle jména nebo e-mailu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>

            {/* Status */}
            <div className="w-44">
              <NativeSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={STATUS_OPTIONS}
                placeholder="Stav"
              />
            </div>

            {/* Team */}
            <div className="w-44">
              <NativeSelect
                value={teamFilter}
                onChange={setTeamFilter}
                options={teamOptions}
                placeholder="Tým"
              />
            </div>

            {/* Role */}
            <div className="w-36">
              <NativeSelect
                value={roleFilter}
                onChange={setRoleFilter}
                options={ROLE_OPTIONS}
                placeholder="Role"
              />
            </div>

            {/* Result count + clear */}
            <div className="ml-auto flex items-center gap-3">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {hasActiveFilters ? (
                  <><span className="font-semibold text-foreground">{filtered.length}</span> z {data.length} členů</>
                ) : (
                  <><span className="font-semibold text-foreground">{data.length}</span> členů</>
                )}
              </span>
              {hasActiveFilters && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => { setSearch(''); setStatusFilter(''); setTeamFilter(''); setRoleFilter(''); }}
                >
                  Zrušit filtry
                </Button>
              )}
            </div>
          </div>

          {/* Mobile: search + collapsible filters */}
          <div className="sm:hidden space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Hledat..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Button
                size="sm"
                variant={filtersOpen || (statusFilter || teamFilter || roleFilter) ? 'default' : 'outline'}
                className="h-9 gap-1.5 shrink-0"
                onClick={() => setFiltersOpen((v) => !v)}
              >
                <Filter className="h-3.5 w-3.5" />
                Filtry
                {(statusFilter || teamFilter || roleFilter) && (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                    {[statusFilter, teamFilter, roleFilter].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </div>

            {filtersOpen && (
              <div className="grid grid-cols-1 gap-2 rounded-lg border border-border/50 bg-card/50 p-3">
                <NativeSelect value={statusFilter} onChange={setStatusFilter} options={STATUS_OPTIONS} placeholder="Stav" />
                <NativeSelect value={teamFilter} onChange={setTeamFilter} options={teamOptions} placeholder="Tým" />
                <NativeSelect value={roleFilter} onChange={setRoleFilter} options={ROLE_OPTIONS} placeholder="Role" />
                {hasActiveFilters && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 text-xs text-muted-foreground"
                    onClick={() => { setSearch(''); setStatusFilter(''); setTeamFilter(''); setRoleFilter(''); setFiltersOpen(false); }}
                  >
                    Zrušit vše
                  </Button>
                )}
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              {hasActiveFilters ? (
                <><span className="font-semibold text-foreground">{filtered.length}</span> z {data.length} členů</>
              ) : (
                <><span className="font-semibold text-foreground">{data.length}</span> členů</>
              )}
            </div>
          </div>
        </div>
      )}

      {!auth.isAuthenticated ? (
        <EmptyState
          icon={UserCircle}
          title="Přihlaste se pro zobrazení členů"
          description="Vyžaduje přihlášenou relaci."
          cta={
            <Button asChild size="sm">
              <Link href="/login">Přihlásit se</Link>
            </Button>
          }
        />
      ) : isLoading ? (
        <MemberListSkeleton />
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <div className="p-4 text-sm text-destructive">Nepodařilo se načíst členy</div>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={UserCircle}
          title={hasActiveFilters ? 'Žádné výsledky' : 'Zatím nemáte žádné členy'}
          description={
            hasActiveFilters
              ? 'Žádní členové neodpovídají zvoleným filtrům.'
              : 'Přidejte první členy a začněte budovat svůj tým.'
          }
          tip={!hasActiveFilters ? 'Tip: Sdílejte invite link a členové se přidají sami bez nutnosti zadávat hesla.' : undefined}
          cta={
            hasActiveFilters ? (
              <Button size="sm" variant="outline" onClick={() => { setSearch(''); setStatusFilter(''); setTeamFilter(''); setRoleFilter(''); }}>
                Zrušit filtry
              </Button>
            ) : canManage ? (
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button size="sm" asChild>
                  <Link href="/admin/members/new">
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Pozvat členy
                  </Link>
                </Button>
                <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>
                  <Upload className="mr-1.5 h-4 w-4" />
                  Importovat z CSV
                </Button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <Card className="overflow-hidden ">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-10 text-[11px] uppercase tracking-wider">#</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider">Jméno</TableHead>
                <TableHead className="w-14 text-[11px] uppercase tracking-wider">Věk</TableHead>
                <TableHead className="w-14 text-[11px] uppercase tracking-wider">Pos</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider">Týmy a role</TableHead>
                <TableHead className="w-20 text-[11px] uppercase tracking-wider">Stav</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((m) => (
                <TableRow
                  key={m.id}
                  className="group cursor-pointer border-border/30 transition-colors hover:bg-primary/[0.03]"
                  onClick={() => router.push(`/admin/members/${m.id}`)}
                >
                  <TableCell className="font-mono tabular-nums text-xs font-bold text-primary/70">
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
                  <TableCell className="font-mono tabular-nums text-xs text-muted-foreground">
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
