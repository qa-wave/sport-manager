'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import {
  ChevronRight,
  LogOut,
  Moon,
  Palette,
  Shield,
  Sun,
  Monitor,
  User,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, type MeResponse, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext, getPrimaryRoleLabel } from '@/lib/member-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROLE_VARIANT } from '@/lib/role-colors';

export default function AccountPage() {
  const auth = useAuth();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { data: memberCtx } = useMemberContext();

  const me = useQuery<MeResponse, ApiError>({
    queryKey: ['me', auth.accessToken],
    queryFn: () => apiFetch<MeResponse>('/me'),
    retry: false,
    enabled: auth.isAuthenticated,
  });

  const roleLabel = memberCtx ? getPrimaryRoleLabel(memberCtx) : null;
  const clubName = me.data?.members.find((m) => m.clubId === auth.clubId)?.club.name;
  const initials = me.data
    ? (me.data.firstName[0] ?? '') + (me.data.lastName[0] ?? '')
    : '';

  const themes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ] as const;

  return (
    <>
      <PageHeader title="Account" subtitle="Profile & preferences" />

      {/* Profile card */}
      {me.isLoading ? (
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      ) : me.data ? (
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.06] via-transparent to-transparent" />
          <CardContent className="relative flex flex-col items-center gap-4 py-8">
            <div className="relative">
              <Avatar className="h-20 w-20 ring-2 ring-primary/30 ring-offset-2 ring-offset-background">
                <AvatarFallback className="bg-primary/15 text-xl font-bold text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {roleLabel && (
                <Badge
                  variant={ROLE_VARIANT[memberCtx?.clubRoles[0] ?? ''] ?? 'default'}
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px]"
                >
                  {roleLabel}
                </Badge>
              )}
            </div>

            <div className="text-center">
              <h2 className="text-lg font-bold">
                {me.data.firstName} {me.data.lastName}
              </h2>
              <p className="text-sm text-muted-foreground">{me.data.email}</p>
              {clubName && (
                <p className="mt-1 text-xs text-primary/70">{clubName}</p>
              )}
            </div>

            {/* Stats row */}
            {memberCtx && (
              <div className="mt-2 flex divide-x divide-border rounded-lg border border-border/50 bg-secondary/30">
                <div className="px-5 py-2 text-center">
                  <div className="text-lg font-bold text-primary">
                    {memberCtx.teamRoles.length}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Teams
                  </div>
                </div>
                <div className="px-5 py-2 text-center">
                  <div className="text-lg font-bold">
                    {memberCtx.clubRoles.length}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    Roles
                  </div>
                </div>
                {memberCtx.guardianOf.length > 0 && (
                  <div className="px-5 py-2 text-center">
                    <div className="text-lg font-bold text-emerald-500">
                      {memberCtx.guardianOf.length}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      Children
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Settings sections */}
      <div className="space-y-3">
        {/* Theme */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
              <Palette className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Appearance</span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 text-xs font-medium transition-all ${
                    theme === value
                      ? 'border-primary bg-primary/10 text-primary shadow-[0_0_12px_-4px_hsl(var(--primary)/0.3)]'
                      : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Menu items */}
        <Card className="overflow-hidden">
          <CardContent className="divide-y divide-border/30 p-0">
            <MenuItem
              icon={User}
              label="Edit Profile"
              desc="Name, email, avatar"
              disabled
            />
            <MenuItem
              icon={Shield}
              label="Roles & Permissions"
              desc={roleLabel ? `Current role: ${roleLabel}` : 'View your access level'}
              disabled
            />
          </CardContent>
        </Card>

        {/* Sign out */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <button
              className="flex w-full items-center gap-3 px-4 py-4 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5"
              onClick={() => {
                auth.signOut();
                router.push('/login');
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  desc,
  disabled,
  onClick,
}: {
  icon: typeof User;
  label: string;
  desc: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors ${
        disabled
          ? 'cursor-default opacity-50'
          : 'hover:bg-primary/[0.03] active:bg-primary/[0.05]'
      }`}
      disabled={disabled}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
    </button>
  );
}
