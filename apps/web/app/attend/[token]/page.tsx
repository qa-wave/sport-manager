'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, CheckCircle2, XCircle, Loader2, QrCode } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

type AttendResult =
  | { state: 'loading' }
  | { state: 'success'; eventTitle: string }
  | { state: 'error'; message: string }
  | { state: 'unauthenticated' };

function AttendContent() {
  const params = useParams();
  const token = params?.token as string;
  const auth = useAuth();
  const [result, setResult] = useState<AttendResult>({ state: 'loading' });

  useEffect(() => {
    if (!token) {
      setResult({ state: 'error', message: 'Odkaz je neplatný nebo mu chybí token.' });
      return;
    }

    if (!auth.isAuthenticated) {
      setResult({ state: 'unauthenticated' });
      return;
    }

    async function checkIn() {
      try {
        const data = await apiFetch<{ success: boolean; eventTitle: string }>(
          `/attend/${token}`,
          { method: 'POST' },
        );
        setResult({ state: 'success', eventTitle: data.eventTitle });
      } catch (err: any) {
        setResult({
          state: 'error',
          message: err?.message?.includes('400')
            ? 'Neplatný nebo expirovaný kód'
            : err?.message?.includes('403')
              ? 'Nemáte přístup k tomuto eventu'
              : 'Nepodařilo se zaznamenat docházku. Zkuste to prosím znovu.',
        });
      }
    }

    void checkIn();
  }, [token, auth.isAuthenticated]);

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
              QR Docházka
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-xl">
          <CardContent className="p-8">
            {result.state === 'loading' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Zaznamenávám docházku...</p>
              </div>
            )}

            {result.state === 'unauthenticated' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <QrCode className="h-9 w-9 text-primary" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold">Přihlaste se</h1>
                  <p className="text-sm text-muted-foreground">
                    Pro zaznamenání docházky se musíte přihlásit do aplikace.
                  </p>
                </div>
                <Button asChild className="mt-2 w-full h-10">
                  <Link href={`/login?redirect=/attend/${token}`}>Přihlásit se</Link>
                </Button>
              </div>
            )}

            {result.state === 'success' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold">Docházka potvrzena</h1>
                  <p className="text-sm text-muted-foreground">Vaše účast na události</p>
                  <p className="font-semibold">{result.eventTitle}</p>
                  <p className="text-sm text-muted-foreground">byla úspěšně zaznamenána.</p>
                </div>
                <Button asChild variant="outline" className="mt-2 w-full h-10">
                  <Link href="/admin">Zpět do aplikace</Link>
                </Button>
              </div>
            )}

            {result.state === 'error' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-9 w-9 text-destructive" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold">Chyba</h1>
                  <p className="text-sm text-muted-foreground">{result.message}</p>
                </div>
                <Button asChild variant="outline" className="mt-2 w-full h-10">
                  <Link href="/admin">Zpět do aplikace</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AttendPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <AttendContent />
    </Suspense>
  );
}
