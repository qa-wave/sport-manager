'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import {
  Check,
  ChevronRight,
  LogOut,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Settings,
  Shield,
  Sun,
  Monitor,
  User,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, type MeResponse, type MeClubTheme, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext, getPrimaryRoleLabel } from '@/lib/member-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ROLE_VARIANT } from '@/lib/role-colors';
import {
  STYLE_CATALOG,
  hexToHsl,
  generateThemeVars,
  generateDarkThemeVars,
  type ClubThemeInput,
} from '@/lib/club-theme';

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
                  className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px]"
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
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Teams
                  </div>
                </div>
                <div className="px-5 py-2 text-center">
                  <div className="text-lg font-bold">
                    {memberCtx.clubRoles.length}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Roles
                  </div>
                </div>
                {memberCtx.guardianOf.length > 0 && (
                  <div className="px-5 py-2 text-center">
                    <div className="text-lg font-bold text-emerald-500">
                      {memberCtx.guardianOf.length}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
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
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
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

        {/* Club settings — only for OWNER / ADMIN */}
        {memberCtx &&
          (memberCtx.clubRoles.includes('OWNER') ||
            memberCtx.clubRoles.includes('ADMIN')) &&
          me.data && (
            <ClubSettingsCard
              clubId={auth.clubId!}
              currentName={
                me.data.members.find((m) => m.clubId === auth.clubId)?.club.name ?? ''
              }
              currentTimezone={
                me.data.members.find((m) => m.clubId === auth.clubId)?.club.timezone ?? 'Europe/Prague'
              }
            />
          )}

        {/* Club theming — only for OWNER / ADMIN */}
        {memberCtx &&
          (memberCtx.clubRoles.includes('OWNER') ||
            memberCtx.clubRoles.includes('ADMIN')) &&
          me.data && (
            <ThemeSettingsCard
              clubTheme={
                me.data.members.find((m) => m.clubId === auth.clubId)?.club
                  .config.theme
              }
            />
          )}

        {/* Edit profile */}
        {me.data && <EditProfileCard user={me.data} />}

        {/* Menu items */}
        <Card className="overflow-hidden">
          <CardContent className="divide-y divide-border/30 p-0">
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

// ---------------------------------------------------------------------------
// Edit profile
// ---------------------------------------------------------------------------

function EditProfileCard({ user }: { user: MeResponse }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch('/me', {
        method: 'PATCH',
        body: JSON.stringify({ firstName, lastName }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
    },
  });

  if (!editing) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="divide-y divide-border/30 p-0">
          <button
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-primary/[0.03]"
            onClick={() => setEditing(true)}
          >
            <User className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Upravit profil</div>
              <div className="text-xs text-muted-foreground">
                {user.firstName} {user.lastName} · {user.email}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3 pb-1">
          <User className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Upravit profil</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Jméno</label>
            <Input value={firstName} onChange={e => setFirstName(e.target.value)} className="h-8 text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Příjmení</label>
            <Input value={lastName} onChange={e => setLastName(e.target.value)} className="h-8 text-sm" />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Email</label>
          <Input value={user.email} disabled className="h-8 text-sm opacity-50" />
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setEditing(false)}>
            Zrušit
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? 'Ukládám...' : 'Uložit'}
          </Button>
        </div>
        {mutation.isError && (
          <div className="text-xs text-destructive">Nepodařilo se uložit.</div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Club settings — name + timezone
// ---------------------------------------------------------------------------

const COMMON_TIMEZONES = [
  'Europe/Prague',
  'Europe/Bratislava',
  'Europe/Vienna',
  'Europe/Berlin',
  'Europe/Warsaw',
  'Europe/Budapest',
  'Europe/London',
  'Europe/Paris',
  'Europe/Rome',
  'Europe/Madrid',
  'UTC',
];

function ClubSettingsCard({
  clubId,
  currentName,
  currentTimezone,
}: {
  clubId: string;
  currentName: string;
  currentTimezone: string;
}) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [timezone, setTimezone] = useState(currentTimezone);

  const isDirty = name !== currentName || timezone !== currentTimezone;

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch('/clubs/settings', {
        method: 'PATCH',
        body: JSON.stringify({ name, timezone }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
    },
  });

  if (!editing) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="divide-y divide-border/30 p-0">
          <button
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-primary/[0.03]"
            onClick={() => setEditing(true)}
          >
            <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Nastavení klubu</div>
              <div className="text-xs text-muted-foreground">
                {currentName} · {currentTimezone}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3 pb-1">
          <Settings className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Nastavení klubu</span>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Název klubu</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Časové pásmo</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setName(currentName);
              setTimezone(currentTimezone);
              setEditing(false);
            }}
          >
            Zrušit
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => mutation.mutate()}
            disabled={!isDirty || mutation.isPending}
          >
            {mutation.isPending ? 'Ukládám...' : 'Uložit'}
          </Button>
        </div>
        {mutation.isError && (
          <div className="text-xs text-destructive">Nepodařilo se uložit.</div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Club theme settings — color pickers + style catalog
// ---------------------------------------------------------------------------

const THEME_DEFAULTS: MeClubTheme = {
  primary: '#609bc6',
  secondary: '#f59e0b',
  tertiary: '#0f172a',
  styleId: 1,
};

function ThemeSettingsCard({ clubTheme }: { clubTheme?: MeClubTheme }) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const { resolvedTheme } = useTheme();

  const saved = clubTheme ?? THEME_DEFAULTS;
  const savedRef = useRef(saved);
  savedRef.current = saved;

  const [draft, setDraft] = useState<MeClubTheme>(saved);
  const isDirty =
    draft.primary !== saved.primary ||
    draft.secondary !== saved.secondary ||
    draft.tertiary !== saved.tertiary ||
    draft.styleId !== saved.styleId;

  // Live preview — inject CSS vars as draft changes
  const applyPreview = useCallback(
    (theme: ClubThemeInput) => {
      const vars =
        resolvedTheme === 'dark'
          ? generateDarkThemeVars(theme)
          : generateThemeVars(theme);
      const el = document.documentElement;
      Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    },
    [resolvedTheme],
  );

  // Apply preview whenever draft changes
  useEffect(() => {
    applyPreview(draft);
  }, [draft, applyPreview]);

  // Revert on unmount if unsaved
  useEffect(() => {
    return () => {
      const s = savedRef.current;
      const vars =
        resolvedTheme === 'dark'
          ? generateDarkThemeVars(s)
          : generateThemeVars(s);
      const el = document.documentElement;
      Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    };
  }, [resolvedTheme]);

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{ config: unknown }>('/clubs/theme', {
        method: 'PATCH',
        body: JSON.stringify({ theme: draft }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const handleReset = () => {
    setDraft(THEME_DEFAULTS);
  };

  const colors = [
    { key: 'primary' as const, label: 'Primární' },
    { key: 'secondary' as const, label: 'Sekundární' },
    { key: 'tertiary' as const, label: 'Terciární' },
  ];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
          <Palette className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Vzhled klubu</span>
        </div>

        {/* Color pickers */}
        <div className="grid grid-cols-3 gap-4 p-4">
          {colors.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                {label}
              </label>
              <div className="flex items-center gap-2">
                <label
                  className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border"
                  style={{ backgroundColor: draft[key] }}
                >
                  <input
                    type="color"
                    value={draft[key]}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className="absolute inset-0 cursor-pointer opacity-0"
                  />
                </label>
                <Input
                  value={draft[key]}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^#[0-9a-f]{0,6}$/i.test(v)) {
                      setDraft((prev) => ({ ...prev, [key]: v }));
                    }
                  }}
                  className="h-8 font-mono text-xs"
                  maxLength={7}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Style catalog */}
        <div className="border-t border-border/30 px-4 py-3">
          <span className="text-xs font-medium text-muted-foreground">
            Styl
          </span>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {STYLE_CATALOG.map((style) => (
              <button
                key={style.id}
                onClick={() =>
                  setDraft((prev) => ({ ...prev, styleId: style.id }))
                }
                className={`relative flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 text-xs transition-all ${
                  draft.styleId === style.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
                {/* Mini preview swatch */}
                <div
                  className="h-6 w-full"
                  style={{
                    backgroundColor: draft.primary,
                    borderRadius: style.radius,
                    border: `${style.borderWidth} solid ${draft.tertiary}`,
                    boxShadow:
                      style.shadow === 'md'
                        ? '0 4px 12px rgba(0,0,0,0.15)'
                        : style.shadow === 'sm'
                          ? '0 1px 4px rgba(0,0,0,0.1)'
                          : style.shadow === 'xs'
                            ? '0 1px 2px rgba(0,0,0,0.06)'
                            : 'none',
                  }}
                />
                <span className="font-medium">{style.name}</span>
                {draft.styleId === style.id && (
                  <Check className="absolute right-1 top-1 h-3 w-3" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-border/30 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-xs"
          >
            <RotateCcw className="mr-1.5 h-3 w-3" />
            Obnovit výchozí
          </Button>
          <Button
            size="sm"
            onClick={() => mutation.mutate()}
            disabled={!isDirty || mutation.isPending}
            className="text-xs"
          >
            <Save className="mr-1.5 h-3 w-3" />
            {mutation.isPending ? 'Ukládám...' : 'Uložit'}
          </Button>
        </div>

        {mutation.isError && (
          <div className="px-4 pb-3 text-xs text-destructive">
            Nepodařilo se uložit. Zkus to znovu.
          </div>
        )}
        {mutation.isSuccess && !isDirty && (
          <div className="px-4 pb-3 text-xs text-emerald-500">
            Uloženo.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
