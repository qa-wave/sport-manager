'use client';

import { Check, CreditCard } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

interface StripeConnectCardProps {
  clubId: string;
  connected: boolean;
  justConnected: boolean;
}

export function StripeConnectCard({ clubId: _clubId, connected, justConnected }: StripeConnectCardProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => apiFetch<{ url: string }>('/stripe/connect', { method: 'POST' }),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const isConnected = connected || justConnected;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center gap-3 border-b border-border/30 px-4 py-3">
          <CreditCard className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Platby — Stripe</span>
        </div>
        <div className="px-4 py-4 space-y-3">
          {isConnected ? (
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
            variant={isConnected ? 'outline' : 'default'}
            className="text-xs"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            <CreditCard className="mr-1.5 h-3 w-3" />
            {mutation.isPending
              ? 'Připojuji...'
              : isConnected
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
