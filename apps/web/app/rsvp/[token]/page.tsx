'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type RsvpResult =
  | { state: 'loading' }
  | { state: 'success'; eventTitle: string; status: string }
  | { state: 'error'; message: string };

function statusLabel(status: string): string {
  if (status === 'YES') return 'Účast potvrzena';
  if (status === 'NO') return 'Účast odmítnuta';
  if (status === 'MAYBE') return 'Účast je nejistá';
  return status;
}

function RsvpContent() {
  const params = useParams();
  const token = params?.token as string;
  const [result, setResult] = useState<RsvpResult>({ state: 'loading' });

  useEffect(() => {
    if (!token) {
      setResult({ state: 'error', message: 'Odkaz je neplatný nebo mu chybí token.' });
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/v1/rsvp/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setResult({
            state: 'error',
            message: data.message ?? 'Odkaz je neplatný nebo vypršel.',
          });
          return;
        }

        setResult({
          state: 'success',
          eventTitle: data.eventTitle,
          status: data.status,
        });
      } catch {
        setResult({
          state: 'error',
          message: 'Nepodařilo se ověřit odkaz. Zkuste to prosím znovu.',
        });
      }
    }

    void verify();
  }, [token]);

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
              RSVP
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-xl">
          <CardContent className="p-8">
            {result.state === 'loading' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Ověřuji odkaz...</p>
              </div>
            )}

            {result.state === 'success' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold">{statusLabel(result.status)}</h1>
                  <p className="text-sm text-muted-foreground">
                    Vaše odpověď na událost
                  </p>
                  <p className="font-semibold">{result.eventTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    byla úspěšně zaznamenána.
                  </p>
                </div>
                <Button asChild variant="outline" className="mt-2 w-full h-10">
                  <Link href="/login">Přihlásit se do aplikace</Link>
                </Button>
              </div>
            )}

            {result.state === 'error' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-9 w-9 text-destructive" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold">Odkaz je neplatný</h1>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                </div>
                <Button asChild variant="outline" className="mt-2 w-full h-10">
                  <Link href="/login">Přihlásit se do aplikace</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RsvpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RsvpContent />
    </Suspense>
  );
}
