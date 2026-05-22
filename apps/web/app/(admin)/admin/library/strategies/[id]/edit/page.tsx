'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StrategyEditor } from '@/components/admin/strategy-editor';
import { apiFetch, type StrategyDto } from '@/lib/api';

export default function EditStrategyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const query = useQuery({
    queryKey: ['strategy', id],
    queryFn: () => apiFetch<StrategyDto>(`/strategies/${id}`),
  });

  if (query.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href={'/admin/library/strategies' as never}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zpět
          </Link>
        </Button>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Strategie nenalezena.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (query.data.source === 'BUILTIN') {
    return (
      <div className="space-y-4">
        <Button variant="outline" asChild>
          <Link href={`/admin/library/strategies/${id}` as never}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zpět na detail
          </Link>
        </Button>
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Knihovní strategie nelze upravovat.
          </CardContent>
        </Card>
      </div>
    );
  }

  return <StrategyEditor mode="edit" initial={query.data} />;
}
