'use client';

import Link from 'next/link';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  Activity,
  Calendar,
  CheckCircle2,
  MessageCircle,
  UserPlus,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError, type ActivityItem } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ACTIVITY_ICON: Record<ActivityItem['type'], typeof Activity> = {
  event_created: Calendar,
  rsvp: CheckCircle2,
  member_joined: UserPlus,
  message: MessageCircle,
};

const ACTIVITY_COLOR: Record<ActivityItem['type'], string> = {
  event_created: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  rsvp: 'bg-green-500/15 text-green-600 dark:text-green-400',
  member_joined: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  message: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
};

const ACTIVITY_LABEL: Record<ActivityItem['type'], string> = {
  event_created: 'Událost',
  rsvp: 'RSVP',
  member_joined: 'Nový člen',
  message: 'Zpráva',
};

function formatTimestamp(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'právě teď';
  if (mins < 60) return `před ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `před ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `před ${days} d`;
  return new Date(ts).toLocaleDateString('cs-CZ', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function formatFullDate(ts: string): string {
  return new Date(ts).toLocaleDateString('cs-CZ', {
    weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit',
  });
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = ACTIVITY_ICON[item.type] ?? Activity;
  const colorClass = ACTIVITY_COLOR[item.type] ?? 'bg-secondary text-muted-foreground';
  const label = ACTIVITY_LABEL[item.type] ?? item.type;

  const inner = (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">{item.message}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground" title={formatFullDate(item.timestamp)}>
            {formatTimestamp(item.timestamp)}
          </span>
          <span className="text-[11px] text-muted-foreground/50">·</span>
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground/70">{label}</span>
        </div>
      </div>
    </div>
  );

  if (item.link) {
    return (
      <Link
        href={item.link as any}
        className="block px-4 py-3 transition-colors hover:bg-primary/[0.02]"
      >
        {inner}
      </Link>
    );
  }

  return <div className="px-4 py-3">{inner}</div>;
}

function ActivitySkeleton() {
  return (
    <div className="space-y-0 divide-y divide-border/30">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ActivityPage() {
  const auth = useAuth();

  const { data, isLoading, isFetchingNextPage, fetchNextPage, hasNextPage } =
    useInfiniteQuery<ActivityItem[], ApiError>({
      queryKey: ['activity', auth.clubId],
      queryFn: ({ pageParam }) =>
        apiFetch<ActivityItem[]>(`/dashboard/activity?limit=20${pageParam ? `&before=${pageParam}` : ''}`),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => {
        if (lastPage.length < 20) return undefined;
        return lastPage[lastPage.length - 1]?.timestamp;
      },
      enabled: auth.isAuthenticated && !!auth.clubId,
    });

  const allItems = data?.pages.flat() ?? [];

  return (
    <>
      <PageHeader
        title="Aktivita klubu"
        subtitle="Timeline dění — události, RSVP odpovědi, noví členové a zprávy"
      />

      <Card>
        {isLoading ? (
          <ActivitySkeleton />
        ) : allItems.length === 0 ? (
          <CardContent className="py-12 text-center">
            <Activity className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Zatím žádná aktivita</p>
          </CardContent>
        ) : (
          <div className="divide-y divide-border/30">
            {allItems.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </div>
        )}
      </Card>

      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? 'Načítám…' : 'Načíst další'}
          </Button>
        </div>
      )}
    </>
  );
}
