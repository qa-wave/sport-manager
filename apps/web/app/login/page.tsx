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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@hvezda.cz');
  const [password, setPassword] = useState('heslo123');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const loginRes = await apiFetch<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      const { accessToken } = loginRes;

      authStore.setSession(accessToken, null);
      const me = await apiFetch<MeResponse>('/me');
      const firstClubId = me.members[0]?.clubId ?? null;
      authStore.setSession(accessToken, firstClubId);

      if (!firstClubId) {
        router.push('/signup');
        return;
      }
      router.push('/admin');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Nesprávný email nebo heslo.');
      } else {
        setError('Něco se pokazilo. Běží API?');
      }
      authStore.clear();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 mesh-gradient" />
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-15" />

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-lg">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">Sport Manager</div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              Přihlášení
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-10 bg-gradient-brand hover:brightness-110 transition-all shadow-md"
                disabled={busy}
              >
                {busy ? 'Přihlašuji...' : 'Přihlásit se'}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                Nemáš účet?{' '}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  Zaregistruj se
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Quick login hints */}
        <div className="mt-6 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">Demo účty</div>
          <div className="space-y-2">
            {[
              { email: 'admin@hvezda.cz', role: 'Admin' },
              { email: 'coach@hvezda.cz', role: 'Trenér' },
              { email: 'parent@hvezda.cz', role: 'Rodič' },
            ].map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs transition-colors hover:bg-muted"
                onClick={() => { setEmail(acc.email); setPassword('heslo123'); }}
              >
                <span className="font-mono text-muted-foreground">{acc.email}</span>
                <span className="font-semibold text-primary">{acc.role}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
