'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { apiFetch, ApiError, type MeResponse } from '@/lib/api';
import { authStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'account' | 'club';

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('account');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Club fields
  const [clubName, setClubName] = useState('');
  const [sport, setSport] = useState('Fotbal');

  async function handleAccountSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName }),
      });
      authStore.setSession(res.accessToken, null);
      setStep('club');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Tento email je již registrován.');
      } else {
        setError('Registrace selhala. Zkus to znovu.');
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleClubSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const club = await apiFetch<{ club: { id: string } }>('/clubs', {
        method: 'POST',
        body: JSON.stringify({ name: clubName, sport }),
      });

      // Refresh session with new club
      const me = await apiFetch<MeResponse>('/me');
      const clubId = me.members.find((m) => m.clubId === club.club.id)?.clubId ?? me.members[0]?.clubId ?? null;
      authStore.setSession(authStore.getAccessToken()!, clubId);

      router.push('/admin');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Klub s tímto názvem již existuje.');
      } else {
        setError('Nepodařilo se vytvořit klub.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-primary/[0.03] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 h-72 w-72 rounded-full bg-cyan-500/[0.02] blur-[80px]" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.4)]">
            <Trophy className="h-5 w-5 text-primary" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">Sport Manager</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {step === 'account' ? 'Registrace' : 'Založení klubu'}
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex gap-2">
          <div className={`h-1 flex-1 rounded-full ${step === 'account' ? 'bg-primary' : 'bg-primary/30'}`} />
          <div className={`h-1 flex-1 rounded-full ${step === 'club' ? 'bg-primary' : 'bg-border'}`} />
        </div>

        <Card className="gradient-card overflow-hidden border-border/60">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <CardContent className="p-6">
            {step === 'account' ? (
              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">Jméno</Label>
                    <Input
                      id="firstName"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jan"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Příjmení</Label>
                    <Input
                      id="lastName"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Novák"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jan@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="password">Heslo</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="min. 8 znaků"
                  />
                </div>

                {error && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? 'Registruji...' : 'Pokračovat'}
                </Button>

                <div className="text-center text-xs text-muted-foreground">
                  Už máš účet?{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    Přihlásit se
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleClubSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Skvěle! Teď založ svůj první klub.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="clubName">Název klubu</Label>
                  <Input
                    id="clubName"
                    required
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="FC Hvězda"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sport">Sport</Label>
                  <select
                    id="sport"
                    value={sport}
                    onChange={(e) => setSport(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="Fotbal">Fotbal</option>
                    <option value="Florbal">Florbal</option>
                    <option value="Hokej">Hokej</option>
                    <option value="Basketbal">Basketbal</option>
                    <option value="Volejbal">Volejbal</option>
                    <option value="Tenis">Tenis</option>
                    <option value="Atletika">Atletika</option>
                    <option value="Jiný">Jiný</option>
                  </select>
                </div>

                {error && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? 'Vytvářím klub...' : 'Založit klub'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
