'use client';

import Link from 'next/link';
import { ArrowRight, Users, X, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch, ApiError, type ClubUsageResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';

/**
 * UpgradeBanner
 *
 * Shows a dismissible upgrade nudge when a FREE-plan club is approaching its
 * limits (>= 20 members OR >= 2 teams). Renders nothing for PRO/CLUB plans.
 *
 * Place it below the stat cards on the dashboard (or anywhere in the admin layout).
 */

/** Storage key for "dismissed until next session" flag. */
const DISMISS_KEY = 'upgrade-banner-dismissed';

/** Threshold above which the banner appears (FREE plan). */
const MEMBER_WARNING_THRESHOLD = 20;
const TEAM_WARNING_THRESHOLD = 2;

function isFreePlan(tier: string): boolean {
  return tier === 'free';
}

function shouldShow(usage: ClubUsageResponse): boolean {
  if (!isFreePlan(usage.tier)) return false;
  return (
    usage.members.current >= MEMBER_WARNING_THRESHOLD ||
    usage.teams.current >= TEAM_WARNING_THRESHOLD
  );
}

export function UpgradeBanner() {
  const auth = useAuth();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem(DISMISS_KEY) === '1';
  });

  const { data: usage } = useQuery<ClubUsageResponse, ApiError>({
    queryKey: ['club-usage', auth.clubId],
    queryFn: () => apiFetch<ClubUsageResponse>('/clubs/usage'),
    enabled: auth.isAuthenticated && !!auth.clubId,
    // Refresh every 5 minutes — not critical
    staleTime: 5 * 60 * 1000,
  });

  function dismiss() {
    setDismissed(true);
    sessionStorage.setItem(DISMISS_KEY, '1');
  }

  if (!usage || dismissed || !shouldShow(usage)) {
    return null;
  }

  const membersLeft = usage.members.max - usage.members.current;
  const atMemberLimit = membersLeft <= 5;

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.04] px-4 py-3.5 animate-fade-up">
      {/* Subtle gradient accent on left edge */}
      <div className="absolute inset-y-0 left-0 w-1 rounded-l-xl bg-gradient-brand" />

      <div className="flex items-center gap-3 pl-2">
        {/* Icon */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          {atMemberLimit ? (
            <Users className="h-4 w-4 text-primary" />
          ) : (
            <Zap className="h-4 w-4 text-primary" />
          )}
        </div>

        {/* Message */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug">
            {atMemberLimit ? (
              <>
                Blížíte se limitu FREE plánu —{' '}
                <span className="text-primary font-semibold">
                  zbývá {membersLeft} {membersLeft === 1 ? 'místo' : membersLeft <= 4 ? 'místa' : 'míst'}
                </span>{' '}
                pro nové členy.
              </>
            ) : (
              <>
                Váš klub roste.{' '}
                <span className="text-primary font-semibold">Upgradujte na PRO</span>{' '}
                pro neomezené členy a týmy.
              </>
            )}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {usage.members.current} / {usage.members.max === 999_999 ? '∞' : usage.members.max} členů
            {' · '}
            {usage.teams.current} / {usage.teams.max === 999_999 ? '∞' : usage.teams.max} týmů
          </p>
        </div>

        {/* CTA */}
        <Link
          href="/pricing"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-gradient-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 hover:brightness-110"
        >
          Zobrazit plány
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        {/* Dismiss */}
        <button
          onClick={dismiss}
          className="shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          aria-label="Zavřít upozornění"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
