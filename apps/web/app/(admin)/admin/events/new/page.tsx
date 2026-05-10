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
      setError(err?.message ?? 'Failed to create event');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !startsAt || !endsAt) {
      setError('Title, start, and end time are required.');
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
        title="Schedule Event"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/events"><ChevronLeft className="mr-1 h-4 w-4" />Back to events</Link>
          </Button>
        }
      />

      <Card className="">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Type */}
            <div className="space-y-1.5">
              <Label>Event Type</Label>
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
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. U10 Training"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {/* Team */}
            <div className="space-y-1.5">
              <Label htmlFor="team">Team</Label>
              <select
                id="team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Club-wide (no specific team)</option>
                {teams.data?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Date/time */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startsAt">Start</Label>
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
                <Label htmlFor="endsAt">End</Label>
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
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Rivertown Sports Park"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Opponent (conditional) */}
            {showOpponentFields && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="opponent">Opponent</Label>
                  <Input
                    id="opponent"
                    placeholder="e.g. Hilltop Tigers"
                    value={opponent}
                    onChange={(e) => setOpponent(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="homeAway">Home / Away</Label>
                  <select
                    id="homeAway"
                    value={homeAway}
                    onChange={(e) => setHomeAway(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Not set</option>
                    <option value="HOME">Home</option>
                    <option value="AWAY">Away</option>
                    <option value="NEUTRAL">Neutral</option>
                  </select>
                </div>
              </div>
            )}

            {/* RSVP Deadline */}
            <div className="space-y-1.5">
              <Label htmlFor="rsvpDeadline">RSVP Deadline (optional)</Label>
              <Input
                id="rsvpDeadline"
                type="datetime-local"
                value={rsvpDeadline}
                onChange={(e) => setRsvpDeadline(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Any additional details..."
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
              {createMutation.isPending ? 'Creating...' : 'Create Event'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
