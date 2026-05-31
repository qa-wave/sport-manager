'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Bot, Loader2, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { apiFetch } from '@/lib/api';
import type { ClubAiSettings, AiRoleBucket } from '@sport-manager/contracts';

interface CatalogItem {
  key: string;
  label: string;
  kind: 'read' | 'action';
  defaults: AiRoleBucket[];
}
interface BucketItem {
  key: AiRoleBucket;
  label: string;
}
interface SettingsResponse {
  settings: ClubAiSettings;
  availableModels: string[];
  catalog: CatalogItem[];
  buckets: BucketItem[];
}

export function AiSettingsCard() {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<ClubAiSettings | null>(null);

  const { data, isLoading } = useQuery<SettingsResponse>({
    queryKey: ['ai-settings'],
    queryFn: () => apiFetch('/chat/settings'),
  });

  // Initialise the local draft once data arrives.
  const settings = draft ?? data?.settings ?? null;

  const save = useMutation({
    mutationFn: (ai: ClubAiSettings) =>
      apiFetch('/chat/settings', { method: 'PATCH', body: JSON.stringify({ ai }) }),
    onSuccess: () => {
      toast.success('Nastavení asistenta uloženo.');
      queryClient.invalidateQueries({ queryKey: ['ai-settings'] });
      queryClient.invalidateQueries({ queryKey: ['chat-config'] });
    },
    onError: () => toast.error('Uložení se nezdařilo.'),
  });

  if (isLoading || !data || !settings) {
    return (
      <Card>
        <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Načítám nastavení asistenta…
        </CardContent>
      </Card>
    );
  }

  const allowedFor = (toolKey: string): AiRoleBucket[] => {
    const override = settings.toolRoles?.[toolKey];
    if (override) return override;
    return data.catalog.find((t) => t.key === toolKey)?.defaults ?? [];
  };

  const patch = (next: Partial<ClubAiSettings>) =>
    setDraft({ ...settings, ...next });

  const toggleBucket = (toolKey: string, bucket: AiRoleBucket) => {
    const current = allowedFor(toolKey);
    const next = current.includes(bucket)
      ? current.filter((b) => b !== bucket)
      : [...current, bucket];
    patch({ toolRoles: { ...settings.toolRoles, [toolKey]: next } });
  };

  const models = data.availableModels.includes(settings.model)
    ? data.availableModels
    : [settings.model, ...data.availableModels];

  return (
    <Card>
      <CardContent className="space-y-5 p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <div className="text-sm font-semibold">AI asistent</div>
            <div className="text-xs text-muted-foreground">Chatbot klubu — model a oprávnění příkazů</div>
          </div>
          {/* Enabled toggle */}
          <button
            type="button"
            role="switch"
            aria-checked={settings.enabled}
            onClick={() => patch({ enabled: !settings.enabled })}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${settings.enabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${settings.enabled ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>

        {/* Model select */}
        <div className="space-y-1.5">
          <label htmlFor="ai-model" className="text-xs font-medium text-muted-foreground">
            LLM model (lokální Ollama)
          </label>
          <select
            id="ai-model"
            value={settings.model}
            onChange={(e) => patch({ model: e.target.value })}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Persona */}
        <div className="space-y-1.5">
          <label htmlFor="ai-persona" className="text-xs font-medium text-muted-foreground">
            Osobnost / dodatečné pokyny (volitelné)
          </label>
          <Textarea
            id="ai-persona"
            value={settings.persona ?? ''}
            onChange={(e) => patch({ persona: e.target.value })}
            placeholder="Např. Buď stručný a oslovuj trenéry jménem."
            rows={2}
            className="text-sm"
          />
        </div>

        {/* Permission matrix: tool × role bucket */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-muted-foreground">
            Příkazy a kdo je smí používat
          </div>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-2 py-2 text-left font-medium">Příkaz</th>
                  {data.buckets.map((b) => (
                    <th key={b.key} className="px-2 py-2 text-center font-medium">{b.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.catalog.map((tool) => (
                  <tr key={tool.key} className="border-b border-border/40 last:border-0">
                    <td className="px-2 py-2">
                      <div className="font-medium">{tool.label}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {tool.kind === 'action' ? 'akce (vyžaduje potvrzení)' : 'čtení'}
                      </div>
                    </td>
                    {data.buckets.map((b) => {
                      const on = allowedFor(tool.key).includes(b.key);
                      return (
                        <td key={b.key} className="px-2 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={on}
                            onChange={() => toggleBucket(tool.key, b.key)}
                            aria-label={`${tool.label} — ${b.label}`}
                            className="h-4 w-4 cursor-pointer accent-primary"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Asistent uvidí jen příkazy povolené pro role daného uživatele. Platby a citlivá data drž jen pro Správce/Finance.
          </p>
        </div>

        <Button
          onClick={() => save.mutate(settings)}
          disabled={save.isPending}
          className="w-full"
        >
          {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Uložit nastavení
        </Button>
      </CardContent>
    </Card>
  );
}
