'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Trophy, CheckCircle2, XCircle, Loader2, CalendarDays, MapPin, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EventInfo = {
  eventTitle: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  suggestedStatus: 'YES' | 'NO' | 'MAYBE' | string;
};

type Screen =
  | { state: 'loading' }
  | { state: 'confirm'; event: EventInfo; selectedStatus: string }
  | { state: 'submitting' }
  | { state: 'success'; eventTitle: string; status: string }
  | { state: 'error'; message: string };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function statusLabel(status: string): string {
  if (status === 'YES') return 'Účast potvrzena';
  if (status === 'NO') return 'Účast odmítnuta';
  if (status === 'MAYBE') return 'Účast je nejistá';
  return status;
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

function RsvpContent() {
  const params = useParams();
  const token = params?.token as string;
  const [screen, setScreen] = useState<Screen>({ state: 'loading' });

  // Step 1 — load event info without recording RSVP
  useEffect(() => {
    if (!token) {
      setScreen({ state: 'error', message: 'Odkaz je neplatný nebo mu chybí token.' });
      return;
    }

    async function loadEvent() {
      try {
        const res = await fetch(`/api/v1/rsvp/${token}`);
        const data = await res.json();

        if (!res.ok) {
          setScreen({
            state: 'error',
            message: data.message ?? 'Odkaz je neplatný nebo vypršel.',
          });
          return;
        }

        setScreen({
          state: 'confirm',
          event: data as EventInfo,
          selectedStatus: data.suggestedStatus ?? 'YES',
        });
      } catch {
        setScreen({
          state: 'error',
          message: 'Nepodařilo se načíst informace o události. Zkuste to prosím znovu.',
        });
      }
    }

    void loadEvent();
  }, [token]);

  // Step 2 — submit RSVP with chosen status
  async function submitRsvp(status: string) {
    if (screen.state !== 'confirm') return;
    setScreen({ state: 'submitting' });

    try {
      const res = await fetch(`/api/v1/rsvp/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();

      if (!res.ok) {
        setScreen({
          state: 'error',
          message: data.message ?? 'Nepodařilo se odeslat odpověď. Zkuste to prosím znovu.',
        });
        return;
      }

      setScreen({
        state: 'success',
        eventTitle: data.eventTitle,
        status: data.status,
      });
    } catch {
      setScreen({
        state: 'error',
        message: 'Nepodařilo se odeslat odpověď. Zkuste to prosím znovu.',
      });
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      <div className="pointer-events-none absolute inset-0 mesh-gradient" />
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-15" />

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Logo */}
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

            {/* Loading */}
            {screen.state === 'loading' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Načítám informace o události…</p>
              </div>
            )}

            {/* Confirm screen */}
            {screen.state === 'confirm' && (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    Pozvánka na událost
                  </p>
                  <h1 className="text-xl font-bold leading-tight">{screen.event.eventTitle}</h1>
                </div>

                {/* Event details */}
                <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
                  <div className="flex items-start gap-2 text-muted-foreground">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{formatDateTime(screen.event.startsAt)}</span>
                  </div>
                  {screen.event.location && (
                    <div className="flex items-start gap-2 text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{screen.event.location}</span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">Jaká je vaše účast?</p>

                {/* RSVP buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    className="h-11 w-full justify-start gap-3 bg-green-600 text-white hover:bg-green-700"
                    onClick={() => submitRsvp('YES')}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Zúčastním se
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-full justify-start gap-3 border-amber-400/60 text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/30"
                    onClick={() => submitRsvp('MAYBE')}
                  >
                    <HelpCircle className="h-5 w-5" />
                    Možná
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-full justify-start gap-3 border-destructive/40 text-destructive hover:bg-destructive/5"
                    onClick={() => submitRsvp('NO')}
                  >
                    <XCircle className="h-5 w-5" />
                    Nemohu se zúčastnit
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Váš výběr se uloží okamžitě. Odpověď můžete kdykoli změnit v aplikaci.
                </p>
              </div>
            )}

            {/* Submitting */}
            {screen.state === 'submitting' && (
              <div className="flex flex-col items-center gap-4 py-4">
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Ukládám odpověď…</p>
              </div>
            )}

            {/* Success */}
            {screen.state === 'success' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                  <CheckCircle2 className="h-9 w-9 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold">{statusLabel(screen.status)}</h1>
                  <p className="text-sm text-muted-foreground">
                    Vaše odpověď na událost
                  </p>
                  <p className="font-semibold">{screen.eventTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    byla úspěšně zaznamenána.
                  </p>
                </div>
                <Button asChild variant="outline" className="mt-2 w-full h-10">
                  <Link href="/login">Přihlásit se do aplikace</Link>
                </Button>
              </div>
            )}

            {/* Error */}
            {screen.state === 'error' && (
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <XCircle className="h-9 w-9 text-destructive" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold">Odkaz je neplatný</h1>
                  <p className="text-sm text-muted-foreground">{screen.message}</p>
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
