'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Users } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/empty-state';
import { apiFetch, ApiError, type TeamSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ROLE_VARIANT } from '@/lib/role-colors';

export default function TeamsPage() {
  const auth = useAuth();

  const { data, isLoading, isError, error } = useQuery<TeamSummary[], ApiError>({
    queryKey: ['teams', auth.clubId],
    queryFn: () => apiFetch<TeamSummary[]>('/teams'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    retry: false,
  });

  return (
    <>
      <PageHeader
        title="Týmy"
        subtitle="Soupiska, realizační tým a týmové konverzace."
        actions={
          <Button size="sm" asChild>
            <Link href="/admin/teams/new">+ Nový tým</Link>
          </Button>
        }
      />

      {!auth.isAuthenticated ? (
        <EmptyState
          icon={Users}
          title="Přihlaste se pro zobrazení týmů"
          description="Pro načtení týmů je potřeba přihlášená relace s aktivním kontextem klubu."
          cta={
            <Button asChild size="sm">
              <Link href="/login">Přihlásit se</Link>
            </Button>
          }
        />
      ) : isLoading ? (
        <Card>
          <div className="p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="ml-auto h-5 w-8" />
              </div>
            ))}
          </div>
        </Card>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <div className="p-4 text-sm text-destructive">
            Nepodařilo se načíst týmy: {error?.message ?? 'neznámá chyba'}
          </div>
        </Card>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Zatím nemáte žádné týmy"
          description="Vytvořte první tým, přiřaďte trenéra a přidejte hráče."
          tip="Tip: Přiřaďte členy do týmů pro lepší organizaci tréninků a zápasů."
          cta={
            <Button size="sm" asChild>
              <Link href="/admin/teams/new">
                <Plus className="mr-1 h-4 w-4" />
                Vytvořit první tým
              </Link>
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden ">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-[11px] uppercase tracking-wider">Tým</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider">Kategorie</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider">Sezona</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider">Trenéři</TableHead>
                <TableHead className="text-right text-[11px] uppercase tracking-wider">Hráči</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((team) => (
                <TableRow key={team.id} className="group border-border/30 transition-colors hover:bg-primary/[0.03]">
                  <TableCell>
                    <Link
                      href={`/admin/teams/${team.id}` as any}
                      className="font-semibold transition-colors group-hover:text-primary hover:underline"
                    >
                      {team.name}
                    </Link>
                    <div className="text-xs text-muted-foreground">{team.sport}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-primary/20 font-mono">
                      {team.ageGroup ?? '--'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-xs text-muted-foreground">
                    {team.season}
                  </TableCell>
                  <TableCell>
                    {team.coaches.length === 0 ? (
                      <span className="text-xs text-muted-foreground/50">--</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {team.coaches.map((c) => (
                          <Badge
                            key={`${c.memberId}-${c.role}`}
                            variant={ROLE_VARIANT[c.role] ?? 'default'}
                          >
                            {c.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 font-mono tabular-nums text-sm font-bold text-primary">
                      {team.memberCount}
                    </span>
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
