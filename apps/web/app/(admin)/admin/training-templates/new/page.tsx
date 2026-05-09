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
const EVENT_TYPE_LABEL: Record<string, string> = {
  PRACTICE: 'Trénink',
  MATCH: 'Zápas',
  TOURNAMENT: 'Turnaj',
  MEETING: 'Schůzka',
  SOCIAL: 'Akce',
};

const DAYS = [
  { value: 1, label: 'Po' },
  { value: 2, label: 'Út' },
  { value: 3, label: 'St' },
  { value: 4, label: 'Čt' },
  { value: 5, label: 'Pá' },
  { value: 6, label: 'So' },
  { value: 0, label: 'Ne' },
];

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function oneYearFromNowIso(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

export default function NewTrainingTemplatePage() {
  const auth = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState('');
  const [eventType, setEventType] = useState<string>('PRACTICE');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [location, setLocation] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [description, setDescription] = useState('');
  const [validFrom, setValidFrom] = useState(todayIso());
  const [validUntil, setValidUntil] = useState(oneYearFromNowIso());
  const [active, setActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const teams = useQuery<TeamSummary[], ApiError>({
    queryKey: ['teams', auth.clubId],
    queryFn: () => apiFetch<TeamSummary[]>('/teams'),
    enabled: auth.isAuthenticated && !!auth.clubId,
  });

  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<{ id: string }>('/training-templates', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      router.push('/admin/training-templates');
    },
    onError: (err: ApiError) => {
      setError(err?.message ?? 'Nepodařilo se vytvořit šablonu');
    },
  });

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Název je povinný.');
      return;
    }
    if (!teamId) {
      setError('Vyberte tým.');
      return;
    }
    if (daysOfWeek.length === 0) {
      setError('Vyberte alespoň jeden den v týdnu.');
      return;
    }
    if (!validFrom || !validUntil) {
      setError('Platnost od a do jsou povinné.');
      return;
    }

    const body: Record<string, unknown> = {
      name: name.trim(),
      teamId,
      eventType,
      daysOfWeek,
      startTime,
      endTime,
      validFrom: new Date(validFrom).toISOString(),
      validUntil: new Date(validUntil).toISOString(),
      active,
    };
    if (location.trim()) body.location = location.trim();
    if (locationUrl.trim()) body.locationUrl = locationUrl.trim();
    if (description.trim()) body.description = description.trim();

    createMutation.mutate(body);
  }

  return (
    <>
      <PageHeader
        title="Nová šablona"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/training-templates">
              <ChevronLeft className="mr-1 h-4 w-4" />Zpět na šablony
            </Link>
          </Button>
        }
      />

      <Card className="gradient-card">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Název šablony</Label>
              <Input
                id="name"
                placeholder="např. U13 – úterní trénink"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Team */}
            <div className="space-y-1.5">
              <Label htmlFor="team">Tým</Label>
              <select
                id="team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— Vyberte tým —</option>
                {teams.data?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            {/* Event type */}
            <div className="space-y-1.5">
              <Label>Typ události</Label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEventType(t)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      eventType === t
                        ? 'bg-primary text-primary-foreground shadow-[0_0_10px_-2px_hsl(var(--primary)/0.4)]'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {EVENT_TYPE_LABEL[t]}
                  </button>
                ))}
              </div>
            </div>

            {/* Days of week */}
            <div className="space-y-1.5">
              <Label>Dny v týdnu</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleDay(value)}
                    className={`h-9 w-10 rounded-md text-sm font-semibold transition-all ${
                      daysOfWeek.includes(value)
                        ? 'bg-primary text-primary-foreground shadow-[0_0_10px_-2px_hsl(var(--primary)/0.4)]'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startTime">Začátek (HH:mm)</Label>
                <Input
                  id="startTime"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime">Konec (HH:mm)</Label>
                <Input
                  id="endTime"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>
            </div>

            {/* Validity */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="validFrom">Platnost od</Label>
                <Input
                  id="validFrom"
                  type="date"
                  required
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="validUntil">Platnost do</Label>
                <Input
                  id="validUntil"
                  type="date"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location">Místo (volitelné)</Label>
              <Input
                id="location"
                placeholder="např. Sportovní hala Strašnice"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            {/* Location URL */}
            <div className="space-y-1.5">
              <Label htmlFor="locationUrl">Odkaz na mapu (volitelné)</Label>
              <Input
                id="locationUrl"
                type="url"
                placeholder="https://maps.google.com/..."
                value={locationUrl}
                onChange={(e) => setLocationUrl(e.target.value)}
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Popis (volitelný)</Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Další informace..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Active toggle */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => setActive((v) => !v)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  active ? 'bg-primary' : 'bg-input'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    active ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <Label className="cursor-pointer" onClick={() => setActive((v) => !v)}>
                {active ? 'Šablona aktivní — bude generovat události' : 'Šablona pozastavena'}
              </Label>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full shadow-[0_0_16px_-4px_hsl(var(--primary)/0.4)]"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Vytváření...' : 'Vytvořit šablonu'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
