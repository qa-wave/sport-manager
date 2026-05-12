'use client';

import { useState, useMemo, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Check, CheckCheck, ChevronLeft, Clock, Copy, MapPin, Pencil, Plus, QrCode, Search, Trash2, User, ExternalLink, X } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { RsvpBar } from '@/components/admin/rsvp-bar';
import { apiFetch, ApiError, type EventDetail, type TeamSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext } from '@/lib/member-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EVENT_TYPE_VARIANT, RSVP_VARIANT } from '@/lib/role-colors';
import {
  DRILLS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  DIFFICULTY_LABELS,
  filterDrills,
  type DrillCategory,
  type Difficulty,
  type Drill,
} from '@/lib/training-library';

const EVENT_TYPES = ['PRACTICE', 'MATCH', 'TOURNAMENT', 'MEETING', 'SOCIAL'] as const;

// ─── Drill block marker ───
// Format stored in description: <!-- drills: w1,p3,s2 -->
const DRILL_MARKER_RE = /<!--\s*drills:\s*([^>]*?)\s*-->/;

function parseDrillIds(description: string): string[] {
  const match = DRILL_MARKER_RE.exec(description);
  if (!match) return [];
  return match[1].split(',').map(s => s.trim()).filter(Boolean);
}

function updateDrillMarker(description: string, ids: string[]): string {
  const marker = `<!-- drills: ${ids.join(',')} -->`;
  if (DRILL_MARKER_RE.test(description)) {
    return description.replace(DRILL_MARKER_RE, marker);
  }
  return description ? `${description}\n\n${marker}` : marker;
}

// ─── Training Plan Section ───

interface TrainingPlanSectionProps {
  eventId: string;
  description: string;
  isCoachOrAdmin: boolean;
  drillPickerOpen: boolean;
  setDrillPickerOpen: (open: boolean) => void;
  onDescriptionUpdate: (newDesc: string) => void;
}

