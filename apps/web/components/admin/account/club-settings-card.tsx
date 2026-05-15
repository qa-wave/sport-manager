'use client';

import { useState } from 'react';
import { AlertTriangle, Calendar, ChevronRight, ClipboardSignature, Copy, Check, Settings } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { apiFetch } from '@/lib/api';

const COMMON_TIMEZONES = [
  'Europe/Prague',
  'Europe/Bratislava',
  'Europe/Vienna',
  'Europe/Berlin',
  'Europe/Warsaw',
  'Europe/Budapest',
  'Europe/London',
  'Europe/Paris',
  'Europe/Rome',
  'Europe/Madrid',
  'UTC',
];

// ─── Club name + timezone ───

interface ClubSettingsCardProps {
  clubId: string;
  currentName: string;
  currentTimezone: string;
}

export function ClubSettingsCard({ clubId: _clubId, currentName, currentTimezone }: ClubSettingsCardProps) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(currentName);
  const [timezone, setTimezone] = useState(currentTimezone);

  const isDirty = name !== currentName || timezone !== currentTimezone;

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch('/clubs/settings', {
        method: 'PATCH',
        body: JSON.stringify({ name, timezone }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setEditing(false);
    },
  });

  if (!editing) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="divide-y divide-border/30 p-0">
          <button
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-primary/[0.03]"
            onClick={() => setEditing(true)}
          >
            <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Nastavení klubu</div>
              <div className="text-xs text-muted-foreground">
                {currentName} · {currentTimezone}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3 pb-1">
          <Settings className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Nastavení klubu</span>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Název klubu</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Časové pásmo</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 justify-end pt-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setName(currentName);
              setTimezone(currentTimezone);
              setEditing(false);
            }}
          >
            Zrušit
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={() => mutation.mutate()}
            disabled={!isDirty || mutation.isPending}
          >
            {mutation.isPending ? 'Ukládám...' : 'Uložit'}
          </Button>
        </div>
        {mutation.isError && (
          <div className="text-xs text-destructive">Nepodařilo se uložit.</div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Season card ───

interface SeasonCardProps {
  currentSeason?: string;
}

export function SeasonCard({ currentSeason }: SeasonCardProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newSeason, setNewSeason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const displayed = currentSeason ?? '2025/26';

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch('/clubs/archive-season', {
        method: 'POST',
        body: JSON.stringify({ newSeason }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
      setConfirmOpen(false);
      setOpen(false);
      setNewSeason('');
    },
  });

  if (!open) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="divide-y divide-border/30 p-0">
          <button
            className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-primary/[0.03]"
            onClick={() => setOpen(true)}
          >
            <Calendar className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="flex-1">
              <div className="text-sm font-medium">Správa sezony</div>
              <div className="text-xs text-muted-foreground">
                Aktuální sezona:{' '}
                <span className="font-semibold text-foreground">{displayed}</span>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3 pb-1">
          <Calendar className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Správa sezony</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5">
          <span className="text-xs text-muted-foreground">Aktuální sezona:</span>
          <span className="text-sm font-bold">{displayed}</span>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Nová sezona po uzavření
          </label>
          <Input
            value={newSeason}
            onChange={(e) => setNewSeason(e.target.value)}
            placeholder="např. 2026/27"
            className="h-8 text-sm"
          />
        </div>

        {!confirmOpen ? (
          <div className="flex justify-end gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setOpen(false)}
            >
              Zrušit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-7 text-xs"
              disabled={!newSeason.trim()}
              onClick={() => setConfirmOpen(true)}
            >
              Uzavřít sezonu
            </Button>
          </div>
        ) : (
          <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-destructive mt-0.5" />
              <p className="text-xs text-destructive">
                Opravdu uzavřít sezonu <strong>{displayed}</strong> a zahájit{' '}
                <strong>{newSeason}</strong>? Tato akce je nevratná.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setConfirmOpen(false)}
              >
                Zrušit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-xs"
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Ukládám...' : 'Potvrdit uzavření'}
              </Button>
            </div>
          </div>
        )}

        {mutation.isError && (
          <p className="text-xs text-destructive">Nepodařilo se uložit. Zkuste znovu.</p>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Registration card ───

interface RegistrationCardProps {
  clubSlug: string;
  currentOpen: boolean;
}

export function RegistrationCard({ clubSlug, currentOpen }: RegistrationCardProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(currentOpen);
  const [copied, setCopied] = useState(false);

  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://sport-manager.qawave.ai';
  const regUrl = `${baseUrl}/k/${clubSlug}/registrace`;

  const mutation = useMutation({
    mutationFn: (newOpen: boolean) =>
      apiFetch('/clubs/registration-config', {
        method: 'PATCH',
        body: JSON.stringify({ open: newOpen }),
      }),
    onSuccess: (_data, newOpen) => {
      setOpen(newOpen);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(regUrl);
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
          <ClipboardSignature className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Registrace</span>
          <span
            className={`ml-auto inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
              open ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
            }`}
          >
            {open ? 'Otevřena' : 'Uzavřena'}
          </span>
        </div>
        <div className="space-y-3 px-4 py-4">
          <p className="text-xs text-muted-foreground">
            Veřejný formulář pro registraci nových hráčů. Rodiče ho vyplní bez přihlášení.
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 truncate rounded-md border border-border/50 bg-secondary/20 px-3 py-1.5 font-mono text-xs text-primary">
              {regUrl}
            </div>
            <Button
              size="sm"
              variant="outline"
              className="shrink-0 h-8 text-xs"
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
                  Kopírovat
                </>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <button
              role="switch"
              aria-checked={open}
              onClick={() => mutation.mutate(!open)}
              disabled={mutation.isPending}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 ${
                open ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  open ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-sm text-muted-foreground">
              {open ? 'Registrace je otevřena' : 'Registrace je uzavřena'}
            </span>
          </div>
          {mutation.isError && (
            <p className="text-xs text-destructive">Nepodařilo se uložit.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
