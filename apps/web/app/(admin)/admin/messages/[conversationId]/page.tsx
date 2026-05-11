'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Send,
  Users,
  Shield,
  Megaphone,
  Hash,
  User,
  MessageCircle,
  Loader2,
} from 'lucide-react';
import {
  apiFetch,
  ApiError,
  type ConversationDetail,
  type MessageResponse,
} from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext } from '@/lib/member-context';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

/* ── Helpers ───────────────────────────────────────── */

const TYPE_ICON: Record<string, typeof MessageCircle> = {
  TEAM: Users,
  COACHES: Shield,
  PARENTS: Users,
  DM: User,
  GROUP: Hash,
  ANNOUNCEMENT: Megaphone,
};

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const time = date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  if (isToday) return time;
  if (isYesterday) return `Včera ${time}`;
  return `${date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' })} ${time}`;
}

function shouldShowDateSeparator(
  current: MessageResponse,
  previous: MessageResponse | undefined,
): boolean {
  if (!previous) return true;
  const a = new Date(current.createdAt).toDateString();
  const b = new Date(previous.createdAt).toDateString();
  return a !== b;
}

function dateSeparatorLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();
  if (isToday) return 'Dnes';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return 'Včera';

  return date.toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(senderId: string): string {
  const colors = [
    'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    'bg-violet-500/20 text-violet-600 dark:text-violet-400',
    'bg-pink-500/20 text-pink-600 dark:text-pink-400',
    'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    'bg-orange-500/20 text-orange-600 dark:text-orange-400',
  ];
  let hash = 0;
  for (let i = 0; i < senderId.length; i++) {
    hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length]!;
}

/* ── Page ──────────────────────────────────────────── */

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const router = useRouter();
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { data: memberCtx } = useMemberContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState('');

  const { data, isLoading, isError } = useQuery<ConversationDetail, ApiError>({
    queryKey: ['conversation', params.conversationId],
    queryFn: () =>
      apiFetch<ConversationDetail>(
        `/conversations/${params.conversationId}`,
      ),
    enabled: auth.isAuthenticated && !!auth.clubId,
    retry: false,
    refetchInterval: 5000, // Poll every 5s for new messages
  });

  const sendMutation = useMutation<
    MessageResponse,
    ApiError,
    string
  >({
    mutationFn: (body: string) =>
      apiFetch<MessageResponse>(
        `/conversations/${params.conversationId}/messages`,
        { method: 'POST', body: JSON.stringify({ body }) },
      ),
    onSuccess: (newMsg) => {
      // Optimistically add message to cache
      queryClient.setQueryData<ConversationDetail>(
        ['conversation', params.conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: [...old.messages, newMsg],
          };
        },
      );
      // Also invalidate conversation list for updated lastMessage
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
      // Scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    },
  });

  // Scroll to bottom on first load
  useEffect(() => {
    if (data?.messages.length) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [data?.id]); // Only on conversation change, not every refetch

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [data?.id]);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const title = data
    ? data.title ??
      (data.type === 'DM'
        ? data.participants
            .filter((p) => p.memberId !== memberCtx?.memberId)
            .map((p) => `${p.firstName} ${p.lastName}`)
            .join(', ') || 'Přímá zpráva'
        : data.teamName ?? 'Konverzace')
    : 'Načítání...';

  const Icon = data ? TYPE_ICON[data.type] ?? MessageCircle : MessageCircle;
  const isAnnouncement = data?.type === 'ANNOUNCEMENT';
  const canSend = isAnnouncement
    ? memberCtx &&
      (memberCtx.clubRoles.some((r) => ['OWNER', 'ADMIN'].includes(r)) ||
        memberCtx.teamRoles.some((r) =>
          ['HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'].includes(r.role),
        ))
    : true;

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-border/50 pb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => router.push('/admin/messages')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold">{title}</h1>
            <p className="text-xs text-muted-foreground">
              {data?.participants.length ?? 0} účastníků
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4">
        {isLoading ? (
          <div className="space-y-4 px-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-destructive/30 bg-destructive/5 mx-2">
            <CardContent className="p-4 text-sm text-destructive">
              Nepodařilo se načíst konverzaci.
            </CardContent>
          </Card>
        ) : !data || data.messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <MessageCircle className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Zatím žádné zprávy
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Buďte první, kdo napíše.
            </p>
          </div>
        ) : (
          <div className="space-y-1 px-2">
            {data.messages.map((msg, i) => {
              const prev = data.messages[i - 1];
              const isMe = msg.senderId === memberCtx?.memberId;
              const showDate = shouldShowDateSeparator(msg, prev);
              const showSender =
                !isMe &&
                (!prev ||
                  prev.senderId !== msg.senderId ||
                  showDate);

              return (
                <div key={msg.id}>
                  {showDate && (
                    <div className="flex items-center gap-3 py-3">
                      <div className="h-px flex-1 bg-border/50" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {dateSeparatorLabel(msg.createdAt)}
                      </span>
                      <div className="h-px flex-1 bg-border/50" />
                    </div>
                  )}

                  <div
                    className={`flex gap-2.5 ${
                      isMe ? 'flex-row-reverse' : ''
                    } ${showSender || isMe ? 'mt-3' : 'mt-0.5'}`}
                  >
                    {/* Avatar */}
                    {!isMe ? (
                      showSender ? (
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${getAvatarColor(
                            msg.senderId,
                          )}`}
                        >
                          {getInitials(msg.senderName)}
                        </div>
                      ) : (
                        <div className="w-8 shrink-0" />
                      )
                    ) : null}

                    {/* Bubble */}
                    <div
                      className={`max-w-[75%] ${
                        isMe ? 'items-end' : 'items-start'
                      }`}
                    >
                      {showSender && !isMe && (
                        <p className="mb-0.5 text-[11px] font-semibold text-muted-foreground/70 ml-1">
                          {msg.senderName}
                        </p>
                      )}
                      <div
                        className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                          isMe
                            ? 'bg-primary text-primary-foreground rounded-br-md'
                            : 'bg-secondary rounded-bl-md'
                        }`}
                      >
                        {msg.body}
                      </div>
                      <p
                        className={`mt-0.5 text-[11px] text-muted-foreground/40 ${
                          isMe ? 'text-right mr-1' : 'ml-1'
                        }`}
                      >
                        {formatMessageTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      {canSend && (
        <div className="shrink-0 border-t border-border/50 pt-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isAnnouncement
                  ? 'Napsat oznámení...'
                  : 'Napsat zprávu...'
              }
              rows={1}
              className="flex-1 resize-none rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm placeholder:text-muted-foreground/70 focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/20 max-h-32"
              style={{
                height: 'auto',
                minHeight: '2.5rem',
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 128) + 'px';
              }}
            />
            <Button
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl"
              disabled={!message.trim() || sendMutation.isPending}
              onClick={handleSend}
            >
              {sendMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          {isAnnouncement && (
            <p className="mt-1.5 text-[11px] text-muted-foreground/70 text-center">
              Oznámení mohou psát pouze administrátoři a trenéři.
            </p>
          )}
        </div>
      )}

      {!canSend && data && (
        <div className="shrink-0 border-t border-border/50 py-3 text-center">
          <p className="text-xs text-muted-foreground/70">
            Do tohoto kanálu mohou psát pouze administrátoři a trenéři.
          </p>
        </div>
      )}
    </div>
  );
}
