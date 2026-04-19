'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Bell,
  CalendarDays,
  MessageCircle,
  CreditCard,
  Megaphone,
  FileCheck,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import {
  apiFetch,
  type NotificationsResponse,
  type UnreadCountResponse,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';

/* ── Icon & color per type ──────────────────────────── */

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  EVENT_CREATED: { icon: CalendarDays, color: 'text-emerald-500 bg-emerald-500/15' },
  EVENT_UPDATED: { icon: CalendarDays, color: 'text-amber-500 bg-amber-500/15' },
  EVENT_CANCELLED: { icon: X, color: 'text-red-500 bg-red-500/15' },
  RSVP_REMINDER: { icon: CalendarDays, color: 'text-orange-500 bg-orange-500/15' },
  MESSAGE: { icon: MessageCircle, color: 'text-blue-500 bg-blue-500/15' },
  PAYMENT_DUE: { icon: CreditCard, color: 'text-red-500 bg-red-500/15' },
  PAYMENT_RECEIVED: { icon: CreditCard, color: 'text-emerald-500 bg-emerald-500/15' },
  ANNOUNCEMENT: { icon: Megaphone, color: 'text-violet-500 bg-violet-500/15' },
  WAIVER_PENDING: { icon: FileCheck, color: 'text-orange-500 bg-orange-500/15' },
  GENERAL: { icon: AlertCircle, color: 'text-muted-foreground bg-secondary' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'teď';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });
}

/* ── Component ──────────────────────────────────────── */

export function NotificationBell() {
  const auth = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Unread count (poll every 30s)
  const { data: unreadData } = useQuery<UnreadCountResponse>({
    queryKey: ['notifications-unread', auth.clubId],
    queryFn: () => apiFetch<UnreadCountResponse>('/notifications/unread-count'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  // Full notification list (only fetch when dropdown is open)
  const { data: notifications, isLoading } = useQuery<NotificationsResponse>({
    queryKey: ['notifications', auth.clubId],
    queryFn: () =>
      apiFetch<NotificationsResponse>('/notifications?limit=15'),
    enabled: auth.isAuthenticated && !!auth.clubId && open,
    staleTime: 5_000,
  });

  // Mark single as read
  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/notifications/${id}/read`, { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  // Mark all as read
  const markAllMutation = useMutation({
    mutationFn: () =>
      apiFetch('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
    },
  });

  const count = unreadData?.count ?? 0;

  const handleNotificationClick = (item: NotificationsResponse['items'][0]) => {
    if (!item.read) {
      markReadMutation.mutate(item.id);
    }
    if (item.link) {
      setOpen(false);
      router.push(item.link as any);
    }
  };

  if (!auth.isAuthenticated) return null;

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[380px] overflow-hidden rounded-xl border border-border/50 bg-card shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
            <h3 className="text-sm font-bold">Oznámení</h3>
            {count > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => markAllMutation.mutate()}
                disabled={markAllMutation.isPending}
              >
                <Check className="mr-1 h-3 w-3" />
                Přečíst vše
              </Button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-9 w-9 rounded-full bg-secondary animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-3/4 rounded bg-secondary animate-pulse" />
                      <div className="h-3 w-1/2 rounded bg-secondary animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !notifications?.items.length ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="h-10 w-10 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Žádná oznámení
                </p>
              </div>
            ) : (
              <div>
                {notifications.items.map((item) => {
                  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.GENERAL!;
                  const Icon = config.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 ${
                        !item.read ? 'bg-primary/[0.03]' : ''
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm leading-snug ${
                            !item.read
                              ? 'font-semibold text-foreground'
                              : 'text-foreground/70'
                          }`}
                        >
                          {item.title}
                        </p>
                        {item.body && (
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">
                            {item.body}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-muted-foreground/50">
                          {timeAgo(item.createdAt)}
                        </p>
                      </div>
                      {!item.read && (
                        <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
