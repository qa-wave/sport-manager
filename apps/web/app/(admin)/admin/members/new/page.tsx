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

const TEAM_ROLES = [
  { value: 'PLAYER', label: 'Hráč' },
  { value: 'HEAD_COACH', label: 'Hlavní trenér' },
  { value: 'ASSISTANT_COACH', label: 'Asistent trenéra' },
  { value: 'TEAM_MANAGER', label: 'Team manager' },
  { value: 'MEDIC', label: 'Zdravotník' },
] as const;

type TeamRole = (typeof TEAM_ROLES)[number]['value'];

export default function NewMemberPage() {
  const auth = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [teamId, setTeamId] = useState('');
  const [teamRole, setTeamRole] = useState<TeamRole>('PLAYER');
  const [formError, setFormError] = useState<string | null>(null);

  const teams = useQuery<TeamSummary[], ApiError>({
    queryKey: ['teams', auth.clubId],
    queryFn: () => apiFetch<TeamSummary[]>('/teams'),
    enabled: auth.isAuthenticated && !!auth.clubId,
  });

  const createMutation = useMutation<{ id: string }, ApiError, object>({
    mutationFn: (body) =>
      apiFetch<{ id: string }>('/members', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      router.push('/admin/members');
    },
    onError: (err) => {
      setFormError(
        err?.message?.includes('409')
          ? 'Uživatel už je členem tohoto klubu.'
          : (err?.message ?? 'Nepodařilo se přidat člena.'),
      );
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setFormError('Jméno, příjmení a e-mail jsou povinné.');
      return;
    }

    const body: Record<string, string> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
    };

    if (teamId) {
      body.teamId = teamId;
      body.teamRole = teamRole;
    }

    createMutation.mutate(body);
  }

  return (
    <>
      <PageHeader
        title="Přidat člena"
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/members">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Zpět na členy
            </Link>
          </Button>
        }
      />

      <Card>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Jmeno + Prijmeni */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Jméno *</Label>
                <Input
                  id="firstName"
                  placeholder="napr. Jan"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Příjmení *</Label>
                <Input
                  id="lastName"
                  placeholder="napr. Novak"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            {/* E-mail */}
            <div className="space-y-1.5">
              <Label htmlFor="email">E-mail *</Label>
              <Input
                id="email"
                type="email"
                placeholder="napr. jan.novak@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* Tym (volitelne) */}
            <div className="space-y-1.5">
              <Label htmlFor="team">Tým (volitelné)</Label>
              <select
                id="team"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">Bez týmu</option>
                {teams.data?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Role v tymu (jen kdyz je vybran tym) */}
            {teamId && (
              <div className="space-y-1.5">
                <Label>Role v týmu</Label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setTeamRole(r.value)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        teamRole === r.value
                          ? 'bg-primary text-primary-foreground shadow-[0_0_10px_-2px_hsl(var(--primary)/0.4)]'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
                {createMutation.isPending ? 'Přidávám...' : 'Přidat člena'}
              </Button>
              <Button variant="outline" type="button" asChild>
                <Link href="/admin/members">Zrušit</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
