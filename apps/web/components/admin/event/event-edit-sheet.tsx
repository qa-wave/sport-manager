'use client';

import type { FormEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { EVENT_TYPES, EVENT_TYPE_LABEL } from '@/lib/event-labels';
import type { TeamSummary } from '@/lib/api';

export interface EventEditFormState {
  type: string;
  title: string;
  teamId: string;
  startsAt: string;
  endsAt: string;
  location: string;
  opponent: string;
  homeAway: string;
  description: string;
}

interface EventEditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formState: EventEditFormState;
  onFormChange: (patch: Partial<EventEditFormState>) => void;
  onSubmit: (e: FormEvent) => void;
  teams: TeamSummary[] | undefined;
  isPending: boolean;
  error: string | null;
}

export function EventEditSheet({
  open,
  onOpenChange,
  formState,
  onFormChange,
  onSubmit,
  teams,
  isPending,
  error,
}: EventEditSheetProps) {
  const showOpponentFields =
    formState.type === 'MATCH' || formState.type === 'TOURNAMENT';

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onOpenChange(false);
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-5">
          <SheetTitle>Upravit událost</SheetTitle>
        </SheetHeader>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label>Typ události</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onFormChange({ type: t })}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    formState.type === t
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {EVENT_TYPE_LABEL[t] ?? t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Název</Label>
            <Input
              id="edit-title"
              required
              value={formState.title}
              onChange={(e) => onFormChange({ title: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-team">Tým</Label>
            <select
              id="edit-team"
              value={formState.teamId}
              onChange={(e) => onFormChange({ teamId: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">Celý klub (bez konkrétního týmu)</option>
              {teams?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-startsAt">Začátek</Label>
              <Input
                id="edit-startsAt"
                type="datetime-local"
                required
                value={formState.startsAt}
                onChange={(e) => onFormChange({ startsAt: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-endsAt">Konec</Label>
              <Input
                id="edit-endsAt"
                type="datetime-local"
                required
                value={formState.endsAt}
                onChange={(e) => onFormChange({ endsAt: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-location">Místo</Label>
            <Input
              id="edit-location"
              value={formState.location}
              onChange={(e) => onFormChange({ location: e.target.value })}
            />
          </div>

          {showOpponentFields && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-opponent">Soupeř</Label>
                <Input
                  id="edit-opponent"
                  value={formState.opponent}
                  onChange={(e) => onFormChange({ opponent: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-homeAway">Domácí / Hosté</Label>
                <select
                  id="edit-homeAway"
                  value={formState.homeAway}
                  onChange={(e) => onFormChange({ homeAway: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Nenastaveno</option>
                  <option value="HOME">Domácí</option>
                  <option value="AWAY">Hosté</option>
                  <option value="NEUTRAL">Neutrální</option>
                </select>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Popis (volitelné)</Label>
            <textarea
              id="edit-description"
              rows={3}
              value={formState.description}
              onChange={(e) => onFormChange({ description: e.target.value })}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Ukládám...' : 'Uložit'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Zrušit
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
