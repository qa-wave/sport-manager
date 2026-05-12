'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent, Suspense } from 'react';
import Link from 'next/link';
import { Trophy } from 'lucide-react';
import { apiFetch, ApiError, type MeResponse } from '@/lib/api';
import { authStore } from '@/lib/auth-store';
import { useTranslation } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const DEMO_PASSWORD = 'heslo123';

const DEMO_ACCOUNTS: Array<{
  email: string;
  role: string;
  hint: string;
  accent: 'primary' | 'amber' | 'emerald' | 'rose' | 'violet' | 'slate';
}> = [
  { email: 'admin@hvezda.cz',        role: 'Admin klubu',     hint: 'FC Hvězda — vše',                                  accent: 'primary' },
  { email: 'coach@hvezda.cz',        role: 'Hlavní trenér',   hint: 'U13 — RSVP, attendance, chat',                     accent: 'amber'   },
  { email: 'parent@hvezda.cz',       role: 'Máma',            hint: 'Lucie — vidí DM s trenérem',                       accent: 'emerald' },
  { email: 'petr.pekar@hvezda.cz',   role: 'Táta (rozvedený)', hint: 'Petr — nevidí DM ani platby',                     accent: 'rose'    },
  { email: 'simon.assist@hvezda.cz', role: 'Hráč 16+',        hint: 'Šimon — U15 hráč + U13 asistent',                  accent: 'violet'  },
  { email: 'tomas@example.com',      role: 'Multi-klub',      hint: 'Tomáš — Hvězda rodič + Sokol trenér',              accent: 'primary' },
  { email: 'admin@sokoli.cz',        role: 'Admin Sokoli',    hint: 'TJ Sokol Měcholupy — florbal',                     accent: 'emerald' },
  { email: 'platform@example.com',   role: 'Platform admin',  hint: 'Super-user, cross-club',                           accent: 'slate'   },
];

const accentClasses: Record<typeof DEMO_ACCOUNTS[number]['accent'], string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  amber:   'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  rose:    'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20',
  violet:  'bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20',
  slate:   'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20',
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const resetSuccess = searchParams.get('reset') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [busyDemo, setBusyDemo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function doLogin(emailValue: string, passwordValue: string) {
    setError(null);
    try {
      const loginRes = await apiFetch<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });
      const { accessToken } = loginRes;

      authStore.setSession(accessToken, null);
      const me = await apiFetch<MeResponse>('/me');
      const firstClubId = me.members[0]?.clubId ?? null;
      authStore.setSession(accessToken, firstClubId);

      if (!firstClubId) {
        router.push('/signup');
        return;
      }
      router.push('/admin');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError(t('auth.invalidCredentials'));
      } else {
        setError(t('auth.loginError'));
      }
      authStore.clear();
      throw err;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try { await doLogin(email, password); }
    catch {/* error state already set */}
    finally { setBusy(false); }
  }

  async function handleDemoClick(emailValue: string) {
    if (busyDemo || busy) return;
    setBusyDemo(emailValue);
    try { await doLogin(emailValue, DEMO_PASSWORD); }
    catch {/* error state already set */}
    finally { setBusyDemo(null); }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 mesh-gradient" />
      <div className="pointer-events-none absolute inset-0 dot-grid opacity-15" />

      <div className="relative w-full max-w-sm animate-fade-up">
        {/* Brand */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-brand text-white shadow-lg">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">Sport Manager</div>
            <div className="text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
              {t('auth.login')}
            </div>
          </div>
        </div>

        <Card className="overflow-hidden border-border/50 shadow-xl">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {resetSuccess && (
                <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2.5 text-xs text-green-700 dark:text-green-400">
                  Heslo bylo úspěšně změněno. Přihlaste se novým heslem.
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">{t('auth.email')}</Label>
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

              <div className="space-y-1.5">
                <Label htmlFor="password">{t('auth.password')}</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="min. 8 znaků"
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
                disabled={busy || !!busyDemo}
              >
                {busy ? t('auth.loggingIn') : t('auth.login')}
              </Button>

              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              <div className="text-center text-xs text-muted-foreground">
                {t('auth.noAccount')}{' '}
                <Link href="/signup" className="text-primary hover:underline font-medium">
                  {t('auth.signUp')}
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo accounts — click = instant login */}
        <div className="mt-6 rounded-xl border border-border/30 bg-card/50 backdrop-blur-sm p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t('auth.demoAccounts')}
            </div>
            <div className="text-[10px] text-muted-foreground/70">
              {t('auth.demoClickHint')}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {DEMO_ACCOUNTS.map((acc) => {
              const isBusy = busyDemo === acc.email;
              const anyBusy = !!busyDemo || busy;
              return (
                <button
                  key={acc.email}
                  type="button"
                  disabled={anyBusy}
                  onClick={() => handleDemoClick(acc.email)}
                  className="group flex w-full items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-left transition-all hover:border-border hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span
                    className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${accentClasses[acc.accent]}`}
                  >
                    {acc.role}
                  </span>
                  <span className="flex-1 truncate text-[11px] text-muted-foreground group-hover:text-foreground">
                    {acc.hint}
                  </span>
                  {isBusy ? (
                    <span className="text-[10px] text-primary animate-pulse">Přihlašuji...</span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/50 group-hover:text-primary">→</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-[10px] text-muted-foreground/70 text-center">
            {t('auth.demoPassword')}: <code className="font-mono">{DEMO_PASSWORD}</code>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background" />}>
      <LoginForm />
    </Suspense>
  );
}
