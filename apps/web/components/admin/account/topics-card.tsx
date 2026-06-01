'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { apiFetch, type MeResponse } from '@/lib/api';
import { USER_TOPICS } from '@/lib/topics';

interface TopicsCardProps {
  me: MeResponse;
}

export function TopicsCard({ me }: TopicsCardProps) {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>(me.topics ?? []);

  const save = useMutation({
    mutationFn: (topics: string[]) =>
      apiFetch('/me', { method: 'PATCH', body: JSON.stringify({ topics }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
    onError: () => toast.error('Uložení témátek se nezdařilo.'),
  });

  const toggle = (key: string) => {
    const next = selected.includes(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key];
    setSelected(next);
    save.mutate(next);
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-semibold">Témátka</div>
            <div className="text-xs text-muted-foreground">Co tě v klubu zajímá — přizpůsobíme ti obsah</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {USER_TOPICS.map((t) => {
            const on = selected.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  on
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
