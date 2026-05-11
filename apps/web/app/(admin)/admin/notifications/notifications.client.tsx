'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CalendarDays,
  Clock,
  MessageSquare,
  CreditCard,
  Megaphone,
  FileText,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/empty-state';
import { apiFetch, ApiError, type NotificationItem, type NotificationsResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/* ── Icon & color per type ──────────────────────────── */

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  EVENT_CREATED: { icon: CalendarDays, color: 'text-emerald-500 bg-emerald-500/15' },
  EVENT_UPDATED: { icon: CalendarDays, color: 'text-amber-500 bg-amber-500/15' },
  EVENT_CANCELLED: { icon: X, color: 'text-red-500 bg-red-500/15' },
  RSVP_REMINDER: { icon: Clock, color: 'text-orange-500 bg-orange-500/15' },
  MESSAGE: { icon: MessageSquare, color: 'text-blue-500 bg-blue-500/15' },
  PAYMENT_DUE: { icon: CreditCard, color: 'text-red-500 bg-red-500/15' },
  PAYMENT_RECEIVED: { icon: CreditCard, color: 'text-emerald-500 bg-emerald-500/15' },
  ANNOUNCEMENT: { icon: Megaphone, color: 'text-violet-500 bg-violet-500/15' },
  WAIVER_PENDING: { icon: FileText, color: 'text-orange-500 bg-orange-500/15' },
  GENERAL: { icon: AlertCircle, color: 'text-muted-foreground bg-secondary' },
};

/* ── Time formatting ─────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'právě teď';
  if (mins < 60) return `před ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `před ${hours} ${hours === 1 ? 'hodinou' : hours < 5 ? 'hodinami' : 'hodinami'}`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `před ${days} ${days === 1 ? 'dnem' : days < 5 ? 'dny' : 'dny'}`;
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

/* ── Filter tabs ─────────────────────────────────────── */

type Filter = 'all' | 'unread';

function FilterTabs({ active, onChange }: { active: Filter; onChange: (f: Filter) => void }) {
  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-border/60 bg-card">
      {(['all', 'unread'] as Filter[]).map((f, i) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium transition-colors',
            i > 0 && 'border-l border-border/60',
            active === f
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:bg-muted/50',
          )}
        >
          {f === 'all' ? 'Vše' : 'Nepřečtené'}
        </button>
      ))}
    </div>
  );
}

/* ── Notification row ────────────────────────────────── */

function NotificationRow({
  item,
  onRead,
}: {
  item: NotificationItem;
  onRead: (id: string) => void;
}) {
  const router = useRouter();
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.GENERAL!;
  const Icon = config.icon;

  function handleClick() {
    if (!item.read) onRead(item.id);
    if (item.link) router.push(item.link as Parameters<typeof router.push>[0]);
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-4 rounded-xl border border-border/50 bg-card px-4 py-4 text-left transition-all hover:border-primary/30 hover:shadow-sm',
        !item.read && 'bg-primary/[0.02]',
        item.link && 'cursor-pointer',
        !item.link && 'cursor-default',
      )}
    >
      {/* Unread indicator */}
      <div className="flex shrink-0 items-center self-stretch">
        <div
          className={cn(
            'h-2 w-2 rounded-full',
            !item.read ? 'bg-primary' : 'bg-transparent',
          )}
        />
      </div>

      {/* Type icon */}
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          config.color,
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            'text-sm leading-snug',
            !item.read ? 'font-semibold text-foreground' : 'font-medium text-foreground/70',
          )}
        >
          {item.title}
        </p>
        {item.body && (
          <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground/70">{timeAgo(item.createdAt)}</p>
      </div>
    </button>
  );
}

/* ── Skeleton loader ─────────────────────────────────── */

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border/50 bg-card px-4 py-4">
      <div className="flex shrink-0 items-center self-stretch">
        <div className="h-2 w-2 rounded-full bg-secondary" />
      </div>
      <div className="h-10 w-10 shrink-0 rounded-full bg-secondary animate-pulse" />
      <div className="flex-1 space-y-2 py-1">
        <div className="h-4 w-2/3 rounded bg-secondary animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-secondary animate-pulse" />
        <div className="h-3 w-24 rounded bg-secondary animate-pulse" />
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────── */

export default function NotificationsPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('all');

  const unreadOnly = filter === 'unread';

  const { data, isLoading, isError } = useQuery<NotificationsResponse, ApiError>({
    queryKey: ['notifications-page', auth.clubId, unreadOnly],
    queryFn: () =>
      apiFetch<NotificationsResponse>(
        `/notifications?limit=50${unreadOnly ? '&unreadOnly=true' : ''}`,
      ),
    enabled: auth.isAuthenticated && !!auth.clubId,
    staleTime: 10_000,
    retry: false,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () =>
      apiFetch('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications-page'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const items = data?.items ?? [];
  const hasUnread = items.some((n) => !n.read);

  return (
    <>
      <PageHeader
        title="Oznámení"
        subtitle="Přehled vašich oznámení"
        actions={
          <div className="flex items-center gap-2">
            <FilterTabs active={filter} onChange={setFilter} />
            {hasUnread && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Přečíst vše
              </Button>
            )}
          </div>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <NotificationSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Oznámení se nepodařilo načíst.
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="Žádná oznámení"
          description={
            unreadOnly
              ? 'Nemáte žádná nepřečtená oznámení.'
              : 'Zatím jste neobdrželi žádná oznámení.'
          }
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <NotificationRow
              key={item.id}
              item={item}
              onRead={(id) => markReadMutation.mutate(id)}
            />
          ))}
          {data?.hasMore && (
            <p className="pt-2 text-center text-xs text-muted-foreground">
              Zobrazeno posledních 50 oznámení.
            </p>
          )}
        </div>
      )}
    </>
  );
}
