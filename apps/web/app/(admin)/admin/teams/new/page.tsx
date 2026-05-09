'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { ChevronLeft } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const SPORTS = ['Fotbal', 'Florbal', 'Basketbal', 'Volejbal', 'Hokej', 'Tenis', 'Atletika', 'Jiný'];
const AGE_GROUPS = ['U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14', 'U15', 'U16', 'U17', 'U18', 'U19', 'Dospeli'];

export default function NewTeamPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [sport, setSport] = useState('Fotbal');
  const [customSport, setCustomSport] = useState('');
  const [ageGroup, setAgeGroup] = useState('');
  const [season, setSeason] = useState(() => {
    const y = new Date().getFullYear();
    return `${y}/${String(y + 1).slice(2)}`;
  });
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = useMutation<{ id: string }, ApiError, object>({
    mutationFn: (body) =>
      apiFetch<{ id: string }>('/teams', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      router.push('/admin/teams');
    },
    onError: (err) => {
      setFormError(err?.message ?? 'Nepodarilo se vytvorit tym.');
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const resolvedSport = sport === 'Jiný' ? customSport.trim() : sport;

    if (!name.trim()) {
      setFormError('Nazev tymu je povinny.');
      return;
    }
    if (!resolvedSport) {
      setFormError('Sport je povinny.');
      return;
    }
    if (!season.trim()) {
      setFormError('Sezona je povinna.');
      return;
    }

    const body: Record<string, string> = {
      name: name.trim(),
      sport: resolvedSport,
      season: season.trim(),
    };
    if (ageGroup) body.ageGroup = ageGroup;

    createMutation.mutate(body);
  }

  return (
    <>
      <PageHeader
        title="Novy tym"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/teams">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Zpet na tymy
            </Link>
          </Button>
        }
      />

      <Card className="gradient-card">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Nazev */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nazev tymu *</Label>
              <Input
                id="name"
                placeholder="napr. FC Hvezda U13"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Sport */}
            <div className="space-y-1.5">
              <Label>Sport *</Label>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSport(s)}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                      sport === s
                        ? 'bg-primary text-primary-foreground shadow-[0_0_10px_-2px_hsl(var(--primary)/0.4)]'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {sport === 'Jiný' && (
                <Input
                  placeholder="Zadejte nazev sportu"
                  value={customSport}
                  onChange={(e) => setCustomSport(e.target.value)}
                  className="mt-2"
                />
              )}
            </div>

            {/* Veková kategorie */}
            <div className="space-y-1.5">
              <Label htmlFor="ageGroup">Veková kategorie (volitelne)</Label>
              <select
                id="ageGroup"
                value={ageGroup}
                onChange={(e) => setAgeGroup(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Bez kategorie</option>
                {AGE_GROUPS.map((ag) => (
                  <option key={ag} value={ag}>{ag}</option>
                ))}
              </select>
            </div>

            {/* Sezona */}
            <div className="space-y-1.5">
              <Label htmlFor="season">Sezona *</Label>
              <Input
                id="season"
                placeholder="napr. 2025/26"
                required
                value={season}
                onChange={(e) => setSeason(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format: 2025/26
              </p>
            </div>

            {formError && (
              <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {formError}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                className="flex-1 shadow-[0_0_16px_-4px_hsl(var(--primary)/0.4)]"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Vytvarim...' : 'Vytvorit tym'}
              </Button>
              <Button variant="outline" type="button" asChild>
                <Link href="/admin/teams">Zrusit</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
