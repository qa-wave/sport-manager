'use client';

import { useMemo, useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  MessageCircle,
  Users,
  Megaphone,
  Shield,
  Hash,
  User,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/empty-state';
import { ChatSkeleton } from '@/components/admin/skeleton-loaders';
import { apiFetch, ApiError, type ConversationSummary, type MemberSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext } from '@/lib/member-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

/* ── Helpers ───────────────────────────────────────── */

const TYPE_ICON: Record<string, typeof MessageCircle> = {
  TEAM: Users,
  COACHES: Shield,
  PARENTS: Users,
  DM: User,
  GROUP: Hash,
  ANNOUNCEMENT: Megaphone,
};

const TYPE_COLOR: Record<string, string> = {
  TEAM: 'bg-emerald-500/15 text-emerald-500',
  COACHES: 'bg-amber-500/15 text-amber-500',
  PARENTS: 'bg-blue-500/15 text-blue-500',
  DM: 'bg-violet-500/15 text-violet-500',
  GROUP: 'bg-pink-500/15 text-pink-500',
  ANNOUNCEMENT: 'bg-red-500/15 text-red-500',
};

const TYPE_LABEL: Record<string, string> = {
  TEAM: 'Tým',
  COACHES: 'Trenéři',
  PARENTS: 'Rodiče',
  DM: 'DM',
  GROUP: 'Skupina',
  ANNOUNCEMENT: 'Oznámení',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'teď';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} d`;
  return new Date(dateStr).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' });
}

function getConversationTitle(
  conv: ConversationSummary,
  myMemberId?: string,
): string {
  if (conv.title) return conv.title;
  if (conv.type === 'DM') {
    const other = conv.participants.find((p) => p.memberId !== myMemberId);
    return other ? `${other.firstName} ${other.lastName}` : 'Přímá zpráva';
  }
  return conv.teamName ?? 'Konverzace';
}

function AvatarGroup({ conv }: { conv: ConversationSummary }) {
  const Icon = TYPE_ICON[conv.type] ?? MessageCircle;
  const color = TYPE_COLOR[conv.type] ?? 'bg-secondary text-muted-foreground';

  return (
    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${color}`}>
      <Icon className="h-5 w-5" />
    </div>
  );
}

/* ── Page ──────────────────────────────────────────── */

