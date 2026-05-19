'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  apiFetch,
  ApiError,
  type ConversationDetail,
  type MessageResponse,
  type MessageReaction,
} from '@/lib/api';
import { authStore, useAuth } from '@/lib/auth-store';
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

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '🎉'] as const;

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
    'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
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

/* Group reactions by emoji and count */
function groupReactions(reactions: MessageReaction[]): { emoji: string; count: number; memberIds: string[] }[] {
  const map = new Map<string, string[]>();
  for (const r of reactions) {
    if (!map.has(r.emoji)) map.set(r.emoji, []);
    map.get(r.emoji)!.push(r.memberId);
  }
  return Array.from(map.entries()).map(([emoji, memberIds]) => ({
    emoji,
    count: memberIds.length,
    memberIds,
  }));
}

/* ── Read Receipt Avatars ──────────────────────────── */
function ReadReceipts({
  readBy,
  participants,
}: {
  readBy: string[];
  participants: ConversationDetail['participants'];
}) {
  if (readBy.length === 0) return null;

  const readers = readBy
    .map((id) => participants.find((p) => p.memberId === id))
    .filter(Boolean) as ConversationDetail['participants'];

  const MAX_SHOWN = 3;
  const shown = readers.slice(0, MAX_SHOWN);
  const extra = readers.length - MAX_SHOWN;

  return (
    <div className="mt-1 flex items-center justify-end gap-0.5">
      <span className="mr-1 text-[10px] text-muted-foreground/40">Přečteno</span>
      {shown.map((p) => (
        <div
          key={p.memberId}
          title={`${p.firstName} ${p.lastName}`}
          className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold ${getAvatarColor(p.memberId)}`}
        >
          {p.firstName[0]}{p.lastName[0]}
        </div>
      ))}
      {extra > 0 && (
        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-secondary text-[9px] font-bold text-muted-foreground">
          +{extra}
        </div>
      )}
    </div>
  );
}

/* ── Emoji Picker ──────────────────────────────────── */
function EmojiPicker({
  onSelect,
  onClose,
  isMe,
}: {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  isMe: boolean;
}) {
  return (
    <div
      className={`absolute ${isMe ? 'right-0' : 'left-8'} -top-9 z-10 flex items-center gap-1 rounded-xl border border-border/50 bg-card px-2 py-1.5 shadow-lg`}
    >
      {EMOJI_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(emoji);
            onClose();
          }}
          className="text-base transition-transform hover:scale-125 focus:outline-none"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
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
  const [sseConnected, setSseConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Map<string, { name: string; timer: ReturnType<typeof setTimeout> }>>(new Map());
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [emojiPickerMessageId, setEmojiPickerMessageId] = useState<string | null>(null);
  const typingDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data, isLoading, isError } = useQuery<ConversationDetail, ApiError>({
    queryKey: ['conversation', params.conversationId],
    queryFn: () =>
      apiFetch<ConversationDetail>(
        `/conversations/${params.conversationId}`,
      ),
    enabled: auth.isAuthenticated && !!auth.clubId,
    retry: false,
    // Fallback poll every 15s (SSE covers real-time, this catches missed events)
    refetchInterval: 15_000,
  });

  // Mark conversation as read when opened
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.clubId || !params.conversationId) return;
    apiFetch(`/conversations/${params.conversationId}/read`, { method: 'POST' }).catch(() => {});
    // Also invalidate conversations list so unread counts update
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.conversationId, auth.isAuthenticated, auth.clubId]);

  // SSE: connect for real-time messages, typing, reactions, reads
  useEffect(() => {
    if (!auth.isAuthenticated || !auth.clubId || !params.conversationId) return;

    let es: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | null = null;
    let retryDelay = 1000;
    let mounted = true;

    function connect() {
      if (!mounted) return;

      const token = authStore.getAccessToken();
      const clubId = auth.clubId;

      const url = `/api/v1/conversations/${params.conversationId}/stream?token=${token}&x-club-id=${clubId}`;

      es = new EventSource(url);

      es.addEventListener('message', (e) => {
        try {
          const payload = JSON.parse(e.data) as {
            type: string;
            data?: MessageResponse | { memberId: string; name: string } | { memberId: string; readAt: string } | { messageId: string; reactions: MessageReaction[] };
          };

          if (payload.type === 'connected') {
            setSseConnected(true);
            retryDelay = 1000;
          } else if (payload.type === 'message' && payload.data) {
            const newMsg = payload.data as MessageResponse;
            queryClient.setQueryData<ConversationDetail>(
              ['conversation', params.conversationId],
              (old) => {
                if (!old) return old;
                if (old.messages.some((m) => m.id === newMsg.id)) return old;
                return { ...old, messages: [...old.messages, newMsg] };
              },
            );
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            // Auto-mark as read when new message arrives (conversation is open)
            apiFetch(`/conversations/${params.conversationId}/read`, { method: 'POST' }).catch(() => {});
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          } else if (payload.type === 'typing' && payload.data) {
            const { memberId, name } = payload.data as { memberId: string; name: string };
            if (memberId === memberCtx?.memberId) return; // ignore self
            setTypingUsers((prev) => {
              const next = new Map(prev);
              // Clear existing timer for this member
              const existing = next.get(memberId);
              if (existing) clearTimeout(existing.timer);
              // Set new timer — remove after 3s
              const timer = setTimeout(() => {
                setTypingUsers((p) => {
                  const m = new Map(p);
                  m.delete(memberId);
                  return m;
                });
              }, 3000);
              next.set(memberId, { name, timer });
              return next;
            });
          } else if (payload.type === 'read' && payload.data) {
            const { memberId, readAt } = payload.data as { memberId: string; readAt: string };
            const readAtDate = new Date(readAt);
            // Update readBy for messages this member has now read
            queryClient.setQueryData<ConversationDetail>(
              ['conversation', params.conversationId],
              (old) => {
                if (!old) return old;
                return {
                  ...old,
                  messages: old.messages.map((m) => {
                    if (
                      readAtDate >= new Date(m.createdAt) &&
                      !m.readBy.includes(memberId) &&
                      m.senderId !== memberId
                    ) {
                      return { ...m, readBy: [...m.readBy, memberId] };
                    }
                    return m;
                  }),
                };
              },
            );
            // Invalidate conversation list to update unread counts
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          } else if (payload.type === 'reaction' && payload.data) {
            const { messageId, reactions } = payload.data as { messageId: string; reactions: MessageReaction[] };
            queryClient.setQueryData<ConversationDetail>(
              ['conversation', params.conversationId],
              (old) => {
                if (!old) return old;
                return {
                  ...old,
                  messages: old.messages.map((m) =>
                    m.id === messageId ? { ...m, reactions } : m,
                  ),
                };
              },
            );
          }
        } catch {
          // ignore malformed event
        }
      });

      es.onerror = () => {
        setSseConnected(false);
        es?.close();
        if (mounted) {
          retryTimeout = setTimeout(() => {
            retryDelay = Math.min(retryDelay * 2, 30_000);
            connect();
          }, retryDelay);
        }
      };
    }

    connect();

    return () => {
      mounted = false;
      setSseConnected(false);
      es?.close();
      if (retryTimeout) clearTimeout(retryTimeout);
      // Clear all typing timers
      setTypingUsers((prev) => {
        prev.forEach(({ timer }) => clearTimeout(timer));
        return new Map();
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.conversationId, auth.isAuthenticated, auth.clubId]);

  const sendMutation = useMutation<MessageResponse, ApiError, string>({
    mutationFn: (body: string) =>
      apiFetch<MessageResponse>(
        `/conversations/${params.conversationId}/messages`,
        { method: 'POST', body: JSON.stringify({ body }) },
      ),
    onSuccess: (newMsg) => {
      queryClient.setQueryData<ConversationDetail>(
        ['conversation', params.conversationId],
        (old) => {
          if (!old) return old;
          return { ...old, messages: [...old.messages, newMsg] };
        },
      );
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessage('');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    },
  });

  const reactMutation = useMutation<
    { messageId: string; reactions: MessageReaction[] },
    ApiError,
    { messageId: string; emoji: string }
  >({
    mutationFn: ({ messageId, emoji }) =>
      apiFetch(`/conversations/${params.conversationId}/messages/${messageId}/react`, {
        method: 'POST',
        body: JSON.stringify({ emoji }),
      }),
    onSuccess: ({ messageId, reactions }) => {
      queryClient.setQueryData<ConversationDetail>(
        ['conversation', params.conversationId],
        (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((m) =>
              m.id === messageId ? { ...m, reactions } : m,
            ),
          };
        },
      );
    },
  });

  // Scroll to bottom on first load
  useEffect(() => {
    if (data?.messages.length) {
      messagesEndRef.current?.scrollIntoView();
    }
  }, [data?.id]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, [data?.id]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!emojiPickerMessageId) return;
    const handler = () => setEmojiPickerMessageId(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [emojiPickerMessageId]);

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

  // Debounced typing indicator
  const handleTyping = useCallback(() => {
    if (!params.conversationId || !auth.isAuthenticated) return;
    if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
    apiFetch(`/conversations/${params.conversationId}/typing`, { method: 'POST' }).catch(() => {});
    typingDebounceRef.current = setTimeout(() => {
      typingDebounceRef.current = null;
    }, 2000);
  }, [params.conversationId, auth.isAuthenticated]);

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

  // Find index of last message from me (for read receipts — only shown on last sent msg)
  const myLastMsgIdx = data
    ? [...data.messages].map((m, i) => ({ m, i })).filter(({ m }) => m.senderId === memberCtx?.memberId).pop()?.i ?? -1
    : -1;

  const typingList = Array.from(typingUsers.values()).map((v) => v.name);

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
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>{data?.participants.length ?? 0} účastníků</span>
              {sseConnected ? (
                <span className="flex items-center gap-1 text-emerald-500">
                  <Wifi className="h-3 w-3" />
                  <span className="text-[11px]">živě</span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-muted-foreground/50">
                  <WifiOff className="h-3 w-3" />
                </span>
              )}
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
              const isLastMyMsg = isMe && i === myLastMsgIdx;
              const grouped = groupReactions(msg.reactions ?? []);
              const isPickerOpen = emojiPickerMessageId === msg.id;
              const isHovered = hoveredMessageId === msg.id;

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
                    className={`relative flex gap-2.5 ${isMe ? 'flex-row-reverse' : ''} ${showSender || isMe ? 'mt-3' : 'mt-0.5'}`}
                    onMouseEnter={() => setHoveredMessageId(msg.id)}
                    onMouseLeave={() => {
                      setHoveredMessageId(null);
                      if (!isPickerOpen) setEmojiPickerMessageId(null);
                    }}
                  >
                    {/* Avatar */}
                    {!isMe ? (
                      showSender ? (
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${getAvatarColor(msg.senderId)}`}
                        >
                          {getInitials(msg.senderName)}
                        </div>
                      ) : (
                        <div className="w-8 shrink-0" />
                      )
                    ) : null}

                    {/* Bubble + reactions */}
                    <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                      {showSender && !isMe && (
                        <p className="mb-0.5 text-[11px] font-semibold text-muted-foreground/70 ml-1">
                          {msg.senderName}
                        </p>
                      )}

                      {/* Emoji picker + bubble row */}
                      <div className={`relative flex items-center gap-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        {/* Emoji add button — show on hover */}
                        {(isHovered || isPickerOpen) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEmojiPickerMessageId(isPickerOpen ? null : msg.id);
                            }}
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                            title="Přidat reakci"
                          >
                            <span className="text-xs leading-none">+</span>
                          </button>
                        )}

                        {/* Emoji picker popup */}
                        {isPickerOpen && (
                          <EmojiPicker
                            isMe={isMe}
                            onSelect={(emoji) => {
                              reactMutation.mutate({ messageId: msg.id, emoji });
                            }}
                            onClose={() => setEmojiPickerMessageId(null)}
                          />
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
                      </div>

                      {/* Timestamp */}
                      <p
                        className={`mt-0.5 text-[11px] text-muted-foreground/40 ${isMe ? 'text-right mr-1' : 'ml-1'}`}
                      >
                        {formatMessageTime(msg.createdAt)}
                      </p>

                      {/* Emoji reactions */}
                      {grouped.length > 0 && (
                        <div className={`mt-1 flex flex-wrap gap-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {grouped.map(({ emoji, count, memberIds }) => {
                            const iMine = memberIds.includes(memberCtx?.memberId ?? '');
                            return (
                              <button
                                key={emoji}
                                onClick={() => reactMutation.mutate({ messageId: msg.id, emoji })}
                                className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors ${
                                  iMine
                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                    : 'border-border/50 bg-secondary text-foreground/70 hover:border-primary/30 hover:bg-primary/5'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span className="font-semibold">{count}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Read receipts — only on last message sent by me */}
                      {isLastMyMsg && data.participants && (
                        <ReadReceipts
                          readBy={msg.readBy ?? []}
                          participants={data.participants}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingList.length > 0 && (
              <div className="mt-2 flex items-center gap-2 px-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/50"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground/60">
                  {typingList.length === 1
                    ? `${typingList[0]} píše...`
                    : `${typingList.slice(0, -1).join(', ')} a ${typingList[typingList.length - 1]} píší...`}
                </span>
              </div>
            )}

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
              onChange={(e) => {
                setMessage(e.target.value);
                if (e.target.value.trim()) handleTyping();
              }}
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
