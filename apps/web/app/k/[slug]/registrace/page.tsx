'use client';

import { useState, type FormEvent } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Trophy, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { QueryProvider } from '@/components/query-provider';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

type RegistrationConfig = {
  open: boolean;
  clubName: string;
  teams: Array<{ id: string; name: string; sport: string; ageGroup: string | null; season: string }>;
  fields: Array<{ name: string; label: string; required: boolean; type?: string }>;
};

async function fetchPublicFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...opts.headers },
    ...opts,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export default function RegistrationPage() {
  return (
    <QueryProvider>
      <RegistrationContent />
    </QueryProvider>
  );
}

function RegistrationContent() {
  const { slug } = useParams<{ slug: string }>();

  const { data, isLoading, isError } = useQuery<RegistrationConfig>({
    queryKey: ['public-registration', slug],
    queryFn: () => fetchPublicFetch<RegistrationConfig>(`/clubs/public/${slug}/registration`),
    enabled: !!slug,
    retry: false,
  });

  const [form, setForm] = useState({
    childFirstName: '',
    childLastName: '',
    dateOfBirth: '',
    parentFirstName: '',
    parentLastName: '',
    parentEmail: '',
    parentPhone: '',
    teamId: '',
    notes: '',
  });
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      fetchPublicFetch<{ message: string }>(`/clubs/public/${slug}/registration`, {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          teamId: form.teamId || undefined,
          parentPhone: form.parentPhone || undefined,
          notes: form.notes || undefined,
        }),
      }),
    onSuccess: () => {
      setSuccess(true);
      setServerError(null);
    },
    onError: (err: Error) => setServerError(err.message),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setServerError(null);
    mutation.mutate();
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="mx-auto h-10 w-48" />
          <Skeleton className="h-6 w-60 mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <Trophy className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <h1 className="text-lg font-bold">Klub nenalezen</h1>
        <p className="text-sm text-muted-foreground mt-1">Tato stránka neexistuje.</p>
      </div>
    );
  }

  if (!data.open) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
          <Trophy className="h-8 w-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold">{data.clubName}</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Registrace je momentálně uzavřena.
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">
          Kontaktujte administrátora klubu pro více informací.
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h1 className="text-xl font-bold">Registrace odeslána</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          Vaše registrace do klubu <strong>{data.clubName}</strong> byla úspěšně odeslána.
          Potvrzení jsme zaslali na váš email. Administrátor Vás brzy kontaktuje.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-lg px-6 py-3">
        <div className="mx-auto flex max-w-xl items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold">{data.clubName}</span>
        </div>
      </header>

      {/* Form */}
      <main className="mx-auto max-w-xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Registrace</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vyplňte formulář a zaregistrujte své dítě do klubu {data.clubName}.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Child info */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="border-b border-border/30 px-4 py-3">
                <span className="text-sm font-semibold">Informace o dítěti</span>
              </div>
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Jméno <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      value={form.childFirstName}
                      onChange={(e) => setForm((f) => ({ ...f, childFirstName: e.target.value }))}
                      placeholder="Anna"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Příjmení <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      value={form.childLastName}
                      onChange={(e) => setForm((f) => ({ ...f, childLastName: e.target.value }))}
                      placeholder="Novakova"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Datum narození <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
                  />
                </div>
                {data.teams.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Tým</label>
                    <select
                      value={form.teamId}
                      onChange={(e) => setForm((f) => ({ ...f, teamId: e.target.value }))}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      <option value="">Nenastaveno</option>
                      {data.teams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}{t.ageGroup ? ` (${t.ageGroup})` : ''} — {t.season}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Parent info */}
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="border-b border-border/30 px-4 py-3">
                <span className="text-sm font-semibold">Informace o rodiči / zákonném zástupci</span>
              </div>
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Jméno <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      value={form.parentFirstName}
                      onChange={(e) => setForm((f) => ({ ...f, parentFirstName: e.target.value }))}
                      placeholder="Lucie"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Příjmení <span className="text-destructive">*</span>
                    </label>
                    <Input
                      required
                      value={form.parentLastName}
                      onChange={(e) => setForm((f) => ({ ...f, parentLastName: e.target.value }))}
                      placeholder="Novakova"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Email <span className="text-destructive">*</span>
                  </label>
                  <Input
                    required
                    type="email"
                    value={form.parentEmail}
                    onChange={(e) => setForm((f) => ({ ...f, parentEmail: e.target.value }))}
                    placeholder="lucie@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Telefon</label>
                  <Input
                    type="tel"
                    value={form.parentPhone}
                    onChange={(e) => setForm((f) => ({ ...f, parentPhone: e.target.value }))}
                    placeholder="+420 777 888 999"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Poznámky (volitelné)</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Alergie, zdravotní omezení, jiné poznámky..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {serverError && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Odesílám...' : 'Odeslat registraci'}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Odesláním formuláře souhlasíte se zpracováním osobních údajů za účelem registrace do klubu.
          </p>
        </form>
      </main>
    </div>
  );
}
