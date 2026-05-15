'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChartBar, Lock, Plus, Trash2, X } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ── Types ──────────────────────────────────────────────────────────────────

interface PollOption {
  text: string;
  votes: string[]; // memberIds
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  teamId?: string | null;
  createdByMemberId: string;
  createdAt: string;
  active: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function totalVotes(poll: Poll): number {
  return poll.options.reduce((sum, o) => sum + o.votes.length, 0);
}

function hasVoted(poll: Poll, memberId: string): number | null {
  for (let i = 0; i < poll.options.length; i++) {
    if (poll.options[i]!.votes.includes(memberId)) return i;
  }
  return null;
}

// ── Single poll card ───────────────────────────────────────────────────────

function PollCard({
  poll,
  memberId,
  canManage,
  onVote,
  onClose,
  onDelete,
  isVoting,
  isClosing,
  isDeleting,
}: {
  poll: Poll;
  memberId: string;
  canManage: boolean;
  onVote: (pollId: string, optionIndex: number) => void;
  onClose: (pollId: string) => void;
  onDelete: (pollId: string) => void;
  isVoting: boolean;
  isClosing: boolean;
  isDeleting: boolean;
}) {
  const total = totalVotes(poll);
  const myVoteIdx = hasVoted(poll, memberId);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 min-w-0">
            <ChartBar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="min-w-0">
              <CardTitle className="text-sm leading-snug">{poll.question}</CardTitle>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {total} {total === 1 ? 'hlas' : total < 5 ? 'hlasy' : 'hlasů'}
                {!poll.active && (
                  <span className="ml-2 inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400">
                    <Lock className="h-2.5 w-2.5" />
                    Uzavřeno
                  </span>
                )}
              </p>
            </div>
          </div>
          {canManage && (
            <div className="flex shrink-0 items-center gap-1">
              {poll.active && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                  disabled={isClosing}
                  onClick={() => onClose(poll.id)}
                  title="Uzavřít hlasování"
                >
                  <Lock className="h-3.5 w-3.5" />
                </Button>
              )}
              {!deleteConfirm ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteConfirm(true)}
                  title="Smazat anketu"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              ) : (
                <div className="flex items-center gap-1">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    disabled={isDeleting}
                    onClick={() => onDelete(poll.id)}
                  >
                    Smazat
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[10px]"
                    onClick={() => setDeleteConfirm(false)}
                  >
                    Zrušit
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {poll.options.map((option, idx) => {
          const pct = total > 0 ? Math.round((option.votes.length / total) * 100) : 0;
          const isMyVote = myVoteIdx === idx;
          const canVote = poll.active && !isVoting;

          return (
            <button
              key={idx}
              disabled={!canVote}
              onClick={() => canVote && onVote(poll.id, idx)}
              className={[
                'relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left transition-all',
                canVote ? 'hover:border-primary/50 cursor-pointer' : 'cursor-default',
                isMyVote
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border/50 bg-muted/20',
              ].join(' ')}
            >
              {/* Progress fill */}
              <div
                className={[
                  'absolute inset-y-0 left-0 transition-all duration-500',
                  isMyVote ? 'bg-primary/15' : 'bg-muted/50',
                ].join(' ')}
                style={{ width: `${pct}%` }}
              />
              <div className="relative flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {/* Radio indicator */}
                  <div
                    className={[
                      'h-4 w-4 shrink-0 rounded-full border-2 transition-colors',
                      isMyVote
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30',
                    ].join(' ')}
                  >
                    {isMyVote && (
                      <div className="mx-auto mt-[3px] h-1.5 w-1.5 rounded-full bg-white" />
                    )}
                  </div>
                  <span className={['text-sm', isMyVote ? 'font-medium' : ''].join(' ')}>
                    {option.text}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-xs font-semibold tabular-nums">{pct}%</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">
                    ({option.votes.length})
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

// ── Create poll form ───────────────────────────────────────────────────────

function CreatePollForm({
  onSubmit,
  onCancel,
  isPending,
}: {
  onSubmit: (question: string, options: string[]) => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);

  function addOption() {
    if (options.length < 10) setOptions((prev) => [...prev, '']);
  }

  function removeOption(idx: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateOption(idx: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? value : o)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const filledOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!question.trim() || filledOptions.length < 2) return;
    onSubmit(question.trim(), filledOptions);
  }

  const filledOptions = options.filter((o) => o.trim());
  const isValid = question.trim().length > 0 && filledOptions.length >= 2;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Nová anketa</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="poll-question" className="text-xs">Otázka</Label>
            <Input
              id="poll-question"
              autoFocus
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="např. Kdy hrajeme přátelák?"
              className="h-8 text-sm"
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Možnosti (min. 2, max. 10)</Label>
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <span className="w-5 text-center text-xs text-muted-foreground">{idx + 1}.</span>
                <Input
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  placeholder={`Možnost ${idx + 1}`}
                  className="h-7 flex-1 text-sm"
                  maxLength={200}
                />
                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(idx)}
                    className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {options.length < 10 && (
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" />
                Přidat možnost
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" size="sm" disabled={!isValid || isPending}>
              {isPending ? 'Vytvářím...' : 'Vytvořit anketu'}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              Zrušit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Main section ───────────────────────────────────────────────────────────

interface PollsSectionProps {
  clubId: string;
  memberId: string;
  canManage: boolean;
}

export function PollsSection({ clubId, memberId, canManage }: PollsSectionProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: polls, isLoading } = useQuery<Poll[], ApiError>({
    queryKey: ['polls', clubId],
    queryFn: () => apiFetch<Poll[]>('/polls'),
    enabled: auth.isAuthenticated && !!clubId,
    refetchInterval: 15_000, // poll every 15s for live updates
  });

  const createPoll = useMutation({
    mutationFn: (vars: { question: string; options: string[] }) =>
      apiFetch('/polls', {
        method: 'POST',
        body: JSON.stringify({ question: vars.question, options: vars.options }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', clubId] });
      setShowCreate(false);
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionIndex }: { pollId: string; optionIndex: number }) =>
      apiFetch<Poll>(`/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionIndex }),
      }),
    onSuccess: (updatedPoll) => {
      // Optimistic cache update
      queryClient.setQueryData<Poll[]>(['polls', clubId], (old) =>
        old ? old.map((p) => (p.id === updatedPoll.id ? updatedPoll : p)) : old
      );
    },
  });

  const closeMutation = useMutation({
    mutationFn: (pollId: string) =>
      apiFetch(`/polls/${pollId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', clubId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (pollId: string) =>
      apiFetch(`/polls/${pollId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', clubId] });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-36 rounded-xl" />
        ))}
      </div>
    );
  }

  const list = polls ?? [];

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBar className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">
            Ankety
            {list.length > 0 && (
              <Badge variant="outline" className="ml-2 text-[10px]">
                {list.length}
              </Badge>
            )}
          </span>
        </div>
        {canManage && !showCreate && (
          <Button size="sm" variant="outline" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nová anketa
          </Button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <CreatePollForm
          onSubmit={(question, options) => createPoll.mutate({ question, options })}
          onCancel={() => setShowCreate(false)}
          isPending={createPoll.isPending}
        />
      )}

      {/* Poll list */}
      {list.length === 0 && !showCreate ? (
        <div className="rounded-xl border border-dashed border-border/60 py-10 text-center">
          <ChartBar className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-medium text-muted-foreground">Žádné ankety</p>
          <p className="text-xs text-muted-foreground/70">
            {canManage
              ? 'Vytvořte anketu a zjistěte názory členů.'
              : 'Zatím nebyly vytvořeny žádné ankety.'}
          </p>
          {canManage && (
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => setShowCreate(true)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Nová anketa
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((poll) => (
            <PollCard
              key={poll.id}
              poll={poll}
              memberId={memberId}
              canManage={canManage}
              onVote={(pollId, optionIndex) => voteMutation.mutate({ pollId, optionIndex })}
              onClose={(pollId) => closeMutation.mutate(pollId)}
              onDelete={(pollId) => deleteMutation.mutate(pollId)}
              isVoting={voteMutation.isPending}
              isClosing={closeMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
