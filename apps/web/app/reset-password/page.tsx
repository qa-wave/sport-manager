'use client';

import { useState, type FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, ArrowLeft } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">
          Odkaz pro reset hesla je neplatný nebo mu chybí token.
        </p>
        <Link
          href="/forgot-password"
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Požádat o nový odkaz
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError('Hesla se neshodují.');
      return;
    }
    if (password.length < 8) {
      setError('Heslo musí mít alespoň 8 znaků.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
      router.replace('/login?reset=1');
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError('Odkaz pro reset hesla je neplatný nebo vypršel. Požádejte o nový.');
      } else {
        setError('Něco se pokazilo. Zkuste to prosím znovu.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-muted-foreground">Zadejte nové heslo pro svůj účet.</p>

      <div className="space-y-1.5">
        <Label htmlFor="password">Nové heslo</Label>
        <Input
          id="password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimálně 8 znaků"
          className="h-10"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm">Potvrdit heslo</Label>
        <Input
          id="confirm"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Zopakujte heslo"
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
        {busy ? 'Ukládám...' : 'Nastavit nové heslo'}
      </Button>

      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Zpět na přihlášení
        </Link>
      </div>
    </form>
  );
}

export default function ResetPasswordPage() {
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
              Nové heslo
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-xl">
          <CardContent className="p-6">
            <Suspense fallback={<div className="h-40" />}>
              <ResetPasswordForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
