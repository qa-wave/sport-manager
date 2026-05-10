'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, MapPin, ExternalLink, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError, type TrainingTemplateDetail, type TeamSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const DAY_LABELS = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];

const EVENT_TYPES = ['PRACTICE', 'MATCH', 'TOURNAMENT', 'MEETING', 'SOCIAL'] as const;
const EVENT_TYPE_LABEL: Record<string, string> = {
  PRACTICE: 'Trénink',
  MATCH: 'Zápas',
  TOURNAMENT: 'Turnaj',
  MEETING: 'Schůzka',
  SOCIAL: 'Akce',
};

const DAYS = [
  { value: 1, label: 'Po' },
  { value: 2, label: 'Út' },
  { value: 3, label: 'St' },
  { value: 4, label: 'Čt' },
  { value: 5, label: 'Pá' },
  { value: 6, label: 'So' },
  { value: 0, label: 'Ne' },
];

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });
}

function toDateInput(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

function DayBadges({ days }: { days: number[] }) {
  const sorted = [...days].sort((a, b) => a - b);
  return (
    <div className="flex flex-wrap gap-1">
      {sorted.map((d) => (
        <span key={d} className="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
          {DAY_LABELS[d]}
        </span>
      ))}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg bg-secondary/30 p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {sub && <div className="text-[11px] text-muted-foreground/60">{sub}</div>}
    </div>
  );
}

/* ── Delete dialog ─────────────────────────────────────────── */
function DeleteDialog({
  open,
  onConfirm,
  onCancel,
  isPending,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
        <h3 className="text-base font-bold">Smazat šablonu?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Tato akce odstraní šablonu a soft-smaže všechny budoucí vygenerované události. Tato akce je nevratná.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
            Zrušit
          </Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Mažu...' : 'Smazat'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Regenerate dialog ─────────────────────────────────────── */
function RegenerateDialog({
  open,
  onConfirm,
  onCancel,
  isPending,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
        <h3 className="text-base font-bold">Regenerovat události?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Tato akce smaže budoucí vygenerované události a znovu je vygeneruje podle aktuální šablony.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
            Zrušit
          </Button>
          <Button size="sm" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Generuji...' : 'Regenerovat'}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Edit form ─────────────────────────────────────────────── */
function EditForm({
  tpl,
  teams,
  onCancel,
  onSaved,
}: {
  tpl: TrainingTemplateDetail;
  teams: TeamSummary[];
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(tpl.name);
  const [teamId, setTeamId] = useState(tpl.teamId);
  const [eventType, setEventType] = useState(tpl.eventType);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(tpl.daysOfWeek);
  const [startTime, setStartTime] = useState(tpl.startTime);
  const [endTime, setEndTime] = useState(tpl.endTime);
  const [location, setLocation] = useState(tpl.location ?? '');
  const [locationUrl, setLocationUrl] = useState(tpl.locationUrl ?? '');
  const [description, setDescription] = useState(tpl.description ?? '');
  const [validFrom, setValidFrom] = useState(toDateInput(tpl.validFrom));
  const [validUntil, setValidUntil] = useState(toDateInput(tpl.validUntil));
  const [active, setActive] = useState(tpl.active);
  const [error, setError] = useState<string | null>(null);

  const updateMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<TrainingTemplateDetail>(`/training-templates/${tpl.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),
    onSuccess: () => onSaved(),
    onError: (err: ApiError) => setError(err?.message ?? 'Nepodařilo se uložit změny'),
  });

  function toggleDay(day: number) {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim() || daysOfWeek.length === 0 || !validFrom || !validUntil) {
      setError('Vyplňte název, alespoň jeden den a platnost.');
      return;
    }

    const body: Record<string, unknown> = {
      name: name.trim(),
      teamId,
      eventType,
      daysOfWeek,
      startTime,
      endTime,
      validFrom: new Date(validFrom).toISOString(),
      validUntil: new Date(validUntil).toISOString(),
      active,
    };
    if (location.trim()) body.location = location.trim();
    if (locationUrl.trim()) body.locationUrl = locationUrl.trim();
    if (description.trim()) body.description = description.trim();

    updateMutation.mutate(body);
  }

  return (
    <Card className="">
      <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Název šablony</Label>
            <Input id="edit-name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-team">Tým</Label>
            <select
              id="edit-team"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Typ události</Label>
            <div className="flex flex-wrap gap-2">
              {EVENT_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEventType(t)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    eventType === t
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {EVENT_TYPE_LABEL[t]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Dny v týdnu</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDay(value)}
                  className={`h-9 w-10 rounded-md text-sm font-semibold transition-all ${
                    daysOfWeek.includes(value)
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-startTime">Začátek</Label>
              <Input id="edit-startTime" type="time" required value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-endTime">Konec</Label>
              <Input id="edit-endTime" type="time" required value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-validFrom">Platnost od</Label>
              <Input id="edit-validFrom" type="date" required value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-validUntil">Platnost do</Label>
              <Input id="edit-validUntil" type="date" required value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-location">Místo</Label>
            <Input id="edit-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Volitelné" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-locationUrl">Odkaz na mapu</Label>
            <Input id="edit-locationUrl" type="url" value={locationUrl} onChange={(e) => setLocationUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-description">Popis</Label>
            <textarea
              id="edit-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Volitelný popis..."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              role="switch"
              aria-checked={active}
              onClick={() => setActive((v) => !v)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active ? 'bg-primary' : 'bg-input'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                  active ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
            <Label className="cursor-pointer" onClick={() => setActive((v) => !v)}>
              {active ? 'Šablona aktivní' : 'Šablona pozastavena'}
            </Label>
          </div>

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Ukládám...' : 'Uložit změny'}
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel} disabled={updateMutation.isPending}>
              Zrušit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

/* ── Main page ─────────────────────────────────────────────── */
export default function TrainingTemplateDetailPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const auth = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editMode, setEditMode] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);

  const { data: tpl, isLoading, isError } = useQuery<TrainingTemplateDetail, ApiError>({
    queryKey: ['training-template', templateId, auth.clubId],
    queryFn: () => apiFetch<TrainingTemplateDetail>(`/training-templates/${templateId}`),
    enabled: auth.isAuthenticated && !!auth.clubId && !!templateId,
    retry: false,
  });

  const teams = useQuery<TeamSummary[], ApiError>({
    queryKey: ['teams', auth.clubId],
    queryFn: () => apiFetch<TeamSummary[]>('/teams'),
    enabled: auth.isAuthenticated && !!auth.clubId && editMode,
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/training-templates/${templateId}`, { method: 'DELETE' }),
    onSuccess: () => {
      router.push('/admin/training-templates');
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/training-templates/${templateId}/regenerate`, { method: 'POST' }),
    onSuccess: () => {
      setShowRegenerate(false);
      queryClient.invalidateQueries({ queryKey: ['training-template', templateId] });
    },
  });

  if (isLoading) {
    return (
      <>
        <PageHeader title="Šablona tréninků" />
        <Card>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-6 w-60" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-80" />
          </CardContent>
        </Card>
      </>
    );
  }

  if (isError || !tpl) {
    return (
      <>
        <PageHeader
          title="Šablona tréninků"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/training-templates">
                <ChevronLeft className="mr-1 h-4 w-4" />Zpět
              </Link>
            </Button>
          }
        />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Šablona nenalezena nebo se nepodařilo načíst data.
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <DeleteDialog
        open={showDelete}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDelete(false)}
        isPending={deleteMutation.isPending}
      />
      <RegenerateDialog
        open={showRegenerate}
        onConfirm={() => regenerateMutation.mutate()}
        onCancel={() => setShowRegenerate(false)}
        isPending={regenerateMutation.isPending}
      />

      <PageHeader
        title={tpl.name}
        subtitle={`Vytvořil ${tpl.createdBy}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/training-templates">
                <ChevronLeft className="mr-1 h-4 w-4" />Zpět
              </Link>
            </Button>
            {!editMode && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegenerate(true)}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />Regenerovat
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditMode(true)}
                >
                  <Pencil className="mr-1 h-3.5 w-3.5" />Upravit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDelete(true)}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />Smazat
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Celkem událostí" value={tpl.stats.totalEvents} />
        <StatCard label="Nadcházející" value={tpl.stats.upcomingEvents} />
        <StatCard label="Minulé" value={tpl.stats.pastEvents} />
        <StatCard label="Odpojené" value={tpl.stats.detachedEvents} sub="editovány ručně" />
      </div>

      {editMode ? (
        <EditForm
          tpl={tpl}
          teams={teams.data ?? []}
          onCancel={() => setEditMode(false)}
          onSaved={() => {
            setEditMode(false);
            queryClient.invalidateQueries({ queryKey: ['training-template', templateId] });
            queryClient.invalidateQueries({ queryKey: ['training-templates'] });
          }}
        />
      ) : (
        /* Detail view */
        <Card className="relative overflow-hidden ">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-cyan-500/[0.02]" />
          <CardContent className="relative p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              {/* Left column */}
              <div className="space-y-4">
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Tým
                  </div>
                  <div className="text-sm font-medium">{tpl.teamName}</div>
                </div>

                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Typ události
                  </div>
                  <Badge variant="default">
                    {EVENT_TYPE_LABEL[tpl.eventType] ?? tpl.eventType}
                  </Badge>
                </div>

                <div>
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Dny v týdnu
                  </div>
                  <DayBadges days={tpl.daysOfWeek} />
                </div>

                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Čas
                  </div>
                  <div className="font-mono text-sm">
                    {tpl.startTime} – {tpl.endTime}
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Platnost
                  </div>
                  <div className="text-sm">
                    {formatDate(tpl.validFrom)} – {formatDate(tpl.validUntil)}
                  </div>
                </div>

                <div>
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Stav
                  </div>
                  {tpl.active ? (
                    <Badge variant="success">Aktivní</Badge>
                  ) : (
                    <Badge variant="default">Pozastaveno</Badge>
                  )}
                </div>

                {tpl.location && (
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Místo
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>{tpl.location}</span>
                      {tpl.locationUrl && (
                        <a
                          href={tpl.locationUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {tpl.description && (
                  <div>
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Popis
                    </div>
                    <p className="text-sm text-muted-foreground">{tpl.description}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
