'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, CreditCard, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

interface SubscriptionCardProps {
  hasSubscription: boolean;
  justSubscribed: boolean;
  clubConfig: Record<string, unknown> | undefined;
}

const TIER_LABELS: Record<string, string> = {
  free: 'FREE',
  pro: 'PRO',
  club: 'CLUB',
  basic: 'PRO',
  enterprise: 'CLUB',
};

export function SubscriptionCard({
  hasSubscription,
  justSubscribed,
  clubConfig,
}: SubscriptionCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tier = (clubConfig?.tier as string | undefined) ?? 'free';
  const tierLabel = TIER_LABELS[tier] ?? tier.toUpperCase();
  const isActive = hasSubscription || justSubscribed;

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const { url } = await apiFetch<{ url: string }>('/stripe/customer-portal', {
        method: 'POST',
      });
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Nepodařilo se otevřít portál. Zkus to znovu.',
      );
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Předplatné</span>
        </div>
        <div className="space-y-3 px-4 py-4">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                tier === 'free'
                  ? 'bg-muted text-muted-foreground'
                  : 'bg-primary/10 text-primary'
              }`}
            >
              {tierLabel}
            </span>
            {isActive && tier !== 'free' ? (
              <span className="text-xs text-emerald-600">Aktivní předplatné</span>
            ) : (
              <span className="text-xs text-muted-foreground">
                {tier === 'free' ? 'Bezplatný plán' : 'Zkontrolujte stav předplatného'}
              </span>
            )}
          </div>

          {justSubscribed && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span className="text-xs text-emerald-700">Předplatné bylo aktivováno.</span>
            </div>
          )}

          {tier === 'free' ? (
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3 py-2 text-xs font-medium text-white shadow-sm transition-all hover:brightness-110"
            >
              <Zap className="h-3 w-3" />
              Upgradovat plán
            </Link>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="text-xs"
              onClick={openPortal}
              disabled={loading}
            >
              <CreditCard className="mr-1.5 h-3 w-3" />
              {loading ? 'Přesměrování...' : 'Spravovat předplatné'}
            </Button>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