export default function MessagesPage() {
  const auth = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: memberCtx } = useMemberContext();
  const [showNewDM, setShowNewDM] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useQuery<ConversationSummary[], ApiError>({
    queryKey: ['conversations', auth.clubId],
    queryFn: () => apiFetch<ConversationSummary[]>('/conversations'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    retry: false,
  });

  const { data: members } = useQuery<MemberSummary[], ApiError>({
    queryKey: ['members', auth.clubId],
    queryFn: () => apiFetch<MemberSummary[]>('/members'),
    enabled: showNewDM && auth.isAuthenticated && !!auth.clubId,
    retry: false,
  });

  const createDM = useMutation({
    mutationFn: (participantMemberId: string) =>
      apiFetch<{ id: string }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ type: 'DM', participantIds: [participantMemberId] }),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setShowNewDM(false);
      setMemberSearch('');
      router.push(`/admin/messages/${result.id}` as any);
    },
  });

  // Focus search when form opens
  useEffect(() => {
    if (showNewDM) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [showNewDM]);

  const filteredMembers = useMemo(() => {
    if (!members || !memberCtx) return [];
    const q = memberSearch.toLowerCase();
    return members
      .filter((m) => m.id !== memberCtx.memberId)
      .filter((m) =>
        q === '' ||
        `${m.firstName} ${m.lastName}`.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q),
      )
      .slice(0, 8);
  }, [members, memberCtx, memberSearch]);

  // Split into categories
  const { channels, dms } = useMemo(() => {
    if (!data) return { channels: [], dms: [] };
    const channels: ConversationSummary[] = [];
    const dms: ConversationSummary[] = [];
    for (const c of data) {
      if (c.type === 'DM') {
        dms.push(c);
      } else {
        channels.push(c);
      }
    }
    return { channels, dms };
  }, [data]);

  return (
    <>
      <PageHeader
        title="Zprávy"
        subtitle="Týmové chaty, DM a oznámení"
        actions={
          <Button
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setShowNewDM((v) => !v)}
          >
            {showNewDM ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {showNewDM ? 'Zrušit' : 'Nová konverzace'}
          </Button>
        }
      />

      {/* New DM form */}
      {showNewDM && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary shrink-0" />
              <span className="text-sm font-semibold">Nová přímá zpráva</span>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Hledat člena..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
            {!members ? (
              <div className="space-y-1.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-full rounded-lg" />
                ))}
              </div>
            ) : filteredMembers.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2 text-center">
                {memberSearch ? 'Žádný člen nenalezen.' : 'Žádní další členové.'}
              </p>
            ) : (
              <div className="space-y-1">
                {filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-primary/[0.06] disabled:opacity-50"
                    onClick={() => createDM.mutate(m.id)}
                    disabled={createDM.isPending}
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-[11px] font-bold text-muted-foreground">
                      {m.firstName[0]}{m.lastName[0]}
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="font-medium truncate">{m.firstName} {m.lastName}</div>
                      {m.clubRoles.length > 0 && (
                        <div className="text-[11px] text-muted-foreground truncate">
                          {m.clubRoles.join(', ')}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {createDM.isError && (
              <p className="text-xs text-destructive">Nepodařilo se vytvořit konverzaci.</p>
            )}
          </CardContent>
        </Card>
      )}

      {!auth.isAuthenticated ? (
        <EmptyState
          icon={MessageCircle}
          title="Přihlaste se pro zobrazení zpráv"
          description="Vyžaduje přihlášenou session."
        />
      ) : isLoading ? (
        <ChatSkeleton />
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Nepodařilo se načíst konverzace.
          </CardContent>
        </Card>
      ) : !data || data.length === 0 ? (
        <EmptyState
          icon={MessageCircle}
          title="Zatím žádné konverzace"
          description="Napište zprávu kolegovi nebo vytvořte skupinový chat pro celý tým."
          tip="Tip: Komunikujte s rodiči a hráči přímo z aplikace — bez WhatsAppu."
          cta={
            <Button
              size="sm"
              onClick={() => setShowNewDM(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Napsat zprávu
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Channels / Group Chats */}
          {channels.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Kanály
                </h3>
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-xs text-muted-foreground/60">{channels.length}</span>
              </div>
              <div className="space-y-2">
                {channels.map((conv) => (
                  <ConversationRow
                    key={conv.id}
                    conv={conv}
                    myMemberId={memberCtx?.memberId}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Direct Messages */}
          {dms.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Přímé zprávy
                </h3>
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-xs text-muted-foreground/60">{dms.length}</span>
              </div>
              <div className="space-y-2">
                {dms.map((conv) => (
                  <ConversationRow
                    key={conv.id}
                    conv={conv}
                    myMemberId={memberCtx?.memberId}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </>
  );
}

/* ── Conversation Row ──────────────────────────────── */

function ConversationRow({
  conv,
  myMemberId,
}: {
  conv: ConversationSummary;
  myMemberId?: string;
}) {
  const title = getConversationTitle(conv, myMemberId);
  const typeLabel = TYPE_LABEL[conv.type] ?? conv.type;

  return (
    <Link
      href={`/admin/messages/${conv.id}` as any}
      className={`group flex items-center gap-3 rounded-xl border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md ${
        conv.hasUnread
          ? 'border-primary/30 bg-primary/[0.03]'
          : 'border-border/50'
      }`}
    >
      <AvatarGroup conv={conv} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`text-sm truncate transition-colors group-hover:text-primary ${
            conv.hasUnread ? 'font-bold text-foreground' : 'font-semibold text-foreground/80'
          }`}>
            {title}
          </span>
          <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[11px] font-semibold uppercase text-muted-foreground">
            {typeLabel}
          </span>
          {conv.hasUnread && (
            <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
          )}
        </div>

        {conv.lastMessage ? (
          <p className={`mt-0.5 truncate text-xs ${
            conv.hasUnread
              ? 'font-medium text-foreground/70'
              : 'text-muted-foreground'
          }`}>
            <span className="font-medium">{conv.lastMessage.senderName.split(' ')[0]}:</span>{' '}
            {conv.lastMessage.body}
          </p>
        ) : (
          <p className="mt-0.5 text-xs text-muted-foreground/70 italic">
            Zatím žádné zprávy
          </p>
        )}
      </div>

      <div className="shrink-0 text-right">
        {conv.lastMessage && (
          <span className="text-[11px] text-muted-foreground/60">
            {timeAgo(conv.lastMessage.createdAt)}
          </span>
        )}
        <div className="mt-1 flex items-center justify-end gap-1 text-[11px] text-muted-foreground/40">
          {conv.unreadCount > 0 ? (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold text-primary-foreground">
              {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
            </span>
          ) : (
            <>
              <Users className="h-3 w-3" />
              <span>{conv.participantCount}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
