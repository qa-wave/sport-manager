'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Trophy, CheckCircle2, XCircle } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { authStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { QueryProvider } from '@/components/query-provider';

export default function JoinPage() {
  return (
    <QueryProvider>
      <Suspense>
        <JoinContent />
      </Suspense>
    </QueryProvider>
  );
}

function JoinContent() {
  const router = useRouter();
  const params = useSearchParams();
  const auth = useAuth();
  const token = params.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'login-required'>('loading');
  const [clubId, setClubId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Chybí pozvánkový token.');
      return;
    }

    if (!auth.isAuthenticated) {
      setStatus('login-required');
      return;
    }

    apiFetch<{ clubId: string; message: string }>('/clubs/join', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
      .then((res) => {
        setClubId(res.clubId);
        setStatus('success');
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err instanceof ApiError && err.status === 400
          ? 'Pozvánka je neplatná nebo vypršela.'
          : 'Nepodařilo se připojit ke klubu.');
      });
  }, [token, auth.isAuthenticated]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      <div className="pointer-events-none absolute inset-0 mesh-gradient" />
      <div className="relative w-full max-w-sm animate-fade-up">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-lg">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">Sport Manager</div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">Pozvánka do klubu</div>
          </div>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-xl">
          <CardContent className="p-8 text-center">
            {status === 'loading' && (
              <>
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Připojuji ke klubu...</p>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <h2 className="text-lg font-semibold">Připojeno!</h2>
                <p className="mt-2 text-sm text-muted-foreground">Byli jste úspěšně přidáni do klubu.</p>
                <Button
                  className="mt-6 bg-gradient-brand"
                  onClick={() => {
                    if (clubId) {
                      authStore.setSession(auth.accessToken!, clubId);
                    }
                    router.push('/admin');
                  }}
                >
                  Přejít do klubu
                </Button>
              </>
            )}

            {status === 'login-required' && (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Přihlaste se</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pro připojení ke klubu se nejdřív přihlaste nebo zaregistrujte.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <Button className="bg-gradient-brand" asChild>
                    <Link href={`/login?redirect=/join?token=${token}`}>Přihlásit se</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/signup?redirect=/join?token=${token}`}>Registrace</Link>
                  </Button>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                  <XCircle className="h-7 w-7 text-destructive" />
                </div>
                <h2 className="text-lg font-semibold">Chyba</h2>
                <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
                <Button variant="outline" className="mt-6" asChild>
                  <Link href="/">Zpět na úvod</Link>
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
