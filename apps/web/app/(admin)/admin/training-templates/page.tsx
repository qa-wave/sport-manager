'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Plus, Repeat } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/empty-state';
import { apiFetch, ApiError, type TrainingTemplateListItem } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const DAY_LABELS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];

const EVENT_TYPE_LABEL: Record<string, string> = {
  PRACTICE: 'Trénink',
  MATCH: 'Zápas',
  TOURNAMENT: 'Turnaj',
  MEETING: 'Schůzka',
  SOCIAL: 'Akce',
};

function DayBadges({ days }: { days: number[] }) {
  const sorted = [...days].sort((a, b) => a - b);
  return (
    <div className="flex flex-wrap gap-1">
      {sorted.map((d) => (
        <span
          key={d}
          className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
        >
          {DAY_LABELS[d]}
        </span>
      ))}
    </div>
  );
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric' });
}

export default function TrainingTemplatesPage() {
  const auth = useAuth();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery<TrainingTemplateListItem[], ApiError>({
    queryKey: ['training-templates', auth.clubId],
    queryFn: () => apiFetch<TrainingTemplateListItem[]>('/training-templates'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    retry: false,
  });

  return (
    <>
      <PageHeader
        title="Šablony tréninků"
        subtitle={data ? `${data.length} šablon` : undefined}
        actions={
          <Button size="sm" asChild>
            <Link href="/admin/training-templates/new">
              <Plus className="mr-1 h-4 w-4" />Nová šablona
            </Link>
          </Button>
        }
      />

      {!auth.isAuthenticated ? (
        <EmptyState
          icon={Repeat}
          title="Přihlaste se pro zobrazení šablon"
          description="Vyžaduje přihlášenou session."
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
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="ml-auto h-5 w-16" />
              </div>
            ))}
          </div>
        </Card>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <div className="p-4 text-sm text-destructive">Nepodařilo se načíst šablony.</div>
        </Card>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="Žádné šablony"
          description="Vytvořte první šablonu tréninků pro automatické generování událostí."
          cta={
            <Button asChild size="sm">
              <Link href="/admin/training-templates/new">
                <Plus className="mr-1 h-4 w-4" />Nová šablona
              </Link>
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden gradient-card">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-wider">Název</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Tým</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Dny</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Čas</TableHead>
                <TableHead className="w-24 text-[10px] uppercase tracking-wider">Platnost</TableHead>
                <TableHead className="w-20 text-center text-[10px] uppercase tracking-wider">Události</TableHead>
                <TableHead className="w-20 text-[10px] uppercase tracking-wider">Stav</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((tpl) => (
                <TableRow
                  key={tpl.id}
                  className="group cursor-pointer border-border/30 transition-colors hover:bg-primary/[0.03]"
                  onClick={() => router.push(`/admin/training-templates/${tpl.id}`)}
                >
                  <TableCell>
                    <div className="font-semibold text-sm transition-colors group-hover:text-primary">
                      {tpl.name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {EVENT_TYPE_LABEL[tpl.eventType] ?? tpl.eventType}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {tpl.teamName}
                  </TableCell>
                  <TableCell>
                    <DayBadges days={tpl.daysOfWeek} />
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {tpl.startTime}–{tpl.endTime}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div>{formatDate(tpl.validFrom)}</div>
                    <div>{formatDate(tpl.validUntil)}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm font-bold">{tpl.upcomingEventsCount}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {tpl.generatedEventsCount} celkem
                    </div>
                  </TableCell>
                  <TableCell>
                    {tpl.active ? (
                      <Badge variant="success">Aktivní</Badge>
                    ) : (
                      <Badge variant="default">Pozastaveno</Badge>
                    )}
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
