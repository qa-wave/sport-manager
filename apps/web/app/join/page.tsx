'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Trophy, CheckCircle2, XCircle, Users } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { authStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { QueryProvider } from '@/components/query-provider';

type TeamRole = 'PLAYER' | 'HEAD_COACH' | 'ASSISTANT_COACH' | 'TEAM_MANAGER' | 'MEDIC';

type RoleOption =
  | { kind: 'team'; value: TeamRole; label: string; needsTeam: true }
  | { kind: 'none'; value: 'NONE'; label: string; needsTeam: false };

const ROLE_OPTIONS: RoleOption[] = [
  { kind: 'team', value: 'PLAYER', label: 'Hráč / Hráčka', needsTeam: true },
  { kind: 'team', value: 'HEAD_COACH', label: 'Hlavní trenér', needsTeam: true },
  { kind: 'team', value: 'ASSISTANT_COACH', label: 'Asistent trenéra', needsTeam: true },
  { kind: 'team', value: 'TEAM_MANAGER', label: 'Team manager', needsTeam: true },
  { kind: 'team', value: 'MEDIC', label: 'Zdravotník', needsTeam: true },
  { kind: 'none', value: 'NONE', label: 'Rodič nebo jen člen klubu (bez týmu)', needsTeam: false },
];

type InviteInfo = {
  clubId: string;
  clubName: string;
  slug: string;
  teams: Array<{ id: string; name: string; sport: string; ageGroup: string | null }>;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

async function fetchPublic<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`);
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

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

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [status, setStatus] = useState<
    'loading' | 'login-required' | 'picking-role' | 'joining' | 'success' | 'error'
  >('loading');
  const [clubId, setClubId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedRole, setSelectedRole] = useState<TeamRole | 'NONE'>('PLAYER');
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');

  // 1. Load invite info from token (public, no auth needed)
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('Chybí pozvánkový token.');
      return;
    }
    fetchPublic<InviteInfo>(`/clubs/public/invite-info?token=${encodeURIComponent(token)}`)
      .then((data) => {
        setInfo(data);
        if (data.teams.length > 0) setSelectedTeamId(data.teams[0]!.id);
        if (!auth.isAuthenticated) {
          setStatus('login-required');
        } else {
          setStatus('picking-role');
        }
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'Pozvánka je neplatná nebo vypršela.');
      });
  }, [token, auth.isAuthenticated]);

  async function handleJoin() {
    if (!token) return;
    setStatus('joining');
    setErrorMsg('');
    try {
      const opt = ROLE_OPTIONS.find((o) => o.value === selectedRole);
      const body: { token: string; teamRole?: TeamRole; teamId?: string } = { token };
      if (opt && opt.kind === 'team' && selectedTeamId) {
        body.teamRole = opt.value;
        body.teamId = selectedTeamId;
      }
      const res = await apiFetch<{ clubId: string }>('/clubs/join', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setClubId(res.clubId);
      setStatus('success');
    } catch (err) {
      setStatus('picking-role');
      setErrorMsg(
        err instanceof ApiError && err.status === 400
          ? 'Pozvánka je neplatná nebo vypršela.'
          : err instanceof Error
            ? err.message
            : 'Nepodařilo se připojit ke klubu.',
      );
    }
  }

  const activeOption = ROLE_OPTIONS.find((o) => o.value === selectedRole);
  const needsTeam = activeOption?.kind === 'team';

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      <div className="pointer-events-none absolute inset-0 mesh-gradient" />
      <div className="relative w-full max-w-md animate-fade-up">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-lg">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">Sport Manager</div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              Pozvánka do klubu
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-xl">
          <CardContent className="p-8">
            {status === 'loading' && (
              <div className="text-center">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-sm text-muted-foreground">Načítám pozvánku…</p>
              </div>
            )}

            {status === 'login-required' && info && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Trophy className="h-7 w-7 text-primary" />
                </div>
                <h2 className="text-lg font-semibold">Vítej v {info.clubName}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pro připojení se nejdřív přihlas nebo zaregistruj.
                </p>
                <div className="mt-6 flex flex-col gap-2">
                  <Button className="bg-gradient-brand" asChild>
                    <Link href={`/login?redirect=/join?token=${token}`}>Přihlásit se</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href={`/signup?redirect=/join?token=${token}`}>Registrace</Link>
                  </Button>
                </div>
              </div>
            )}

            {(status === 'picking-role' || status === 'joining') && info && (
              <div>
                <div className="mb-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Users className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold">Vítej v {info.clubName}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Vyber svoji roli, ať tě admin nemusí pak ručně přiřazovat.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Tvoje role</Label>
                    <select
                      id="role"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as TeamRole | 'NONE')}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      disabled={status === 'joining'}
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {needsTeam && info.teams.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="team">Tým</Label>
                      <select
                        id="team"
                        value={selectedTeamId}
                        onChange={(e) => setSelectedTeamId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        disabled={status === 'joining'}
                      >
                        {info.teams.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                            {t.ageGroup ? ` · ${t.ageGroup}` : ''} · {t.sport}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {needsTeam && info.teams.length === 0 && (
                    <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
                      Klub zatím nemá žádné týmy. Tvoje team role bude přiřazena později — pro teď
                      tě přidáme jen jako člena klubu.
                    </p>
                  )}

                  {errorMsg && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                      {errorMsg}
                    </p>
                  )}

                  <Button
                    className="w-full bg-gradient-brand"
                    onClick={handleJoin}
                    disabled={status === 'joining' || (needsTeam && info.teams.length > 0 && !selectedTeamId)}
                  >
                    {status === 'joining' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Připojuji…
                      </>
                    ) : (
                      'Připojit se ke klubu'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500" />
                </div>
                <h2 className="text-lg font-semibold">Připojeno!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Byl/a jsi úspěšně přidán/a do klubu {info?.clubName ?? ''}.
                </p>
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
              </div>
            )}

            {status === 'error' && (
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
                  <XCircle className="h-7 w-7 text-destructive" />
                </div>
                <h2 className="text-lg font-semibold">Chyba</h2>
                <p className="mt-2 text-sm text-muted-foreground">{errorMsg}</p>
                <Button variant="outline" className="mt-6" asChild>
                  <Link href="/">Zpět na úvod</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
