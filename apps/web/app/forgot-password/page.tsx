'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Trophy, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError('Něco se pokazilo. Zkuste to prosím znovu.');
      } else {
        setError('Nelze se spojit se serverem.');
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
              Reset hesla
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-xl">
          <CardContent className="p-6">
            {done ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Pokud účet existuje, poslali jsme vám email s odkazem pro reset hesla.
                </p>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Zpět na přihlášení
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Zadejte svůj email a my vám pošleme odkaz pro reset hesla.
                </p>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="vas@email.cz"
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
                  {busy ? 'Odesílám...' : 'Odeslat odkaz'}
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
