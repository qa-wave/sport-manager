'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Trophy } from 'lucide-react';
import { apiFetch, ApiError, type MeResponse } from '@/lib/api';
import { authStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@example.com');
  const [password, setPassword] = useState('password');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const loginRes = await fetch(
        (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001') +
          '/auth/login',
        {
          method: 'POST',
          credentials: 'include',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email, password }),
        },
      );
      if (!loginRes.ok) {
        throw new ApiError(loginRes.status, 'Invalid credentials');
      }
      const { accessToken } = (await loginRes.json()) as { accessToken: string };

      authStore.setSession(accessToken, null);
      const me = await apiFetch<MeResponse>('/me');
      const firstClubId = me.members[0]?.clubId ?? null;
      authStore.setSession(accessToken, firstClubId);

      router.push('/admin');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email or password.');
      } else {
        setError('Something went wrong. Is the API running on :3001?');
      }
      authStore.clear();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      {/* Background sport gradient */}
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
            <div className="text-base font-bold tracking-tight">Club App</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Admin Console
            </div>
          </div>
        </div>

        <Card className="gradient-card overflow-hidden border-border/60">
          {/* Top accent line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
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
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full shadow-[0_0_16px_-4px_hsl(var(--primary)/0.4)]" disabled={busy}>
                {busy ? 'Signing in...' : 'Sign in'}
              </Button>

              <div className="pt-2 text-[11px] text-muted-foreground">
                Seeded accounts (dev):{' '}
                <code className="rounded bg-secondary px-1 py-0.5">admin@example.com</code>
                {' · '}
                <code className="rounded bg-secondary px-1 py-0.5">coach@example.com</code>
                {' · '}
                <code className="rounded bg-secondary px-1 py-0.5">mom@example.com</code>
                {' — all password '}
                <code className="rounded bg-secondary px-1 py-0.5">password</code>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
