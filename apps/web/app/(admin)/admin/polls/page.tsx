'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Vote } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext, isAdmin, isCoach } from '@/lib/member-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

type PollOption = {
  text: string;
  votes: string[];
};

type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  teamId?: string | null;
  createdByMemberId: string;
  createdAt: string;
  active: boolean;
};

export default function PollsPage() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { data: memberCtx } = useMemberContext();
  const canCreate = memberCtx ? isAdmin(memberCtx) || isCoach(memberCtx) : false;

  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: polls, isLoading, isError } = useQuery<Poll[], ApiError>({
    queryKey: ['polls', auth.clubId],
    queryFn: () => apiFetch<Poll[]>('/polls'),
    enabled: auth.isAuthenticated && !!auth.clubId,
  });

  const createMutation = useMutation({
    mutationFn: (body: { question: string; options: string[] }) =>
      apiFetch('/polls', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polls', auth.clubId] });
      setShowForm(false);
      setQuestion('');
      setOptions(['', '']);
      setFormError(null);
    },
    onError: () => setFormError('Nepodařilo se vytvořit hlasování'),
  });

  const voteMutation = useMutation({
    mutationFn: ({ pollId, optionIndex }: { pollId: string; optionIndex: number }) =>
      apiFetch(`/polls/${pollId}/vote`, { method: 'POST', body: JSON.stringify({ optionIndex }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls', auth.clubId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (pollId: string) =>
      apiFetch(`/polls/${pollId}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['polls', auth.clubId] }),
  });

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const filtered = options.filter((o) => o.trim().length > 0);
    if (!question.trim()) { setFormError('Zadejte otázku'); return; }
    if (filtered.length < 2) { setFormError('Zadejte alespoň 2 možnosti'); return; }
    createMutation.mutate({ question: question.trim(), options: filtered });
  }

  const memberId = memberCtx?.memberId;

  return (
    <>
      <PageHeader
        title="Hlasování"
        subtitle="Zjistěte termíny, preference a názory členů"
        actions={
          canCreate && !showForm ? (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus className="mr-1 h-4 w-4" />Nové hlasování
            </Button>
          ) : undefined
        }
      />

      {/* Create form */}
      {showForm && (
        <Card>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <CardContent className="p-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="question">Otázka</Label>
                <Input
                  id="question"
                  autoFocus
                  placeholder="Kdy se vám hodí trénink?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Možnosti</Label>
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      placeholder={`Možnost ${i + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const next = [...options];
                        next[i] = e.target.value;
                        setOptions(next);
                      }}
                      className="h-9"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setOptions(options.filter((_, j) => j !== i))}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
                {options.length < 10 && (
                  <button
                    type="button"
                    onClick={() => setOptions([...options, ''])}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Plus className="h-3.5 w-3.5" />Přidat možnost
                  </button>
                )}
              </div>

              {formError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {formError}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Ukládám...' : 'Vytvořit hlasování'}
                </Button>
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setFormError(null); }}>
                  Zrušit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6 space-y-3">
              <Skeleton className="h-5 w-64" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </CardContent></Card>
          ))}
        </div>
      ) : isError ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">Nepodařilo se načíst hlasování</CardContent>
        </Card>
      ) : !polls || polls.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Vote className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium text-muted-foreground">Žádná aktivní hlasování</p>
            {canCreate && (
              <Button size="sm" className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="mr-1 h-4 w-4" />Vytvořit první hlasování
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => {
            const totalVotes = poll.options.reduce((sum, o) => sum + o.votes.length, 0);
            const myVoteIdx = memberId
              ? poll.options.findIndex((o) => o.votes.includes(memberId))
              : -1;

            return (
              <Card key={poll.id} className="overflow-hidden">
                <CardHeader className="flex flex-row items-start justify-between pb-3 gap-3">
                  <div className="flex-1">
                    <CardTitle className="text-base leading-snug">{poll.question}</CardTitle>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {totalVotes} {totalVotes === 1 ? 'hlas' : totalVotes < 5 ? 'hlasy' : 'hlasů'}
                      {' · '}
                      {new Date(poll.createdAt).toLocaleDateString('cs-CZ')}
                    </p>
                  </div>
                  {canCreate && (
                    <button
                      onClick={() => deleteMutation.mutate(poll.id)}
                      disabled={deleteMutation.isPending}
                      className="shrink-0 text-muted-foreground hover:text-destructive transition-colors mt-0.5"
                      title="Uzavřít hlasování"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </CardHeader>

                <CardContent className="pb-5 pt-0 space-y-2.5">
                  {poll.options.map((opt, i) => {
                    const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                    const isMyVote = myVoteIdx === i;

                    return (
                      <button
                        key={i}
                        onClick={() => voteMutation.mutate({ pollId: poll.id, optionIndex: i })}
                        disabled={voteMutation.isPending}
                        className={`relative w-full overflow-hidden rounded-lg border px-4 py-2.5 text-left transition-all hover:border-primary/40 ${
                          isMyVote
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border/50 bg-card hover:bg-primary/[0.02]'
                        }`}
                      >
                        {/* Progress bar background */}
                        <div
                          className={`absolute inset-y-0 left-0 transition-all ${isMyVote ? 'bg-primary/10' : 'bg-muted/40'}`}
                          style={{ width: `${pct}%` }}
                        />
                        <div className="relative flex items-center justify-between gap-2">
                          <span className={`text-sm ${isMyVote ? 'font-semibold text-primary' : 'text-foreground'}`}>
                            {isMyVote && <span className="mr-1">✓</span>}{opt.text}
                          </span>
                          <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
                            {opt.votes.length} ({pct}%)
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
