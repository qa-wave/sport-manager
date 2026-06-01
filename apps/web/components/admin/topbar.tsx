'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, LogOut, Menu, RefreshCw, Search, Settings, User } from 'lucide-react';
import { toast } from 'sonner';
import { ApiStatus } from './api-status';
import { NotificationBell } from './notification-bell';
import { LanguageSwitcher } from '@/components/language-switcher';
import { API_URL, apiFetch, type MeResponse, ApiError } from '@/lib/api';
import { authStore, useAuth } from '@/lib/auth-store';
import { useMemberContext, getPrimaryRoleLabel } from '@/lib/member-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Topbar({ onMobileOpen }: { onMobileOpen?: () => void }) {
  const auth = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const me = useQuery<MeResponse, ApiError>({
    queryKey: ['me', auth.accessToken],
    queryFn: () => apiFetch<MeResponse>('/me'),
    retry: false,
    enabled: auth.isAuthenticated,
  });

  const { data: memberCtx } = useMemberContext();
  const roleLabel = memberCtx ? getPrimaryRoleLabel(memberCtx) : null;

  const clubName = me.data?.members.find((m) => m.clubId === auth.clubId)?.club
    .name;
  const initials = me.data
    ? (me.data.firstName[0] ?? '') + (me.data.lastName[0] ?? '')
    : '';

  return (
    <header className="relative flex h-14 items-center justify-between border-b border-chrome-border bg-chrome text-chrome-foreground px-5 pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-2.5 text-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-chrome-muted hover:text-chrome-foreground md:hidden"
          onClick={onMobileOpen}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {me.data && me.data.members.length > 1 ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center gap-1.5 rounded-md bg-gradient-brand px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm transition-all hover:shadow-md hover:opacity-90">
                <span className="max-w-[120px] truncate">{clubName ?? 'Bez klubu'}</span>
                <ChevronDown className="h-3 w-3 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-[11px] uppercase tracking-widest text-muted-foreground font-semibold">
                Přepnout klub
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {me.data.members.map((m) => (
                <DropdownMenuItem
                  key={m.clubId}
                  onClick={() => {
                    authStore.setSession(auth.accessToken!, m.clubId);
                    queryClient.clear();
                    window.location.reload();
                  }}
                  className="flex items-center justify-between"
                >
                  <span className={m.clubId === auth.clubId ? 'font-semibold' : ''}>{m.club.name}</span>
                  {m.clubId === auth.clubId && <Check className="h-3.5 w-3.5 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className="rounded-md bg-gradient-brand px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
            {clubName ?? 'Bez klubu'}
          </span>
        )}
        <span className="hidden sm:inline text-chrome-border">/</span>
        <span className="hidden sm:inline text-xs font-medium text-chrome-muted">{roleLabel ?? 'Člen'}</span>
      </div>

      <div className="flex items-center gap-3">
        <DevRoleSwitcher currentEmail={me.data?.email} />
        <button
          data-tour="search"
          onClick={() => {
            // Dispatch a synthetic Cmd+K to open the command palette
            document.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
            );
          }}
          className="hidden sm:flex items-center gap-2 rounded border border-chrome-border bg-white/[0.06] px-3 py-1.5 text-xs text-chrome-muted transition-colors hover:border-primary/50 hover:text-chrome-foreground"
          aria-label="Otevřít vyhledávání"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Hledat</span>
          <kbd className="ml-1 rounded border border-chrome-border bg-white/10 px-1 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>
        {process.env.NODE_ENV === 'development' && <ApiStatus />}
        {auth.isAuthenticated && roleLabel && (
          <Badge className="hidden sm:inline-flex border border-chrome-border bg-white/[0.06] text-chrome-foreground font-semibold tracking-wide hover:bg-white/[0.1]">
            {roleLabel}
          </Badge>
        )}
        <NotificationBell />
        {auth.isAuthenticated && me.data ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-chrome-border transition-all hover:ring-primary/60">
                <Avatar className="h-9 w-9">
                  {me.data?.avatarUrl && <AvatarImage src={me.data.avatarUrl} alt="" />}
                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1.5">
                  <p className="text-sm font-semibold">{me.data.firstName} {me.data.lastName}</p>
                  <p className="text-xs text-muted-foreground">{me.data.email}</p>
                  {roleLabel && (
                    <Badge variant="outline" className="mt-0.5 w-fit text-[10px] font-semibold uppercase tracking-wide">
                      {roleLabel}
                    </Badge>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <User className="mr-2 h-4 w-4" />
                <span>Profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                <span>Nastavení</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <LanguageSwitcher compact />
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  auth.signOut();
                  router.push('/login');
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Odhlásit se</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild size="sm" className="shadow-sm">
            <Link href="/login">Přihlásit se</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

/* ── Dev-only role switcher ──────────────────────── */

const DEV_ACCOUNTS = [
  { email: 'admin@hvezda.cz', label: 'Admin' },
  { email: 'spravce@hvezda.cz', label: 'Správce' },
  { email: 'coach@hvezda.cz', label: 'Trenér' },
  { email: 'pr@hvezda.cz', label: 'Novinář' },
  { email: 'parent@hvezda.cz', label: 'Rodič' },
  { email: 'hrac@hvezda.cz', label: 'Hráč' },
] as const;

function DevRoleSwitcher({ currentEmail }: { currentEmail?: string }) {
  const [switching, setSwitching] = useState<string | null>(null);

  // Visible in local dev, and on any deployment for demo-account users — so the
  // public demo lets visitors hop between roles. Real tenants never see it.
  const isDemoUser = !!currentEmail && DEV_ACCOUNTS.some((a) => a.email === currentEmail);
  if (process.env.NODE_ENV !== 'development' && !isDemoUser) return null;

  async function switchTo(email: string) {
    if (switching) return;
    setSwitching(email);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: 'heslo123' }),
      });
      if (!res.ok) {
        toast.error(`Přihlášení jako ${email} se nezdařilo (${res.status}).`);
        setSwitching(null);
        return;
      }
      const { accessToken } = (await res.json()) as { accessToken: string };
      authStore.setSession(accessToken, null);
      const me = await apiFetch<MeResponse>('/me');
      authStore.setSession(accessToken, me.members[0]?.clubId ?? null);
      // Full navigation + reload so the whole app (sidebar, dashboard, role
      // badge) re-renders under the freshly authenticated role.
      window.location.assign('/admin');
    } catch {
      toast.error('Přepnutí role se nezdařilo.');
      setSwitching(null);
    }
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 px-1.5 py-0.5">
      <span className="mr-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-500/70">
        {switching ? <RefreshCw className="inline h-3 w-3 animate-spin" /> : 'DEMO'}
      </span>
      {DEV_ACCOUNTS.map((acc) => {
        const active = acc.email === currentEmail;
        return (
          <button
            key={acc.email}
            onClick={() => switchTo(acc.email)}
            disabled={!!switching}
            aria-pressed={active}
            className={`rounded px-1.5 py-0.5 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
              active
                ? 'bg-amber-500/20 text-amber-300'
                : 'text-amber-500/80 hover:bg-amber-500/15 hover:text-amber-400'
            }`}
            title={`Přihlásit jako ${acc.email}`}
          >
            {acc.label}
          </button>
        );
      })}
    </div>
  );
}
