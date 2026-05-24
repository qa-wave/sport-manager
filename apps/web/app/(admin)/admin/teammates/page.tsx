'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, Users } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { EmptyState } from '@/components/admin/empty-state';
import { apiFetch, teammatesApi, type TeammateItem, type ApiError } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const ROLE_LABEL: Record<string, string> = {
  PLAYER: 'Hráč',
  HEAD_COACH: 'Hl. trenér',
  ASSISTANT_COACH: 'As. trenér',
  TEAM_MANAGER: 'Manažer',
  MEDIC: 'Lékař',
};

function initials(first: string, last: string): string {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

export default function TeammatesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<{ items: TeammateItem[] }, ApiError>({
    queryKey: ['teammates'],
    queryFn: () => teammatesApi.list(),
  });

  const createDM = useMutation({
    mutationFn: (memberId: string) =>
      apiFetch<{ id: string }>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ type: 'DM', participantIds: [memberId] }),
      }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      router.push(`/admin/messages/${result.id}` as any);
    },
  });

  const filtered = (data?.items ?? []).filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return `${p.firstName} ${p.lastName}`.toLowerCase().includes(q);
  });

  // Group by team for a friendlier layout
  const teamMap = new Map<string, { id: string; name: string; people: TeammateItem[] }>();
  for (const person of filtered) {
    for (const team of person.teams) {
      const existing = teamMap.get(team.id);
      if (existing) {
        if (!existing.people.find((p) => p.memberId === person.memberId)) {
          existing.people.push(person);
        }
      } else {
        teamMap.set(team.id, { id: team.id, name: team.name, people: [person] });
      }
    }
  }
  const grouped = [...teamMap.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <PageHeader title="Spoluhráči" subtitle="Lidi z tvých týmů — můžeš jim rovnou napsat" />

      <div className="mt-6 space-y-6 animate-fade-up">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Hledat jméno…"
          className="w-full max-w-sm rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Načítám…</div>
        ) : grouped.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Žádní spoluhráči"
            description="Zatím nejsi v žádném týmu. Až tě trenér přidá do týmu, uvidíš tady ostatní."
          />
        ) : (
          grouped.map((team) => (
            <section key={team.id}>
              <h2 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <Users className="h-4 w-4 text-primary" />
                {team.name} <span className="text-muted-foreground/60">· {team.people.length}</span>
              </h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {team.people.map((person) => {
                  const fullName = `${person.firstName} ${person.lastName}`;
                  const roleInTeam = person.teams.find((t) => t.id === team.id)?.role ?? 'PLAYER';
                  return (
                    <Card key={`${team.id}-${person.memberId}`} className="hover-lift">
                      <CardContent className="p-3 flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={person.avatarUrl ?? undefined} alt="" />
                          <AvatarFallback>{initials(person.firstName, person.lastName)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold truncate">{fullName}</div>
                          <div className="mt-0.5">
                            <Badge variant="secondary" className="text-[10px]">
                              {ROLE_LABEL[roleInTeam] ?? roleInTeam}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => createDM.mutate(person.memberId)}
                          disabled={createDM.isPending}
                          aria-label={`Napsat ${fullName}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>
    </>
  );
}
