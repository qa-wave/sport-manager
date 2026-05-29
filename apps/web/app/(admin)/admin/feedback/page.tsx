'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Send, Star, Trash2, User as UserIcon } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/empty-state';
import { feedbackApi, type FeedbackItem, type CoachablePlayer, type ApiError } from '@/lib/api';
import { useMemberContext, isPurePlayer, isAdmin, isCoach } from '@/lib/member-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const CATEGORIES = ['Trénink', 'Zápas', 'Postoj', 'Týmová hra', 'Technika'];

function StarRating({ value, onChange, readonly }: { value: number | null; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={`transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}`}
          aria-label={`${n} stars`}
        >
          <Star
            className={`h-4 w-4 ${value !== null && n <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`}
          />
        </button>
      ))}
    </div>
  );
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

function relativeTime(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'právě teď';
  if (mins < 60) return `před ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `před ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `před ${days} d`;
  return new Date(d).toLocaleDateString('cs-CZ');
}

function FeedbackCard({
  item,
  canDelete,
  onDelete,
  showRecipient,
}: {
  item: FeedbackItem;
  canDelete: boolean;
  onDelete: () => void;
  showRecipient?: boolean;
}) {
  return (
    <Card className="hover-lift">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={(showRecipient ? item.playerAvatarUrl : item.authorAvatarUrl) ?? undefined} alt="" />
              <AvatarFallback>{initials(showRecipient ? item.playerName : item.authorName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-sm">
                  {showRecipient ? item.playerName : item.authorName}
                </span>
                {item.category && (
                  <Badge variant="outline" className="text-[11px]">{item.category}</Badge>
                )}
                {item.rating !== null && <StarRating value={item.rating} readonly />}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{relativeTime(item.createdAt)}</div>
            </div>
          </div>
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={onDelete} aria-label="Smazat">
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <p className="text-sm mt-3 whitespace-pre-wrap leading-relaxed">{item.text}</p>
      </CardContent>
    </Card>
  );
}

function PlayerView() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<{ items: FeedbackItem[] }, ApiError>({
    queryKey: ['feedback-me'],
    queryFn: () => feedbackApi.mine(),
  });

  const del = useMutation({
    mutationFn: (id: string) => feedbackApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedback-me'] }),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Načítám…</div>;
  if (!data || data.items.length === 0) {
    return (
      <EmptyState
        icon={MessageSquare}
        title="Žádná zpětná vazba"
        description="Jakmile ti trenér napíše zpětnou vazbu, uvidíš ji tady."
      />
    );
  }
  return (
    <div className="space-y-3">
      {data.items.map((item) => (
        <FeedbackCard key={item.id} item={item} canDelete={false} onDelete={() => del.mutate(item.id)} />
      ))}
    </div>
  );
}

function CoachView() {
  const queryClient = useQueryClient();
  const memberCtx = useMemberContext().data;
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [category, setCategory] = useState<string | null>(null);

  const playersQuery = useQuery<{ items: CoachablePlayer[] }, ApiError>({
    queryKey: ['feedback-coachable-players'],
    queryFn: () => feedbackApi.coachablePlayers(),
  });

  const playerFeedback = useQuery<{ items: FeedbackItem[] }, ApiError>({
    queryKey: ['feedback-player', selectedPlayerId],
    queryFn: () => feedbackApi.forPlayer(selectedPlayerId!),
    enabled: !!selectedPlayerId,
  });

  const create = useMutation({
    mutationFn: () => feedbackApi.create({
      playerId: selectedPlayerId!,
      text,
      rating: rating ?? undefined,
      category: category ?? undefined,
    }),
    onSuccess: () => {
      setText('');
      setRating(null);
      setCategory(null);
      queryClient.invalidateQueries({ queryKey: ['feedback-player', selectedPlayerId] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => feedbackApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['feedback-player', selectedPlayerId] }),
  });

  if (playersQuery.isLoading) return <div className="text-sm text-muted-foreground">Načítám hráče…</div>;
  if (!playersQuery.data || playersQuery.data.items.length === 0) {
    return (
      <EmptyState
        icon={UserIcon}
        title="Žádní hráči"
        description="Nemáš žádné hráče, kterým bys mohl/a dát zpětnou vazbu. Musíš být trenér týmu s hráči."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Player list */}
      <Card>
        <CardContent className="p-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2 py-1.5">
            Hráči ({playersQuery.data.items.length})
          </div>
          <div className="space-y-0.5">
            {playersQuery.data.items.map((p) => {
              const fullName = `${p.firstName} ${p.lastName}`;
              const selected = selectedPlayerId === p.memberId;
              return (
                <button
                  key={p.memberId}
                  type="button"
                  onClick={() => setSelectedPlayerId(p.memberId)}
                  className={`w-full flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors ${
                    selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                  }`}
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={p.avatarUrl ?? undefined} alt="" />
                    <AvatarFallback className="text-[10px]">{initials(fullName)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{fullName}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {p.teams.map((t) => t.name).join(', ')}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Editor + history */}
      <div className="space-y-4">
        {!selectedPlayerId ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              Vyber hráče vlevo a napiš mu zpětnou vazbu.
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Nová zpětná vazba</h3>
                  <StarRating value={rating} onChange={setRating} />
                </div>
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Co se ti líbilo? Co by mohl zlepšit? Buď konkrétní a podpůrný."
                  rows={4}
                />
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(category === cat ? null : cat)}
                      className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                        category === cat
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:bg-muted'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => create.mutate()}
                    disabled={!text.trim() || create.isPending}
                  >
                    <Send className="h-3.5 w-3.5 mr-1.5" />
                    {create.isPending ? 'Odesílám…' : 'Odeslat'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                Historie
              </h3>
              {playerFeedback.isLoading ? (
                <div className="text-sm text-muted-foreground">Načítám…</div>
              ) : !playerFeedback.data || playerFeedback.data.items.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-sm text-muted-foreground">
                    Zatím žádná zpětná vazba pro tohoto hráče.
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2">
                  {playerFeedback.data.items.map((item) => (
                    <FeedbackCard
                      key={item.id}
                      item={item}
                      canDelete={item.authorId === memberCtx?.memberId || (memberCtx ? isAdmin(memberCtx) : false)}
                      onDelete={() => del.mutate(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function FeedbackPage() {
  const memberCtx = useMemberContext().data;

  const purePlayer = memberCtx ? isPurePlayer(memberCtx) : false;
  const coachOrAdmin = memberCtx ? (isCoach(memberCtx) || isAdmin(memberCtx)) : false;

  return (
    <>
      <PageHeader
        title="Zpětná vazba"
        subtitle={
          purePlayer
            ? 'Zprávy od tvých trenérů'
            : coachOrAdmin
              ? 'Dej hráčům konkrétní zpětnou vazbu, kterou si zapamatují'
              : 'Trenérská zpětná vazba'
        }
      />
      <div className="mt-6 animate-fade-up">
        {coachOrAdmin ? <CoachView /> : <PlayerView />}
      </div>
    </>
  );
}
