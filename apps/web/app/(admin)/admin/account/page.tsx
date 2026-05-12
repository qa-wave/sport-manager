'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import {
  Bell,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  CreditCard,
  Gift,
  Globe,
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
  Calendar,
  AlertTriangle,
  ClipboardSignature,
} from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, type MeResponse, type MeClubTheme, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useTranslation } from '@/lib/i18n';
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
import { LanguageSwitcher } from '@/components/language-switcher';

export default function AccountPage() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const { data: memberCtx } = useMemberContext();

  const me = useQuery<MeResponse, ApiError>({
    queryKey: ['me', auth.accessToken],
    queryFn: () => apiFetch<MeResponse>('/me'),
    retry: false,
    enabled: auth.isAuthenticated,
  });

  const roleLabel = memberCtx ? getPrimaryRoleLabel(memberCtx) : null;
  const currentClubMember = me.data?.members.find((m) => m.clubId === auth.clubId);
  const clubName = currentClubMember?.club.name;
  const stripeConnected = !!(currentClubMember?.club.config as Record<string, unknown> | undefined)?.stripeAccountId;
  const stripeJustConnected = searchParams.get('stripe') === 'connected';
  const initials = me.data
    ? (me.data.firstName[0] ?? '') + (me.data.lastName[0] ?? '')
    : '';

  const themes = [
    { value: 'light', label: t('account.light'), icon: Sun },
    { value: 'dark', label: t('account.dark'), icon: Moon },
    { value: 'system', label: t('account.system'), icon: Monitor },
  ] as const;

  return (
    <>
      <PageHeader title={t('account.title')} subtitle={t('account.profileAndSettings')} />

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
                    Týmy
                  </div>
                </div>
                <div className="px-5 py-2 text-center">
                  <div className="text-lg font-bold">
                    {memberCtx.clubRoles.length}
                  </div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Role
                  </div>
                </div>
                {memberCtx.guardianOf.length > 0 && (
                  <div className="px-5 py-2 text-center">
                    <div className="text-lg font-bold text-emerald-500">
                      {memberCtx.guardianOf.length}
                    </div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Děti
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
        {/* ── Váš profil ── */}
        <h2 className="text-lg font-semibold mt-8 mb-4">Váš profil</h2>

        {/* Edit profile */}
        {me.data && <EditProfileCard user={me.data} />}

        {/* Theme */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
              <Palette className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{t('account.appearance')}</span>
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

        {/* Language card */}
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
              <Globe className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">{t('account.language')}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-4">
              <p className="text-xs text-muted-foreground">{t('account.languageDesc')}</p>
              <LanguageSwitcher />
            </div>
          </CardContent>
        </Card>

        {/* Notification preferences */}
        <NotificationPreferencesCard />

        {/* Roles & permissions (personal view) */}
        <Card className="overflow-hidden">
          <CardContent className="divide-y divide-border/30 p-0">
            <MenuItem
              icon={Shield}
              label={t('account.rolesAndPermissions')}
              desc={roleLabel ? `${t('account.currentRole')}: ${roleLabel}` : t('account.viewAccessLevel')}
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
              {t('account.signOut')}
            </button>
          </CardContent>
        </Card>

        {/* ── Nastavení klubu (admin only) ── */}
        {memberCtx &&
          (memberCtx.clubRoles.includes('OWNER') ||
            memberCtx.clubRoles.includes('ADMIN')) && (
          <>
            <h2 className="text-lg font-semibold mt-10 mb-4">Nastavení klubu</h2>

            {/* Club settings — name + timezone */}
            {me.data && (
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

            {/* Stripe Connect — only for OWNER */}
            {memberCtx.clubRoles.includes('OWNER') && auth.clubId && (
              <StripeConnectCard
                clubId={auth.clubId}
                connected={stripeConnected}
                justConnected={stripeJustConnected}
              />
            )}

            {/* Season management — only for OWNER */}
            {memberCtx.clubRoles.includes('OWNER') && auth.clubId && me.data && (
              <SeasonCard
                currentSeason={
                  (me.data.members.find((m) => m.clubId === auth.clubId)?.club.config as Record<string, unknown>)
                    ?.currentSeason as string | undefined
                }
              />
            )}

            {/* Club theming */}
            {me.data && (
              <ThemeSettingsCard
                clubTheme={
                  me.data.members.find((m) => m.clubId === auth.clubId)?.club
                    .config.theme
                }
              />
            )}

            {/* Registration config — only for OWNER */}
            {memberCtx.clubRoles.includes('OWNER') && auth.clubId && me.data && (
              <RegistrationCard
                clubSlug={
                  me.data.members.find((m) => m.clubId === auth.clubId)?.club.slug ?? ''
                }
                currentOpen={
                  !!((me.data.members.find((m) => m.clubId === auth.clubId)?.club.config as Record<string, unknown>)
                    ?.registration as Record<string, unknown> | undefined)?.open
                }
              />
            )}

            {/* Referral */}
            <ReferralCard />

            {/* Audit log + Roles links */}
            <Card className="overflow-hidden">
              <CardContent className="divide-y divide-border/30 p-0">
                <Link href="/admin/audit-log" className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-primary/[0.03] active:bg-primary/[0.05]">
                  <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Audit log</div>
                    <div className="text-xs text-muted-foreground">Historie změn konfigurace klubu</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                </Link>
              </CardContent>
            </Card>
          </>
        )}
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
// Stripe Connect card
// ---------------------------------------------------------------------------

function StripeConnectCard({
  clubId,
  connected,
  justConnected,
}: {
  clubId: string;
  connected: boolean;
  justConnected: boolean;
}) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch<{ url: string }>('/stripe/connect', { method: 'POST' }),
    onSuccess: (data) => {
      // Redirect to Stripe onboarding
      window.location.href = data.url;
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Platby — Stripe</span>
        </div>
        <div className="px-4 py-4 space-y-3">
          {connected || justConnected ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                <Check className="h-3 w-3" />
                Stripe propojeno
              </span>
              <span className="text-xs text-muted-foreground">
                Klub může přijímat platby kartou.
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Propojte Stripe účet, aby mohli rodiče platit příspěvky kartou přímo v aplikaci.
            </p>
          )}
          <Button
            size="sm"
            variant={connected || justConnected ? 'outline' : 'default'}
            className="text-xs"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            <CreditCard className="mr-1.5 h-3 w-3" />
            {mutation.isPending
              ? 'Připojuji...'
              : connected || justConnected
                ? 'Spravovat Stripe'
                : 'Propojit Stripe'}
          </Button>
          {mutation.isError && (
            <p className="text-xs text-destructive">
              Nepodařilo se připojit Stripe. Zkus to znovu.
            </p>
          )}
        </div>
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

// ---------------------------------------------------------------------------
// Notification preferences — stored in localStorage
// ---------------------------------------------------------------------------

const NOTIF_KEY = 'sport-manager:notif-prefs';

type NotifPrefs = {
  emailEvents: boolean;
  emailRsvpReminder: boolean;
  emailMessages: boolean;
  pushEnabled: boolean;
};

const NOTIF_DEFAULTS: NotifPrefs = {
  emailEvents: true,
  emailRsvpReminder: true,
  emailMessages: true,
  pushEnabled: false,
};

function loadNotifPrefs(): NotifPrefs {
  if (typeof window === 'undefined') return NOTIF_DEFAULTS;
  try {
    const stored = localStorage.getItem(NOTIF_KEY);
    if (!stored) return NOTIF_DEFAULTS;
    return { ...NOTIF_DEFAULTS, ...(JSON.parse(stored) as Partial<NotifPrefs>) };
  } catch {
    return NOTIF_DEFAULTS;
  }
}

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          checked ? 'bg-primary' : 'bg-input'
        }`}
      >
        <span
          className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function NotificationPreferencesCard() {
  const [prefs, setPrefs] = useState<NotifPrefs>(NOTIF_DEFAULTS);

  useEffect(() => {
    setPrefs(loadNotifPrefs());
  }, []);

  const update = (key: keyof NotifPrefs, value: boolean) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem(NOTIF_KEY, JSON.stringify(next));
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Oznámení</span>
        </div>
        <div className="divide-y divide-border/20">
          <ToggleRow
            label="Nové události"
            desc="Emailem při vytvoření nové události"
            checked={prefs.emailEvents}
            onChange={(v) => update('emailEvents', v)}
          />
          <ToggleRow
            label="Připomenutí RSVP"
            desc="Připomenutí před termínem potvrzení"
            checked={prefs.emailRsvpReminder}
            onChange={(v) => update('emailRsvpReminder', v)}
          />
          <ToggleRow
            label="Nové zprávy"
            desc="Emailem při nové zprávě v konverzaci"
            checked={prefs.emailMessages}
            onChange={(v) => update('emailMessages', v)}
          />
          <ToggleRow
            label="Push notifikace"
            desc="Oznámení v prohlížeči (vyžaduje povolení)"
            checked={prefs.pushEnabled}
            onChange={(v) => update('pushEnabled', v)}
          />
        </div>
        <p className="text-[11px] text-muted-foreground/70 px-4 pb-3 mt-3">
          Nastavení platí pouze pro tento prohlížeč.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Referral card — OWNER / ADMIN only
// ---------------------------------------------------------------------------

type ReferralResponse = {
  code: string;
  link: string;
  referredCount: number;
};

function ReferralCard() {
  const auth = useAuth();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<ReferralResponse>({
    queryKey: ['referral-code', auth.clubId],
    queryFn: () => apiFetch<ReferralResponse>('/clubs/referral-code'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    retry: false,
  });

  const handleCopy = async () => {
    if (!data?.link) return;
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback — do nothing
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
          <Gift className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Doporučení</span>
          {data && data.referredCount > 0 && (
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
              {data.referredCount} doporučeno
            </span>
          )}
        </div>
        <div className="px-4 py-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Sdílejte odkaz a doporučte Sport Manager dalším klubům. Váš referral kód:
          </p>
          {isLoading ? (
            <div className="h-8 w-32 animate-pulse rounded bg-secondary/50" />
          ) : data ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex-1 rounded-md border border-border/50 bg-secondary/20 px-3 py-1.5 font-mono text-sm font-bold tracking-widest text-primary">
                  {data.code}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 text-xs h-8"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <>
                      <Check className="mr-1.5 h-3 w-3 text-emerald-500" />
                      Zkopírováno
                    </>
                  ) : (
                    <>
                      <Copy className="mr-1.5 h-3 w-3" />
                      Zkopírovat odkaz
                    </>
                  )}
                </Button>
              </div>
              {data.referredCount > 0 ? (
                <p className="text-xs text-emerald-600">
                  Celkem {data.referredCount} klub{data.referredCount === 1 ? '' : 'ů'} se registrovalo přes váš odkaz.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground/60">
                  Zatím žádné doporučení. Sdílejte odkaz s dalšími trenéry a kluby.
                </p>
              )}
            </>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Season card — OWNER only
// ---------------------------------------------------------------------------

function SeasonCard({ currentSeason }: { currentSeason?: string }) {
  const queryClient = useQueryClient();
  const auth = useAuth();
  const [open, setOpen] = useState(false);
  const [newSeason, setNewSeason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const displayed = currentSeason ?? '2025/26';

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch('/clubs/archive-season', {
        method: 'POST',
        body: JSON.stringify({ newSeason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setConfirmOpen(false);
      setOpen(false);
      setNewSeason('');
    },
  });

  if (!open) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="divide-y divide-border/30 p-0">
          <button
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-primary/[0.03]"
            onClick={() => setOpen(true)}
          >
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Správa sezony</div>
              <div className="text-xs text-muted-foreground">
                Aktuální sezona: <span className="font-semibold text-foreground">{displayed}</span>
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
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Správa sezony</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">Aktuální sezona:</span>
          <span className="text-sm font-bold">{displayed}</span>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Nová sezona po uzavření</label>
          <Input
            value={newSeason}
            onChange={(e) => setNewSeason(e.target.value)}
            placeholder="např. 2026/27"
            className="h-8 text-sm"
          />
        </div>

        {!confirmOpen ? (
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOpen(false)}>
              Zrušit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs"
              disabled={!newSeason.trim()}
              onClick={() => setConfirmOpen(true)}
            >
              Uzavřít sezonu
            </Button>
          </div>
        ) : (
          <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
              <p className="text-xs text-destructive">
                Opravdu uzavřít sezonu <strong>{displayed}</strong> a zahájit <strong>{newSeason}</strong>?
                Tato akce je nevratná.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setConfirmOpen(false)}>
                Zrušit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Ukládám...' : 'Potvrdit uzavření'}
              </Button>
            </div>
          </div>
        )}

        {mutation.isError && (
          <p className="text-xs text-destructive">Nepodařilo se uložit. Zkuste znovu.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Registration card — OWNER only
// ---------------------------------------------------------------------------

function RegistrationCard({
  clubSlug,
  currentOpen,
}: {
  clubSlug: string;
  currentOpen: boolean;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(currentOpen);
  const [copied, setCopied] = useState(false);

  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://sport-manager.qawave.ai';
  const regUrl = `${baseUrl}/k/${clubSlug}/registrace`;

  const mutation = useMutation({
    mutationFn: (newOpen: boolean) =>
      apiFetch('/clubs/registration-config', {
        method: 'PATCH',
        body: JSON.stringify({ open: newOpen }),
      }),
    onSuccess: (_data, newOpen) => {
      setOpen(newOpen);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(regUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
          <ClipboardSignature className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Registrace</span>
          <span
            className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              open
                ? 'bg-emerald-500/10 text-emerald-600'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {open ? 'Otevřena' : 'Uzavřena'}
          </span>
        </div>
        <div className="space-y-3 px-4 py-4">
          <p className="text-xs text-muted-foreground">
            Veřejný formulář pro registraci nových hráčů. Rodiče ho vyplní bez přihlášení.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 truncate rounded-md border border-border/50 bg-secondary/20 px-3 py-1.5 font-mono text-xs text-primary">
              {regUrl}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 h-8 text-xs"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="mr-1.5 h-3 w-3 text-emerald-500" />
                  Zkopírováno
                </>
              ) : (
                <>
                  <Copy className="mr-1.5 h-3 w-3" />
                  Kopírovat
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <button
              role="switch"
              aria-checked={open}
              onClick={() => mutation.mutate(!open)}
              disabled={mutation.isPending}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                open ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  open ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground">
              {open ? 'Registrace je otevřena' : 'Registrace je uzavřena'}
            </span>
          </div>
          {mutation.isError && (
            <p className="text-xs text-destructive">Nepodařilo se uložit.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
