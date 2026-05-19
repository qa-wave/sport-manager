'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { apiFetch, ApiError, type MeResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type StepId = 1 | 2 | 3 | 4 | 5;

const TOTAL_STEPS = 4; // step 5 is "done"

const DAYS_CS = [
  { value: 1, label: 'Pondělí' },
  { value: 2, label: 'Úterý' },
  { value: 3, label: 'Středa' },
  { value: 4, label: 'Čtvrtek' },
  { value: 5, label: 'Pátek' },
  { value: 6, label: 'Sobota' },
  { value: 0, label: 'Neděle' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function nextOccurrence(dayOfWeek: number, hour: number, minute: number): { startsAt: string; endsAt: string } {
  const now = new Date();
  const diff = (dayOfWeek - now.getDay() + 7) % 7 || 7;
  const date = new Date(now);
  date.setDate(now.getDate() + diff);
  date.setHours(hour, minute, 0, 0);
  const endsAt = new Date(date);
  endsAt.setHours(endsAt.getHours() + 1, endsAt.getMinutes() + 30);
  return {
    startsAt: date.toISOString(),
    endsAt: endsAt.toISOString(),
  };
}

function completeOnboarding() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('onboarding-complete', '1');
  }
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------
function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex flex-col items-center gap-3 mb-8">
      <div className="flex items-center gap-2">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const n = i + 1;
          const done = current > n;
          const active = current === n;
          return (
            <div key={n} className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 ${
                  done
                    ? 'bg-primary text-primary-foreground'
                    : active
                    ? 'bg-primary/20 text-primary ring-2 ring-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : n}
              </div>
              {n < TOTAL_STEPS && (
                <div
                  className={`h-0.5 w-8 rounded transition-all duration-500 ${
                    current > n ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Progress bar */}
      <div className="w-full max-w-xs h-1 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500"
          style={{ width: `${((current - 1) / TOTAL_STEPS) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Welcome
// ---------------------------------------------------------------------------
function StepWelcome({ clubName, onNext }: { clubName: string; onNext: () => void }) {
  return (
    <div className="animate-fade-up text-center space-y-6">
      <div className="text-5xl">🎉</div>
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{clubName}</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Váš klub je vytvořen. Pojďme ho společně nastavit.
        </p>
      </div>
      <Button
        className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90"
        onClick={onNext}
      >
        Začít <ChevronRight className="ml-1 h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Invite members
// ---------------------------------------------------------------------------
function StepInvite({ onNext, onSkip, onPrev }: { onNext: () => void; onSkip: () => void; onPrev: () => void }) {
  const [email, setEmail] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const auth = useAuth();

  function addEmail() {
    const trimmed = email.trim().toLowerCase();
    if (trimmed && trimmed.includes('@') && !emails.includes(trimmed)) {
      setEmails((prev) => [...prev, trimmed]);
      setEmail('');
    }
  }

  function removeEmail(e: string) {
    setEmails((prev) => prev.filter((x) => x !== e));
  }

  async function handleInvite() {
    if (emails.length === 0) { onNext(); return; }
    setSubmitting(true);
    const clubId = auth.clubId;

    for (const e of emails) {
      const firstName = e.split('@')[0] ?? 'Člen';
      try {
        await apiFetch('/members', {
          method: 'POST',
          body: JSON.stringify({ email: e, firstName, lastName: '' }),
          clubId,
        });
      } catch {
        // ignore individual failures — best effort
      }
    }
    setSubmitting(false);
    onNext();
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className="text-xl font-bold">Pozvěte členy</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Zadejte e-mailové adresy lidí, které chcete přidat do klubu.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          type="email"
          placeholder="jmeno@email.cz"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addEmail()}
          className="flex-1"
        />
        <Button variant="outline" size="sm" onClick={addEmail}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {emails.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {emails.map((e) => (
            <span
              key={e}
              className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            >
              {e}
              <button onClick={() => removeEmail(e)} className="ml-1 text-primary/60 hover:text-primary">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        Nebo{' '}
        <a href="/admin/members" className="underline text-primary">
          importujte CSV
        </a>{' '}
        ze stránky Členové.
      </p>

      <div className="flex gap-3 pt-2">
        <Button
          className="flex-1 bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90"
          onClick={handleInvite}
          disabled={submitting}
        >
          {submitting ? 'Odesílám...' : emails.length > 0 ? `Pozvat ${emails.length} člena` : 'Pokračovat'}
        </Button>
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
          Přeskočit
        </Button>
        <Button variant="ghost" size="sm" onClick={onPrev} className="text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Create team
// ---------------------------------------------------------------------------
function StepTeam({ onNext, onSkip, onPrev }: { onNext: () => void; onSkip: () => void; onPrev: () => void }) {
  const [name, setName] = useState('');
  const [sport, setSport] = useState('fotbal');
  const [ageGroup, setAgeGroup] = useState('');
  const auth = useAuth();

  const mutation = useMutation<unknown, ApiError, void>({
    mutationFn: () =>
      apiFetch('/teams', {
        method: 'POST',
        body: JSON.stringify({ name, sport, ageGroup: ageGroup || undefined, season: '2025/26' }),
        clubId: auth.clubId,
      }),
    onSuccess: onNext,
  });

  function handleSubmit() {
    if (!name.trim()) { onNext(); return; }
    mutation.mutate();
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className="text-xl font-bold">Vytvořte tým</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Jeden tým pro začátek stačí. Další přidáte kdykoliv.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="team-name">Název týmu</Label>
          <Input
            id="team-name"
            placeholder="např. U13, A-tým…"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="team-sport">Sport</Label>
          <Input
            id="team-sport"
            placeholder="fotbal, florbal, basketbal…"
            value={sport}
            onChange={(e) => setSport(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="team-age">Věková kategorie <span className="text-muted-foreground">(volitelně)</span></Label>
          <Input
            id="team-age"
            placeholder="např. U13, Dorost, Muži…"
            value={ageGroup}
            onChange={(e) => setAgeGroup(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {mutation.isError && (
        <p className="text-xs text-destructive">{mutation.error.message}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          className="flex-1 bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90"
          onClick={handleSubmit}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Ukládám...' : name.trim() ? 'Vytvořit tým' : 'Pokračovat'}
        </Button>
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
          Přeskočit
        </Button>
        <Button variant="ghost" size="sm" onClick={onPrev} className="text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4 — First training
// ---------------------------------------------------------------------------
const TRAINING_DEFAULT_DAY = 3;
const TRAINING_DEFAULT_TIME = '17:00';

function StepTraining({ onNext, onSkip, onPrev }: { onNext: () => void; onSkip: () => void; onPrev: () => void }) {
  const [day, setDay] = useState(TRAINING_DEFAULT_DAY);
  const [time, setTime] = useState(TRAINING_DEFAULT_TIME);
  const [location, setLocation] = useState('');
  const auth = useAuth();

  const mutation = useMutation<unknown, ApiError, void>({
    mutationFn: () => {
      const [h, m] = time.split(':').map(Number);
      const { startsAt, endsAt } = nextOccurrence(day, h ?? 17, m ?? 0);
      return apiFetch('/events', {
        method: 'POST',
        body: JSON.stringify({
          type: 'PRACTICE',
          title: 'Trénink',
          startsAt,
          endsAt,
          location: location || undefined,
        }),
        clubId: auth.clubId,
      });
    },
    onSuccess: onNext,
  });

  const isDefaultValues = day === TRAINING_DEFAULT_DAY && time === TRAINING_DEFAULT_TIME && !location.trim();

  function handleSubmit() {
    if (isDefaultValues) {
      onSkip();
      return;
    }
    mutation.mutate();
  }

  return (
    <div className="animate-fade-up space-y-5">
      <div>
        <h2 className="text-xl font-bold">Naplánujte první trénink</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Vytvoří se první trénink v nejbližší zvolený den.
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <Label>Den v týdnu</Label>
          <div className="mt-1 grid grid-cols-4 gap-1.5">
            {DAYS_CS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDay(d.value)}
                className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-all ${
                  day === d.value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40'
                }`}
              >
                {d.label.slice(0, 2)}
              </button>
            ))}
          </div>
        </div>
        <div>
          <Label htmlFor="training-time">Čas začátku</Label>
          <Input
            id="training-time"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="training-location">Místo <span className="text-muted-foreground">(volitelně)</span></Label>
          <Input
            id="training-location"
            placeholder="Hřiště, tělocvična…"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {mutation.isError && (
        <p className="text-xs text-destructive">{mutation.error.message}</p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          className="flex-1 bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90"
          onClick={handleSubmit}
          disabled={mutation.isPending}
        >
          {mutation.isPending ? 'Ukládám...' : isDefaultValues ? 'Přeskočit' : 'Naplánovat trénink'}
        </Button>
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
          Přeskočit
        </Button>
        <Button variant="ghost" size="sm" onClick={onPrev} className="text-muted-foreground">
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5 — Done
// ---------------------------------------------------------------------------
function StepDone({ clubName }: { clubName: string }) {
  const router = useRouter();

  return (
    <div className="animate-fade-up text-center space-y-6">
      <div className="text-6xl">🏆</div>
      <div>
        <h2 className="text-2xl font-bold">Váš klub je připraven!</h2>
        <p className="mt-2 text-muted-foreground text-sm">
          {clubName} je nastavený a připravený k akci.
        </p>
      </div>
      <div className="space-y-2 text-left rounded-xl border border-border/50 bg-primary/[0.03] p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Co dál?</p>
        <a href="/admin/members" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
          <ChevronRight className="h-3.5 w-3.5 text-primary" /> Přidat další členy
        </a>
        <a href="/admin/events/new" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
          <ChevronRight className="h-3.5 w-3.5 text-primary" /> Naplánovat zápas nebo turnaj
        </a>
        <a href="/admin/account" className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
          <ChevronRight className="h-3.5 w-3.5 text-primary" /> Nastavit barvy a logo klubu
        </a>
      </div>
      <Button
        className="w-full bg-gradient-to-r from-primary to-emerald-500 hover:opacity-90"
        onClick={() => {
          completeOnboarding();
          router.push('/admin');
        }}
      >
        Přejít na dashboard
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main wizard page
// ---------------------------------------------------------------------------
export default function OnboardingPage() {
  const [step, setStep] = useState<StepId>(1);
  const auth = useAuth();

  const { data: me } = useQuery<MeResponse, ApiError>({
    queryKey: ['me', auth.accessToken],
    queryFn: () => apiFetch<MeResponse>('/me'),
    enabled: auth.isAuthenticated,
  });

  const clubName = me?.members.find((m) => m.clubId === auth.clubId)?.club.name ?? 'Váš klub';

  function next() { setStep((s) => Math.min((s + 1) as StepId, 5) as StepId); }
  function prev() { setStep((s) => Math.max((s - 1) as StepId, 1) as StepId); }
  function skip() { next(); }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Subtle mesh gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[400px] w-[400px] rounded-full bg-emerald-500/5 blur-3xl" />
      </div>

      <Card className="relative w-full max-w-lg mx-4 border-border/50 shadow-2xl">
        <CardContent className="p-8">
          {step < 5 && <StepIndicator current={step} />}

          {step === 1 && <StepWelcome clubName={clubName} onNext={next} />}
          {step === 2 && <StepInvite onNext={next} onSkip={skip} onPrev={prev} />}
          {step === 3 && <StepTeam onNext={next} onSkip={skip} onPrev={prev} />}
          {step === 4 && <StepTraining onNext={next} onSkip={skip} onPrev={prev} />}
          {step === 5 && <StepDone clubName={clubName} />}
        </CardContent>
      </Card>
    </div>
  );
}
