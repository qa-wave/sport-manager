'use client';

import { useEffect, useRef, useState } from 'react';
import { Clock, Lock } from 'lucide-react';

function useRsvpDeadlineCountdown(deadline: string | null | undefined): {
  expired: boolean;
  urgency: 'none' | 'normal' | 'soon' | 'expired';
  label: string;
} {
  const [now, setNow] = useState(() => Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!deadline) return;
    intervalRef.current = setInterval(() => setNow(Date.now()), 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [deadline]);

  if (!deadline) return { expired: false, urgency: 'none', label: '' };

  const deadlineMs = new Date(deadline).getTime();
  const diffMs = deadlineMs - now;

  if (diffMs <= 0) {
    return { expired: true, urgency: 'expired', label: 'RSVP uzávěrka vypršela' };
  }

  const totalMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;

  let label: string;
  if (days > 1) {
    label = `RSVP do: ${new Date(deadline).toLocaleDateString('cs-CZ', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  } else if (days === 1) {
    label = `RSVP do: zítra ${new Date(deadline).toLocaleTimeString('cs-CZ', {
      hour: '2-digit',
      minute: '2-digit',
    })} (zbývá ${remHours}h ${mins}min)`;
  } else if (hours > 0) {
    label = `RSVP do: ${new Date(deadline).toLocaleString('cs-CZ', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })} (zbývá ${hours}h ${mins}min)`;
  } else {
    label = `RSVP uzávěrka za ${mins} min`;
  }

  const urgency = totalMins < 60 ? 'soon' : 'normal';
  return { expired: false, urgency, label };
}

interface RsvpDeadlineBadgeProps {
  deadline: string | null | undefined;
}

export function RsvpDeadlineBadge({ deadline }: RsvpDeadlineBadgeProps) {
  const { expired, urgency, label } = useRsvpDeadlineCountdown(deadline);

  if (!deadline || urgency === 'none') return null;

  if (expired) {
    return (
      <div className="flex items-center gap-1.5 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
        <Lock className="h-3.5 w-3.5" />
        {label}
      </div>
    );
  }

  const colorClass =
    urgency === 'soon'
      ? 'border-red-400/40 bg-red-500/10 text-red-600 dark:text-red-400'
      : 'border-amber-400/40 bg-amber-500/10 text-amber-700 dark:text-amber-400';

  return (
    <div className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium ${colorClass}`}>
      <Clock className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}
