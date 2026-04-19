'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, type HealthResponse } from '@/lib/api';
import { cn } from '@/lib/utils';

export function ApiStatus() {
  const { data, isError, isLoading } = useQuery<HealthResponse>({
    queryKey: ['health'],
    queryFn: () => apiFetch<HealthResponse>('/health'),
    refetchInterval: 10_000,
  });

  const ok = !isError && data?.status === 'ok';

  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isLoading && 'bg-muted-foreground animate-pulse',
          ok && 'bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.5)]',
          isError && 'bg-destructive'
        )}
      />
      <span>{isLoading ? '...' : ok ? 'API ok' : 'API down'}</span>
    </div>
  );
}
