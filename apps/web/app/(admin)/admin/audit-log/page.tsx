'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, Clock, GitCompare, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext } from '@/lib/member-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type AuditEntry = {
  id: string;
  changedAt: string;
  reason: string | null;
  changedBy: { id: string; email: string; name: string };
  before: unknown;
  after: unknown;
};

type AuditResponse = {
  items: AuditEntry[];
  hasMore: boolean;
  nextCursor: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function DiffBlock({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="flex-1 min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <pre className="rounded-md bg-secondary/40 p-2 text-[11px] font-mono overflow-x-auto whitespace-pre-wrap break-all">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}

export default function AuditLogPage() {
  const auth = useAuth();
  const { data: memberCtx } = useMemberContext();

  const isAdminUser =
    memberCtx &&
    (memberCtx.clubRoles.includes('OWNER') || memberCtx.clubRoles.includes('ADMIN'));

  const { data, isLoading, isError, error } = useQuery<AuditResponse, ApiError>({
    queryKey: ['club-audit', auth.clubId],
    queryFn: () => apiFetch<AuditResponse>('/clubs/audit'),
    enabled: auth.isAuthenticated && !!auth.clubId && isAdminUser === true,
    retry: false,
  });

  if (memberCtx && !isAdminUser) {
    return (
      <>
        <PageHeader title="Audit log" />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="flex items-center gap-3 p-6">
            <ShieldAlert className="h-5 w-5 text-destructive" />
            <div>
              <div className="text-sm font-semibold text-destructive">Nedostatecna opravneni</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Audit log je dostupny pouze pro vlastniky a administratory klubu.
              </div>
            </div>
            <Button asChild variant="ghost" size="sm" className="ml-auto">
              <Link href="/admin/account">Zpet</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Audit log"
        subtitle="Historie zmen konfigurace a opravneni klubu"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/account">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Zpet na ucet
            </Link>
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Nepodarilo se nacist audit log: {error?.message}
          </CardContent>
        </Card>
      ) : !data || data.items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GitCompare className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Zatim zadne zaznamy v audit logu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {data.items.map((entry) => (
            <Card key={entry.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Header row */}
                <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3 bg-secondary/20">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="text-xs font-medium">{formatDate(entry.changedAt)}</span>
                  <span className="text-xs text-muted-foreground">
                    od <span className="font-semibold text-foreground">{entry.changedBy.name}</span>
                    <span className="ml-1 text-muted-foreground/60">({entry.changedBy.email})</span>
                  </span>
                  {entry.reason && (
                    <span className="ml-auto text-xs italic text-muted-foreground truncate max-w-[200px]">
                      {entry.reason}
                    </span>
                  )}
                </div>

                {/* Diff */}
                <div className="flex gap-3 p-4">
                  <DiffBlock label="Pred zmenou" value={entry.before} />
                  <div className="flex items-center justify-center shrink-0 pt-5">
                    <span className="text-muted-foreground/40 text-sm">→</span>
                  </div>
                  <DiffBlock label="Po zmene" value={entry.after} />
                </div>
              </CardContent>
            </Card>
          ))}

          {data.hasMore && (
            <div className="text-center py-2">
              <p className="text-xs text-muted-foreground">
                Zobrazeno {data.items.length} zaznamu. Dalsi zaznamy neni mozne zobrazit bez strankovani.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
