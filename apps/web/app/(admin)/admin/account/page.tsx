'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, type MeResponse, ApiError } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useTranslation } from '@/lib/i18n';
import { useMemberContext } from '@/lib/member-context';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileCard } from '@/components/admin/account/profile-card';
import { AppearanceCard } from '@/components/admin/account/appearance-card';
import { NotificationPrefsCard } from '@/components/admin/account/notification-prefs-card';
import {
  ClubSettingsCard,
  SeasonCard,
  RegistrationCard,
} from '@/components/admin/account/club-settings-card';
import { ClubThemeCard } from '@/components/admin/account/club-theme-card';
import { StripeConnectCard } from '@/components/admin/account/stripe-connect-card';
import { SubscriptionCard } from '@/components/admin/account/subscription-card';
import { ReferralCard, DangerZoneCard } from '@/components/admin/account/danger-zone-card';

export default function AccountPage() {
  const auth = useAuth();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const { data: memberCtx } = useMemberContext();

  const me = useQuery<MeResponse, ApiError>({
    queryKey: ['me', auth.accessToken],
    queryFn: () => apiFetch<MeResponse>('/me'),
    retry: false,
    enabled: auth.isAuthenticated,
  });

  const currentClubMember = me.data?.members.find((m) => m.clubId === auth.clubId);
  const clubName = currentClubMember?.club.name;
  const clubConfig = currentClubMember?.club.config as Record<string, unknown> | undefined;
  const stripeConnected = !!clubConfig?.stripeAccountId;
  const hasSubscription = !!clubConfig?.stripeCustomerId;
  const stripeJustConnected = searchParams.get('stripe') === 'connected';
  const stripeJustSubscribed = searchParams.get('stripe') === 'subscribed';

  const isClubAdmin = !!(
    memberCtx &&
    (memberCtx.clubRoles.includes('OWNER') || memberCtx.clubRoles.includes('ADMIN'))
  );

  const defaultTab = (stripeJustConnected || stripeJustSubscribed) ? 'klub' : 'profil';

  return (
    <>
      <PageHeader title={t('account.title')} subtitle={t('account.profileAndSettings')} />

      {/* Profile hero card */}
      {me.isLoading ? (
        <Card className="overflow-hidden">
          <CardContent className="flex flex-col items-center gap-3 py-8">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </CardContent>
        </Card>
      ) : me.data ? (
        <ProfileCard me={me.data} clubName={clubName} />
      ) : null}

      {/* Settings tabs */}
      <Tabs defaultValue={defaultTab} className="mt-6">
        <TabsList className="w-full">
          <TabsTrigger value="profil" className="flex-1">
            Profil
          </TabsTrigger>
          {isClubAdmin && (
            <TabsTrigger value="klub" className="flex-1">
              Klub
            </TabsTrigger>
          )}
          {isClubAdmin && (
            <TabsTrigger value="pokrocile" className="flex-1">
              Pokrocile
            </TabsTrigger>
          )}
        </TabsList>

        {/* ── Tab: Profil ── */}
        <TabsContent value="profil" className="space-y-3 mt-4">
          <AppearanceCard />
          <NotificationPrefsCard />
          <DangerZoneCard />
        </TabsContent>

        {/* ── Tab: Klub (admin only) ── */}
        {isClubAdmin && (
          <TabsContent value="klub" className="space-y-3 mt-4">
            {me.data && (
              <ClubSettingsCard
                clubId={auth.clubId!}
                currentName={
                  me.data.members.find((m) => m.clubId === auth.clubId)?.club.name ?? ''
                }
                currentTimezone={
                  me.data.members.find((m) => m.clubId === auth.clubId)?.club.timezone ??
                  'Europe/Prague'
                }
              />
            )}

            {me.data && (
              <ClubThemeCard
                clubTheme={
                  me.data.members.find((m) => m.clubId === auth.clubId)?.club.config.theme
                }
              />
            )}

            {memberCtx?.clubRoles.includes('OWNER') && auth.clubId && me.data && (
              <SeasonCard
                currentSeason={
                  (
                    me.data.members.find((m) => m.clubId === auth.clubId)?.club
                      .config as Record<string, unknown>
                  )?.currentSeason as string | undefined
                }
              />
            )}

            {memberCtx?.clubRoles.includes('OWNER') && auth.clubId && me.data && (
              <RegistrationCard
                clubSlug={
                  me.data.members.find((m) => m.clubId === auth.clubId)?.club.slug ?? ''
                }
                currentOpen={
                  !!(
                    (
                      me.data.members.find((m) => m.clubId === auth.clubId)?.club
                        .config as Record<string, unknown>
                    )?.registration as Record<string, unknown> | undefined
                  )?.open
                }
              />
            )}

            {memberCtx?.clubRoles.includes('OWNER') && auth.clubId && (
              <StripeConnectCard
                clubId={auth.clubId}
                connected={stripeConnected}
                justConnected={stripeJustConnected}
              />
            )}

            {memberCtx?.clubRoles.includes('OWNER') && (
              <SubscriptionCard
                hasSubscription={hasSubscription}
                justSubscribed={stripeJustSubscribed}
                clubConfig={clubConfig}
              />
            )}
          </TabsContent>
        )}

        {/* ── Tab: Pokrocile (admin only) ── */}
        {isClubAdmin && (
          <TabsContent value="pokrocile" className="space-y-3 mt-4">
            <ReferralCard />

            <Card className="overflow-hidden">
              <CardContent className="divide-y divide-border/30 p-0">
                <Link
                  href="/admin/audit-log"
                  className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-primary/[0.03] active:bg-primary/[0.05]"
                >
                  <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">Audit log</div>
                    <div className="text-xs text-muted-foreground">
                      Historie změn konfigurace klubu
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                </Link>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </>
  );
}
