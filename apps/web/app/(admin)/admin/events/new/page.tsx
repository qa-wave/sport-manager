'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError, type TeamSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const EVENT_TYPES = ['PRACTICE', 'MATCH', 'TOURNAMENT', 'MEETING', 'SOCIAL'] as const;

export default function NewEventPage() {
  const auth = useAuth();
  const router = useRouter();

  const [type, setType] = useState<string>('PRACTICE');
  const [title, setTitle] = useState('');
  const [teamId, setTeamId] = useState<string>('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [location, setLocation] = useState('');
  const [opponent, setOpponent] = useState('');
  const [homeAway, setHomeAway] = useState<string>('');
  const [rsvpDeadline, setRsvpDeadline] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const teams = useQuery<TeamSummary[], ApiError>({
    queryKey: ['teams', auth.clubId],
    queryFn: () => apiFetch<TeamSummary[]>('/teams'),
    enabled: auth.isAuthenticated && !!auth.clubId,
  });

  const createMutation = useMutation({
    mutationFn: (body: any) =>
      apiFetch<{ id: string }>('/events', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      router.push(`/admin/events/${data.id}`);
    },
    onError: (err: any) => {
      setError(err?.message ?? 'Nepodařilo se vytvořit událost');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !startsAt || !endsAt) {
      setError('Název, začátek a konec jsou povinné.');
      return;
    }

    const body: any = {
      type,
      title: title.trim(),
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
    };
    if (teamId) body.teamId = teamId;
    else body.teamId = null;
    if (location.trim()) body.location = location.trim();
    if (opponent.trim()) body.opponent = opponent.trim();
    if (homeAway) body.homeAway = homeAway;
    if (rsvpDeadline) body.rsvpDeadline = new Date(rsvpDeadline).toISOString();
    if (description.trim()) body.description = description.trim();

    createMutation.mutate(body);
  }

  const showOpponentFields = type === 'MATCH' || type === 'TOURNAMENT';

  return (
    <>
      <PageHeader
        title="Nová událost"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/events"><ChevronLeft className="mr-1 h-4 w-4" />Zpět na události</Link>
          </Button>
        }
      />

      <Card className="">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type */}
            <div className="space-y-1.5">
              <Label>Typ události</Label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      type === t
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Název</Label>
              <Input
                id="title"
                placeholder="např. Trénink U10"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Team */}
            <div className="space-y-1.5">
              <Label htmlFor="team">Tým</Label>
              <select
                id="team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Celý klub (bez týmu)</option>
                {teams.data?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Date/time */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startsAt">Začátek</Label>
                <Input
                  id="startsAt"
                  type="datetime-local"
                  required
                  value={startsAt}
                  onChange={(e) => {
                    setStartsAt(e.target.value);
                    if (!endsAt && e.target.value) {
                      const d = new Date(e.target.value);
                      d.setHours(d.getHours() + 1);
                      setEndsAt(d.toISOString().slice(0, 16));
                    }
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endsAt">Konec</Label>
                <Input
                  id="endsAt"
                  type="datetime-local"
                  required
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location">Místo</Label>
              <Input
                id="location"
                placeholder="např. Sportovní hala Strašnice"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Opponent (conditional) */}
            {showOpponentFields && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="opponent">Soupeř</Label>
                  <Input
                    id="opponent"
                    placeholder="např. SK Slavia Praha"
                    value={opponent}
                    onChange={(e) => setOpponent(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="homeAway">Domácí / Hosté</Label>
                  <select
                    id="homeAway"
                    value={homeAway}
                    onChange={(e) => setHomeAway(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Nenastaveno</option>
                    <option value="HOME">Domácí</option>
                    <option value="AWAY">Hosté</option>
                    <option value="NEUTRAL">Neutrální</option>
                  </select>
                </div>
              </div>
            )}

            {/* RSVP Deadline */}
            <div className="space-y-1.5">
              <Label htmlFor="rsvpDeadline">Uzávěrka RSVP (volitelné)</Label>
              <Input
                id="rsvpDeadline"
                type="datetime-local"
                value={rsvpDeadline}
                onChange={(e) => setRsvpDeadline(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Popis (volitelné)</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Další informace k události..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full shadow-md"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Ukládám...' : 'Vytvořit událost'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
