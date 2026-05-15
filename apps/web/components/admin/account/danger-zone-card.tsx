'use client';

import { ChevronRight, Copy, Check, Gift, LogOut, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-store';
import { useTranslation } from '@/lib/i18n';
import { useMemberContext, getPrimaryRoleLabel } from '@/lib/member-context';
import { apiFetch } from '@/lib/api';

// ─── Referral card ───

type ReferralResponse = {
  code: string;
  link: string;
  referredCount: number;
};

export function ReferralCard() {
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
      // ignore
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
                  Celkem {data.referredCount} klub{data.referredCount === 1 ? '' : 'ů'} se
                  registrovalo přes váš odkaz.
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

// ─── Sign out + roles card ───

export function DangerZoneCard() {
  const auth = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: memberCtx } = useMemberContext();

  const roleLabel = memberCtx ? getPrimaryRoleLabel(memberCtx) : null;

  return (
    <>
      {/* Roles & permissions */}
      <Card className="overflow-hidden">
        <CardContent className="divide-y divide-border/30 p-0">
          <button
            className="flex w-full items-center gap-3 px-4 py-4 text-left cursor-default opacity-50"
            disabled
          >
            <Shield className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">{t('account.rolesAndPermissions')}</div>
              <div className="text-xs text-muted-foreground">
                {roleLabel
                  ? `${t('account.currentRole')}: ${roleLabel}`
                  : t('account.viewAccessLevel')}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
          </button>
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
    </>
  );
}
