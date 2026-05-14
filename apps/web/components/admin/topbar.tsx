'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Check, ChevronDown, LogOut, Menu, RefreshCw, Search, Settings, User } from 'lucide-react';
import { ApiStatus } from './api-status';
import { NotificationBell } from './notification-bell';
import { LanguageSwitcher } from '@/components/language-switcher';
import { API_URL, apiFetch, type MeResponse, ApiError } from '@/lib/api';
import { authStore, useAuth } from '@/lib/auth-store';
import { useMemberContext, getPrimaryRoleLabel } from '@/lib/member-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    <header className="relative flex h-14 items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-sm px-5">
      <div className="flex items-center gap-2.5 text-sm">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground md:hidden"
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
        <span className="hidden sm:inline text-border">/</span>
        <span className="hidden sm:inline text-xs font-medium text-muted-foreground">{roleLabel ?? 'Admin'}</span>
      </div>

      <div className="flex items-center gap-3">
        {process.env.NODE_ENV === 'development' && <DevRoleSwitcher />}
        <button
          onClick={() => {
            // Dispatch a synthetic Cmd+K to open the command palette
            document.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
            );
          }}
          className="hidden sm:flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          aria-label="Otevřít vyhledávání"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Hledat</span>
          <kbd className="ml-1 rounded border border-border bg-background px-1 py-0.5 text-[10px]">
            ⌘K
          </kbd>
        </button>
        {process.env.NODE_ENV === 'development' && <ApiStatus />}
        <NotificationBell />
        {auth.isAuthenticated && me.data ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-1 ring-border/50 transition-all hover:ring-primary/30">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold">{me.data.firstName} {me.data.lastName}</p>
                  <p className="text-xs text-muted-foreground">{me.data.email}</p>
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
  { email: 'admin@hvezda.cz', label: 'Admin', short: 'ADM' },
  { email: 'coach@hvezda.cz', label: 'Coach', short: 'COA' },
  { email: 'parent@hvezda.cz', label: 'Parent', short: 'PAR' },
] as const;

function DevRoleSwitcher() {
  const queryClient = useQueryClient();
  const [switching, setSwitching] = useState(false);

  async function switchTo(email: string) {
    setSwitching(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password: 'heslo123' }),
      });
      if (!res.ok) return;
      const { accessToken } = (await res.json()) as { accessToken: string };
      authStore.setSession(accessToken, null);
      const me = await apiFetch<MeResponse>('/me');
      authStore.setSession(accessToken, me.members[0]?.clubId ?? null);
      queryClient.clear();
    } finally {
      setSwitching(false);
    }
  }

  return (
    <div className="flex items-center gap-1 rounded-lg border border-dashed border-amber-500/30 bg-amber-500/5 px-1.5 py-0.5">
      <span className="mr-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-500/70">
        {switching ? <RefreshCw className="inline h-3 w-3 animate-spin" /> : 'DEV'}
      </span>
      {DEV_ACCOUNTS.map((acc) => (
        <button
          key={acc.email}
          onClick={() => switchTo(acc.email)}
          disabled={switching}
          className="rounded px-1.5 py-0.5 text-[11px] font-semibold text-amber-500/80 transition-colors hover:bg-amber-500/15 hover:text-amber-400 disabled:opacity-50"
          title={acc.email}
        >
          {acc.label}
        </button>
      ))}
    </div>
  );
}
