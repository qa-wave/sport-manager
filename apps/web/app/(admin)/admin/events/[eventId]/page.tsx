'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, CheckCheck, ChevronLeft, Clock, Copy, MapPin, Pencil, QrCode, Trash2, User, ExternalLink, X } from 'lucide-react';
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

const EVENT_TYPES = ['PRACTICE', 'MATCH', 'TOURNAMENT', 'MEETING', 'SOCIAL'] as const;

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
