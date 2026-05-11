'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { CreditCard, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext } from '@/lib/member-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type PaymentItem = {
  id: string;
  feeName: string;
  payerName: string;
  onBehalfOfName: string | null;
  amountCents: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
};

type PaymentsResponse = { items: PaymentItem[] };

const STATUS_VARIANT: Record<string, string> = {
  PAID: 'success',
  PENDING: 'warning',
  PROCESSING: 'info',
  FAILED: 'danger',
  REFUNDED: 'outline',
};

const STATUS_LABEL: Record<string, string> = {
  PAID: 'Zaplaceno',
  PENDING: 'Ceka',
  PROCESSING: 'Zpracovava se',
  FAILED: 'Selhalo',
  REFUNDED: 'Vraceno',
};

function formatAmount(cents: number, currency: string): string {
  return new Intl.NumberFormat('cs-CZ', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// PayButton — visible only for PENDING payments to the payer themselves.
// ---------------------------------------------------------------------------
function PayButton({ paymentId }: { paymentId: string }) {
  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{ url: string }>('/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ paymentId }),
      }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  return (
    <Button
      size="sm"
      variant="default"
      className="h-7 text-xs"
      disabled={mutation.isPending}
      onClick={() => mutation.mutate()}
    >
      {mutation.isPending ? (
        'Pripojuji...'
      ) : (
        <>
          <ExternalLink className="mr-1 h-3 w-3" />
          Zaplatit
        </>
      )}
      {mutation.isError && (
        <span className="sr-only">Chyba platby</span>
      )}
    </Button>
  );
}

export default function PaymentsPage() {
  const auth = useAuth();
  const { data: memberCtx } = useMemberContext();

  const { data, isLoading, isError } = useQuery<PaymentsResponse, ApiError>({
    queryKey: ['payments', auth.clubId],
    queryFn: () => apiFetch<PaymentsResponse>('/payments'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    retry: false,
  });

  // Determine if the current user is an admin/finance role.
  const isAdmin =
    memberCtx?.clubRoles.includes('OWNER') ||
    memberCtx?.clubRoles.includes('ADMIN') ||
    memberCtx?.clubRoles.includes('FINANCE');

  return (
    <>
      <PageHeader title="Platby" subtitle="Prehled prispevku a plateb" />

      {isLoading && (
        <Card>
          <CardContent className="space-y-3 p-6">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      )}

      {isError && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Nepodarilo se nacist platby.
          </CardContent>
        </Card>
      )}

      {data && data.items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CreditCard className="h-10 w-10 text-muted-foreground/30" />
            <div className="text-sm font-medium text-muted-foreground">
              Zadne platby
            </div>
            <div className="text-xs text-muted-foreground/60">
              Platby se zobrazi, jakmile budou vytvoreny prispevky.
            </div>
          </CardContent>
        </Card>
      )}

      {data && data.items.length > 0 && (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-[10px] uppercase tracking-wider">
                  Prispevek
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">
                  Platce
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">
                  Za
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider text-right">
                  Castka
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">
                  Stav
                </TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">
                  Datum
                </TableHead>
                {/* Action column — shown when at least one payment is actionable */}
                <TableHead className="text-[10px] uppercase tracking-wider" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((p) => (
                <TableRow key={p.id} className="border-border/30">
                  <TableCell className="text-sm font-medium">
                    {p.feeName}
                  </TableCell>
                  <TableCell className="text-sm">{p.payerName}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.onBehalfOfName ?? '\u2014'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatAmount(p.amountCents, p.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={(STATUS_VARIANT[p.status] ?? 'default') as any}
                      className="text-[10px]"
                    >
                      {STATUS_LABEL[p.status] ?? p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {p.paidAt ? formatDate(p.paidAt) : formatDate(p.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    {/* Show "Zaplatit" to non-admins for their own pending payments */}
                    {p.status === 'PENDING' && !isAdmin && (
                      <PayButton paymentId={p.id} />
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
