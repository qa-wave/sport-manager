'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { LogOut, RefreshCw, Settings, User } from 'lucide-react';
import { ApiStatus } from './api-status';
import { NotificationBell } from './notification-bell';
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

export function Topbar() {
  const auth = useAuth();
  const router = useRouter();

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
    <header className="relative flex h-14 items-center justify-between border-b border-border/60 bg-card px-5">
      {/* Subtle bottom gradient line */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="flex items-center gap-2.5 text-sm">
        <Badge variant="success" className="font-mono text-[11px] uppercase tracking-wider shadow-sm">
          {clubName ?? 'No club'}
        </Badge>
        <span className="text-muted-foreground/40">/</span>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{roleLabel ?? 'Admin'}</span>
      </div>

      <div className="flex items-center gap-3">
        {process.env.NODE_ENV === 'development' && <DevRoleSwitcher />}
        <ApiStatus />
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
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  auth.signOut();
                  router.push('/login');
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild size="sm" className="shadow-sm">
            <Link href="/login">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}

/* ── Dev-only role switcher ──────────────────────── */

const DEV_ACCOUNTS = [
  { email: 'admin@example.com', label: 'Admin', short: 'ADM' },
  { email: 'coach@example.com', label: 'Coach', short: 'COA' },
  { email: 'mom@example.com', label: 'Parent', short: 'PAR' },
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
        body: JSON.stringify({ email, password: 'password' }),
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
