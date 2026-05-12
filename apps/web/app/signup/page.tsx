'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { apiFetch, ApiError, type MeResponse } from '@/lib/api';
import { authStore } from '@/lib/auth-store';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Step = 'account' | 'club';

export default function SignupPage() {
  const router = useRouter();
  const { t } = useTranslation();
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
        setError(t('auth.emailTaken'));
      } else {
        setError(t('auth.registerFailed'));
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
        setError(t('auth.clubNameTaken'));
      } else {
        setError(t('auth.clubCreateFailed'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      <div className="pointer-events-none absolute inset-0 mesh-gradient" />
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-15" />

      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-lg">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">Sport Manager</div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {step === 'account' ? t('auth.register') : t('auth.createClub')}
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex gap-2">
          <div className={`h-1 flex-1 rounded-full ${step === 'account' ? 'bg-primary' : 'bg-primary/30'}`} />
          <div className={`h-1 flex-1 rounded-full ${step === 'club' ? 'bg-primary' : 'bg-border'}`} />
        </div>

        <Card className="overflow-hidden border-border/50 shadow-xl">
          <CardContent className="p-6">
            {step === 'account' ? (
              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">{t('account.firstName')}</Label>
                    <Input
                      id="firstName"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Jan"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">{t('account.lastName')}</Label>
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
                  <Label htmlFor="email">{t('auth.email')}</Label>
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
                  <Label htmlFor="password">{t('auth.password')}</Label>
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

                <Button type="submit" className="w-full bg-gradient-brand hover:brightness-110 shadow-md" disabled={busy}>
                  {busy ? t('auth.registering') : t('auth.continue')}
                </Button>

                <div className="text-center text-xs text-muted-foreground">
                  {t('auth.hasAccount')}{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    {t('auth.signIn')}
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleClubSubmit} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('auth.createClubDesc')}
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="clubName">{t('admin.clubName')}</Label>
                  <Input
                    id="clubName"
                    required
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    placeholder="FC Hvězda"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sport">{t('admin.sport')}</Label>
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

                <Button type="submit" className="w-full bg-gradient-brand hover:brightness-110 shadow-md" disabled={busy}>
                  {busy ? t('auth.creatingClub') : t('auth.createClub')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
