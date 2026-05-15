'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Palette, RotateCcw, Save } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch, type MeClubTheme } from '@/lib/api';
import {
  STYLE_CATALOG,
  generateThemeVars,
  generateDarkThemeVars,
  type ClubThemeInput,
} from '@/lib/club-theme';

const THEME_DEFAULTS: MeClubTheme = {
  primary: '#609bc6',
  secondary: '#f59e0b',
  tertiary: '#0f172a',
  styleId: 1,
};

interface ClubThemeCardProps {
  clubTheme?: MeClubTheme;
}

export function ClubThemeCard({ clubTheme }: ClubThemeCardProps) {
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

  const applyPreview = useCallback(
    (theme: ClubThemeInput) => {
      const vars =
        resolvedTheme === 'dark' ? generateDarkThemeVars(theme) : generateThemeVars(theme);
      const el = document.documentElement;
      Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    },
    [resolvedTheme],
  );

  useEffect(() => {
    applyPreview(draft);
  }, [draft, applyPreview]);

  // Revert on unmount if unsaved
  useEffect(() => {
    return () => {
      const s = savedRef.current;
      const vars =
        resolvedTheme === 'dark' ? generateDarkThemeVars(s) : generateThemeVars(s);
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
              <label className="text-xs font-medium text-muted-foreground">{label}</label>
              <div className="flex items-center gap-2">
                <label
                  className="relative h-8 w-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-border"
                  style={{ backgroundColor: draft[key] }}
                >
                  <input
                    type="color"
                    value={draft[key]}
                    onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
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
          <span className="text-xs font-medium text-muted-foreground">Styl</span>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {STYLE_CATALOG.map((style) => (
              <button
                key={style.id}
                onClick={() => setDraft((prev) => ({ ...prev, styleId: style.id }))}
                className={`relative flex flex-col items-center gap-1.5 rounded-lg border-2 px-2 py-3 text-xs transition-all ${
                  draft.styleId === style.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
                }`}
              >
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
            onClick={() => setDraft(THEME_DEFAULTS)}
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
          <div className="px-4 pb-3 text-xs text-emerald-500">Uloženo.</div>
        )}
      </CardContent>
    </Card>
  );
}