function TrainingPlanSection({
  eventId,
  description,
  isCoachOrAdmin,
  drillPickerOpen,
  setDrillPickerOpen,
  onDescriptionUpdate,
}: TrainingPlanSectionProps) {
  const queryClient = useQueryClient();

  const drillIds = useMemo(() => parseDrillIds(description), [description]);
  const plannedDrills = useMemo(
    () => drillIds.map(id => DRILLS.find(d => d.id === id)).filter((d): d is Drill => !!d),
    [drillIds],
  );

  const patchMutation = useMutation({
    mutationFn: (newDesc: string) =>
      apiFetch(`/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({ description: newDesc }),
      }),
    onSuccess: (_data, newDesc) => {
      onDescriptionUpdate(newDesc);
    },
  });

  function addDrill(drill: Drill) {
    const newIds = drillIds.includes(drill.id) ? drillIds : [...drillIds, drill.id];
    const newDesc = updateDrillMarker(description, newIds);
    patchMutation.mutate(newDesc);
    setDrillPickerOpen(false);
  }

  function removeDrill(drillId: string) {
    const newIds = drillIds.filter(id => id !== drillId);
    const newDesc = updateDrillMarker(description, newIds);
    patchMutation.mutate(newDesc);
  }

  const totalMinutes = plannedDrills.reduce((sum, d) => sum + d.durationMin, 0);

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Plán tréninku</CardTitle>
            {plannedDrills.length > 0 && (
              <span className="text-xs text-muted-foreground">
                {plannedDrills.length} {plannedDrills.length === 1 ? 'cvičení' : 'cvičení'} · {totalMinutes} min
              </span>
            )}
          </div>
          {isCoachOrAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setDrillPickerOpen(true)}
              disabled={patchMutation.isPending}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Přidat z knihovny
            </Button>
          )}
        </CardHeader>

        {plannedDrills.length === 0 ? (
          <CardContent className="pb-6 pt-0">
            <div className="rounded-lg border border-dashed border-border/60 py-8 text-center">
              <BookOpen className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm font-medium text-muted-foreground">Žádný plán tréninku</p>
              {isCoachOrAdmin && (
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Přidejte cvičení z knihovny kliknutím na tlačítko výše
                </p>
              )}
            </div>
          </CardContent>
        ) : (
          <CardContent className="pb-4 pt-0 space-y-2">
            {plannedDrills.map((drill, idx) => (
              <div
                key={drill.id}
                className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted/20 p-3"
              >
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                  {idx + 1}
                </div>
                <div className="text-base">{CATEGORY_ICONS[drill.category]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold">{drill.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[drill.category]}`}>
                      {CATEGORY_LABELS[drill.category]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {drill.durationMin} min
                    </span>
                    <span>{DIFFICULTY_LABELS[drill.difficulty]}</span>
                  </div>
                </div>
                {isCoachOrAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => removeDrill(drill.id)}
                    disabled={patchMutation.isPending}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>

      {drillPickerOpen && (
        <DrillPickerModal
          onSelect={addDrill}
          onClose={() => setDrillPickerOpen(false)}
          alreadyAdded={drillIds}
        />
      )}
    </>
  );
}

// ─── Drill Picker Modal ───

function DrillPickerModal({
  onSelect,
  onClose,
  alreadyAdded,
}: {
  onSelect: (drill: Drill) => void;
  onClose: () => void;
  alreadyAdded: string[];
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<DrillCategory | undefined>();
  const [difficulty, setDifficulty] = useState<Difficulty | undefined>();

  const filtered = useMemo(
    () => filterDrills({ category, difficulty, search: search || undefined }),
    [category, difficulty, search],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl flex-col rounded-xl border border-border bg-background shadow-2xl animate-scale-in max-h-[85vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">Vybrat cvičení z knihovny</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Filters */}
        <div className="border-b border-border/30 px-5 py-3 space-y-2.5">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Hledat cvičení..."
              className="pl-8 h-8 text-xs"
            />
          </div>
          {/* Category pills */}
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setCategory(undefined)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                !category ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Vše ({DRILLS.length})
            </button>
            {(Object.keys(CATEGORY_LABELS) as DrillCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(category === cat ? undefined : cat)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                  category === cat
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : `${CATEGORY_COLORS[cat]} hover:opacity-80`
                }`}
              >
                {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
          {/* Difficulty */}
          <div className="flex gap-1.5">
            {(['', 'easy', 'medium', 'hard'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDifficulty((d || undefined) as Difficulty | undefined)}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-all ${
                  difficulty === (d || undefined)
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {d === '' ? 'Všechny' : d === 'easy' ? 'Začátečník' : d === 'medium' ? 'Pokročilý' : 'Expert'}
              </button>
            ))}
          </div>
        </div>

        {/* Drill list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">Žádné cvičení</div>
          ) : (
            filtered.map((drill) => {
              const alreadyIn = alreadyAdded.includes(drill.id);
              return (
                <button
                  key={drill.id}
                  disabled={alreadyIn}
                  onClick={() => !alreadyIn && onSelect(drill)}
                  className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all ${
                    alreadyIn
                      ? 'border-border/30 bg-muted/30 opacity-50 cursor-not-allowed'
                      : 'border-border/50 bg-card hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm cursor-pointer'
                  }`}
                >
                  <div className="text-xl shrink-0">{CATEGORY_ICONS[drill.category]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold truncate">{drill.name}</span>
                      {alreadyIn && (
                        <Badge variant="outline" className="text-[10px] shrink-0">Přidáno</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[drill.category]}`}>
                        {CATEGORY_LABELS[drill.category]}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {drill.durationMin} min
                      </span>
                      <span>{DIFFICULTY_LABELS[drill.difficulty]}</span>
                    </div>
                  </div>
                  {!alreadyIn && (
                    <Plus className="h-4 w-4 shrink-0 text-muted-foreground/50 group-hover:text-primary" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-border/30 px-5 py-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? 'cvičení' : 'cvičení'}
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Zavřít
          </Button>
        </div>
      </div>
    </div>
  );
}

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleDateString('cs-CZ', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

function isPast(d: string): boolean {
  return new Date(d) < new Date();
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const auth = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: memberCtx } = useMemberContext();
  const [bulkAttendance, setBulkAttendance] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);
  const [drillPickerOpen, setDrillPickerOpen] = useState(false);

  // Edit form state
  const [editType, setEditType] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editTeamId, setEditTeamId] = useState('');
  const [editStartsAt, setEditStartsAt] = useState('');
  const [editEndsAt, setEditEndsAt] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editOpponent, setEditOpponent] = useState('');
  const [editHomeAway, setEditHomeAway] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const isCoachOrAdmin = memberCtx && (
    memberCtx.clubRoles.includes('OWNER') ||
    memberCtx.clubRoles.includes('ADMIN') ||
    memberCtx.teamRoles.some(tr => ['HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'].includes(tr.role))
  );

  const { data: event, isLoading, isError } = useQuery<EventDetail, ApiError>({
    queryKey: ['event', eventId, auth.clubId],
    queryFn: () => apiFetch<EventDetail>(`/events/${eventId}`),
    enabled: auth.isAuthenticated && !!auth.clubId && !!eventId,
    retry: false,
  });

  const { data: teams } = useQuery<TeamSummary[], ApiError>({
    queryKey: ['teams', auth.clubId],
    queryFn: () => apiFetch<TeamSummary[]>('/teams'),
    enabled: auth.isAuthenticated && !!auth.clubId && isEditing,
  });

  const updateMutation = useMutation({
    mutationFn: (body: any) =>
      apiFetch(`/events/${eventId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setIsEditing(false);
      setEditError(null);
    },
    onError: (err: any) => setEditError(err?.message ?? 'Nepodařilo se uložit změny'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/events/${eventId}`, { method: 'DELETE' }),
    onSuccess: () => router.push('/admin/events'),
  });

  function openEditForm() {
    if (!event) return;
    setEditType(event.type);
    setEditTitle(event.title);
    setEditTeamId(event.teamId ?? '');
    setEditStartsAt(toLocalDatetimeValue(event.startsAt));
    setEditEndsAt(toLocalDatetimeValue(event.endsAt));
    setEditLocation(event.location ?? '');
    setEditOpponent(event.opponent ?? '');
    setEditHomeAway(event.homeAway ?? '');
    setEditDescription(event.description ?? '');
    setEditError(null);
    setIsEditing(true);
  }

  function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    setEditError(null);
    if (!editTitle.trim() || !editStartsAt || !editEndsAt) {
      setEditError('Název, začátek a konec jsou povinné.');
      return;
    }
    const body: any = {
      type: editType,
      title: editTitle.trim(),
      startsAt: new Date(editStartsAt).toISOString(),
      endsAt: new Date(editEndsAt).toISOString(),
      teamId: editTeamId || null,
      location: editLocation.trim() || null,
      opponent: editOpponent.trim() || null,
      homeAway: editHomeAway || null,
      description: editDescription.trim() || null,
    };
    updateMutation.mutate(body);
  }

  const rsvpMutation = useMutation({
    mutationFn: (args: { memberId: string; status: string; note?: string }) =>
      apiFetch(`/events/${eventId}/rsvp`, {
        method: 'POST',
        body: JSON.stringify(args),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
  });

  const attendanceMutation = useMutation({
    mutationFn: (attendances: Array<{ memberId: string; attended: boolean }>) =>
      apiFetch(`/events/${eventId}/attendance`, {
        method: 'PATCH',
        body: JSON.stringify({ attendances }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
  });

  async function generateQrToken() {
    if (!eventId) return;
    setQrLoading(true);
    try {
      const data = await apiFetch<{ url: string }>(`/events/${eventId}/qr-token`, { method: 'POST' });
      setQrUrl(data.url);
    } catch {
      // silently ignore — user will see no modal
    } finally {
      setQrLoading(false);
    }
  }

  function copyQrUrl() {
    if (!qrUrl) return;
    void navigator.clipboard.writeText(qrUrl).then(() => {
      setQrCopied(true);
      setTimeout(() => setQrCopied(false), 2000);
    });
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Událost" />
        <Card><CardContent className="p-6 space-y-3">
          <Skeleton className="h-6 w-60" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-80" />
        </CardContent></Card>
      </>
    );
  }

  if (isError || !event) {
    return (
      <>
        <PageHeader
          title="Událost"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/events"><ChevronLeft className="mr-1 h-4 w-4" />Zpět na události</Link>
            </Button>
          }
        />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">Nepodařilo se načíst událost</CardContent>
        </Card>
      </>
    );
  }

  const past = isPast(event.endsAt);

  const showOpponentFields = editType === 'MATCH' || editType === 'TOURNAMENT';

  return (
    <>
      <PageHeader
        title={event.title}
        subtitle={`Vytvořil/a ${event.createdBy}`}
        actions={
          <div className="flex items-center gap-2">
            {isCoachOrAdmin && !isEditing && (
              <>
                <Button variant="outline" size="sm" onClick={generateQrToken} disabled={qrLoading}>
                  <QrCode className="mr-1.5 h-3.5 w-3.5" />{qrLoading ? 'Generuji...' : 'QR Docházka'}
                </Button>
                <Button variant="outline" size="sm" onClick={openEditForm}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />Upravit
                </Button>
                {!deleteConfirm ? (
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirm(true)}>
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />Smazat
                  </Button>
                ) : (
                  <div className="flex items-center gap-1.5 rounded-md border border-destructive/40 bg-destructive/5 px-2 py-1 text-xs">
                    <span className="text-destructive font-medium">Opravdu smazat?</span>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      disabled={deleteMutation.isPending}
                      onClick={() => deleteMutation.mutate()}
                    >
                      Smazat
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[11px]"
                      onClick={() => setDeleteConfirm(false)}
                    >
                      Zrušit
                    </Button>
                  </div>
                )}
              </>
            )}
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/events"><ChevronLeft className="mr-1 h-4 w-4" />Zpět na události</Link>
            </Button>
          </div>
        }
      />

      {/* Edit form */}
      {isEditing && (
        <Card>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <CardContent className="p-6">
            <form onSubmit={handleEditSubmit} className="space-y-5">
              {/* Type */}
              <div className="space-y-1.5">
                <Label>Typ události</Label>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setEditType(t)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        editType === t
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'bg-secondary text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-title">Název</Label>
                <Input
                  id="edit-title"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
              </div>

              {/* Team */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-team">Tým</Label>
                <select
                  id="edit-team"
                  value={editTeamId}
                  onChange={(e) => setEditTeamId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Celý klub (bez konkrétního týmu)</option>
                  {teams?.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Date/time */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="edit-startsAt">Začátek</Label>
                  <Input
                    id="edit-startsAt"
                    type="datetime-local"
                    required
                    value={editStartsAt}
                    onChange={(e) => setEditStartsAt(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit-endsAt">Konec</Label>
                  <Input
                    id="edit-endsAt"
                    type="datetime-local"
                    required
                    value={editEndsAt}
                    onChange={(e) => setEditEndsAt(e.target.value)}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-location">Místo</Label>
                <Input
                  id="edit-location"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                />
              </div>

              {/* Opponent (conditional) */}
              {showOpponentFields && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-opponent">Soupeř</Label>
                    <Input
                      id="edit-opponent"
                      value={editOpponent}
                      onChange={(e) => setEditOpponent(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="edit-homeAway">Domácí / Hosté</Label>
                    <select
                      id="edit-homeAway"
                      value={editHomeAway}
                      onChange={(e) => setEditHomeAway(e.target.value)}
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

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="edit-description">Popis (volitelné)</Label>
                <textarea
                  id="edit-description"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>

              {editError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {editError}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? 'Ukládám...' : 'Uložit'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setIsEditing(false); setEditError(null); }}
                  disabled={updateMutation.isPending}
                >
                  Zrušit
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* QR Docházka panel */}
      {qrUrl && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardContent className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">QR kód pro docházku</span>
              </div>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setQrUrl(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">
              Hráči naskenují tento odkaz při příchodu. Kód je platný po dobu trvání události.
            </p>
            <div className="rounded-lg border border-border/50 bg-background p-3 font-mono text-xs break-all text-muted-foreground">
              {qrUrl}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 h-8 text-xs"
              onClick={copyQrUrl}
            >
              {qrCopied
                ? <><Check className="mr-1.5 h-3.5 w-3.5 text-green-500" />Zkopírováno</>
                : <><Copy className="mr-1.5 h-3.5 w-3.5" />Kopírovat odkaz</>
              }
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Hero */}
      <Card className="relative overflow-hidden ">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-cyan-500/[0.02]" />
        <CardContent className="relative p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={EVENT_TYPE_VARIANT[event.type] ?? 'default'} className="text-xs">
                  {event.type}
                </Badge>
                {event.homeAway && (
                  <Badge variant="outline" className="text-[11px]">{event.homeAway}</Badge>
                )}
                {past && <Badge variant="outline" className="text-[11px] text-muted-foreground">MINULÉ</Badge>}
              </div>

              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{formatDateTime(event.startsAt)}</span>
                  <span className="text-muted-foreground/50">—</span>
                  <span>{formatTime(event.endsAt)}</span>
                </div>
                {event.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{event.location}</span>
                    {event.locationUrl && (
                      <a href={event.locationUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                )}
                {event.opponent && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span>vs {event.opponent}</span>
                  </div>
                )}
                {event.teamName && (
                  <div className="mt-1">
                    <Badge variant="outline" className="border-primary/20 text-primary">
                      {event.teamName}
                    </Badge>
                  </div>
                )}
              </div>

              {event.description && (
                <p className="text-sm text-muted-foreground/80">{event.description}</p>
              )}
            </div>

            {/* RSVP summary */}
            <div className="w-full rounded-lg bg-secondary/30 p-4 sm:w-56">
              <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Přehled RSVP</div>
              <RsvpBar summary={event.rsvpSummary} className="mb-3" />
              <div className="grid grid-cols-4 gap-1 text-center text-xs">
                <div>
                  <div className="text-lg font-bold text-green-500">{event.rsvpSummary.yes}</div>
                  <div className="text-muted-foreground">Ano</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-500">{event.rsvpSummary.maybe}</div>
                  <div className="text-muted-foreground">Možná</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-500">{event.rsvpSummary.no}</div>
                  <div className="text-muted-foreground">Ne</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-muted-foreground">{event.rsvpSummary.pending}</div>
                  <div className="text-muted-foreground">Čeká</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training plan — only for PRACTICE events */}
      {event.type === 'PRACTICE' && (
        <TrainingPlanSection
          eventId={eventId}
          description={event.description ?? ''}
          isCoachOrAdmin={!!isCoachOrAdmin}
          drillPickerOpen={drillPickerOpen}
          setDrillPickerOpen={setDrillPickerOpen}
          onDescriptionUpdate={(newDesc) => {
            queryClient.setQueryData(['event', eventId, auth.clubId], (old: EventDetail | undefined) =>
              old ? { ...old, description: newDesc } : old
            );
            queryClient.invalidateQueries({ queryKey: ['event', eventId] });
          }}
        />
      )}

      {/* Roster table */}
      <Card className="overflow-hidden ">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">
            Docházka ({event.attendees.length} členů)
          </CardTitle>
          <div className="flex gap-2">
            {/* Bulk RSVP — for coaches, future events */}
            {isCoachOrAdmin && !past && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={rsvpMutation.isPending}
                  onClick={() => {
                    const pending = event.attendees.filter(a => a.status === 'PENDING');
                    if (pending.length === 0) return;
                    Promise.all(pending.map(a =>
                      apiFetch(`/events/${eventId}/rsvp`, {
                        method: 'POST',
                        body: JSON.stringify({ memberId: a.memberId, eventId, status: 'YES' }),
                      })
                    )).then(() => queryClient.invalidateQueries({ queryKey: ['event', eventId] }));
                  }}
                >
                  <CheckCheck className="mr-1 h-3 w-3" />
                  Vše ANO
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  disabled={rsvpMutation.isPending}
                  onClick={() => {
                    const pending = event.attendees.filter(a => a.status === 'PENDING');
                    if (pending.length === 0) return;
                    Promise.all(pending.map(a =>
                      apiFetch(`/events/${eventId}/rsvp`, {
                        method: 'POST',
                        body: JSON.stringify({ memberId: a.memberId, eventId, status: 'NO' }),
                      })
                    )).then(() => queryClient.invalidateQueries({ queryKey: ['event', eventId] }));
                  }}
                >
                  <X className="mr-1 h-3 w-3" />
                  Vše NE
                </Button>
              </>
            )}
            {/* Bulk attendance — for coaches, past events */}
            {isCoachOrAdmin && past && (
              <Button
                variant="default"
                size="sm"
                className="h-7 text-xs"
                disabled={attendanceMutation.isPending || Object.keys(bulkAttendance).length === 0}
                onClick={() => {
                  const entries = Object.entries(bulkAttendance).map(([memberId, attended]) => ({ memberId, attended }));
                  if (entries.length > 0) {
                    attendanceMutation.mutate(entries, {
                      onSuccess: () => setBulkAttendance({}),
                    });
                  }
                }}
              >
                <Check className="mr-1 h-3 w-3" />
                Uložit docházku ({Object.keys(bulkAttendance).length})
              </Button>
            )}
          </div>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-[11px] uppercase tracking-wider">Člen</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider">Stav</TableHead>
              <TableHead className="text-[11px] uppercase tracking-wider">Poznámka</TableHead>
              {past && <TableHead className="text-[11px] uppercase tracking-wider">Účast</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {event.attendees.map((a) => (
              <TableRow key={a.memberId} className="border-border/30">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                        {a.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{a.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={RSVP_VARIANT[a.status] ?? 'default'} className="text-[11px]">
                    {a.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {a.note ?? '--'}
                </TableCell>
                {past && (
                  <TableCell>
                    {a.attended != null && !(a.memberId in bulkAttendance) ? (
                      <Badge variant={a.attended ? 'success' : 'danger'} className="text-[11px]">
                        {a.attended ? 'Ano' : 'Ne'}
                      </Badge>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                            bulkAttendance[a.memberId] === true
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : 'text-muted-foreground hover:text-emerald-500'
                          }`}
                          onClick={() => setBulkAttendance(prev => ({ ...prev, [a.memberId]: true }))}
                        >
                          ✓
                        </button>
                        <button
                          className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                            bulkAttendance[a.memberId] === false
                              ? 'bg-red-500/20 text-red-500'
                              : 'text-muted-foreground hover:text-red-500'
                          }`}
                          onClick={() => setBulkAttendance(prev => ({ ...prev, [a.memberId]: false }))}
                        >
                          ✗
                        </button>
                      </div>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
