'use client';

import { Bell } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import { usePushNotifications } from '@/hooks/use-push-notifications';

type NotifPrefs = {
  emailEvents: boolean;
  emailRsvpReminder: boolean;
  emailMessages: boolean;
  pushEnabled: boolean;
};

interface ToggleRowProps {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (v: boolean) => void;
}

function ToggleRow({ label, desc, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
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

export function NotificationPrefsCard() {
  const queryClient = useQueryClient();
  const push = usePushNotifications();

  const { data: prefs, isLoading } = useQuery<NotifPrefs>({
    queryKey: ['notification-prefs'],
    queryFn: () => apiFetch<NotifPrefs>('/notification-preferences'),
    staleTime: 5 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<NotifPrefs>) =>
      apiFetch<NotifPrefs>('/notification-preferences', {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData<NotifPrefs>(['notification-prefs'], updated);
    },
  });

  const isSaving = mutation.isPending || push.isLoading;

  const handleToggle = async (key: keyof NotifPrefs, value: boolean) => {
    if (key === 'pushEnabled') {
      if (value) {
        const result = await push.subscribe();
        if (!result.ok) return;
      } else {
        await push.unsubscribe();
      }
    }
    mutation.mutate({ [key]: value });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
          <Bell className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Oznámení</span>
          {isSaving && (
            <span className="ml-auto text-[11px] text-muted-foreground animate-pulse">
              Ukládám...
            </span>
          )}
        </div>
        {isLoading ? (
          <div className="divide-y divide-border/20">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3 gap-3">
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 w-32 animate-pulse rounded bg-secondary/60" />
                  <div className="h-3 w-48 animate-pulse rounded bg-secondary/40" />
                </div>
                <div className="h-5 w-9 animate-pulse rounded-full bg-secondary/60" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-border/20">
            <ToggleRow
              label="Nové události"
              desc="Emailem při vytvoření nové události"
              checked={prefs?.emailEvents ?? true}
              disabled={isSaving}
              onChange={(v) => handleToggle('emailEvents', v)}
            />
            <ToggleRow
              label="Připomenutí RSVP"
              desc="Připomenutí před termínem potvrzení"
              checked={prefs?.emailRsvpReminder ?? true}
              disabled={isSaving}
              onChange={(v) => handleToggle('emailRsvpReminder', v)}
            />
            <ToggleRow
              label="Nové zprávy"
              desc="Emailem při nové zprávě v konverzaci"
              checked={prefs?.emailMessages ?? true}
              disabled={isSaving}
              onChange={(v) => handleToggle('emailMessages', v)}
            />
            <ToggleRow
              label="Push notifikace"
              desc={
                !push.isSupported
                  ? 'Prohlížeč nepodporuje push notifikace'
                  : 'Oznámení v prohlížeči (vyžaduje povolení)'
              }
              checked={prefs?.pushEnabled ?? false}
              disabled={isSaving || !push.isSupported}
              onChange={(v) => handleToggle('pushEnabled', v)}
            />
          </div>
        )}
        {mutation.isError && (
          <p className="px-4 pb-3 text-[11px] text-destructive">
            Nepodařilo se uložit. Zkus to znovu.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
