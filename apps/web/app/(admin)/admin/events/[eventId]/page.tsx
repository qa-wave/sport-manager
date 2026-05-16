'use client';

import { useState, type FormEvent } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Calendar,
  Car,
  Check,
  ChevronLeft,
  Copy,
  MessageSquare,
  Pencil,
  Plus,
  QrCode,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { googleCalendarUrl, outlookCalendarUrl, downloadICal } from '@/lib/ical';
import { PageHeader } from '@/components/admin/page-header';
import { apiFetch, ApiError, type EventDetail, type TeamSummary, type AiEventSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { useMemberContext } from '@/lib/member-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LineupBuilder } from '@/components/admin/lineup-builder';
import { EventHero } from '@/components/admin/event/event-hero';
import { EventRsvpWidget } from '@/components/admin/event/event-rsvp-widget';
import { EventAttendanceTab } from '@/components/admin/event/event-attendance-tab';
import { EventEditSheet, type EventEditFormState } from '@/components/admin/event/event-edit-sheet';

const EventDrillsTab = dynamic(
  () => import('@/components/admin/event/event-drills-tab').then((m) => m.EventDrillsTab),
  { ssr: false },
);
const EventStatsTab = dynamic(
  () => import('@/components/admin/event/event-stats-tab').then((m) => m.EventStatsTab),
  { ssr: false },
);
const EventCarpoolTab = dynamic(
  () => import('@/components/admin/event/event-carpool-tab').then((m) => m.EventCarpoolTab),
  { ssr: false },
);
const PollsSection = dynamic(
  () => import('@/components/admin/polls-section').then((m) => m.PollsSection),
  { ssr: false },
);

// ─── Helpers ───

function toLocalDatetimeValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isPast(d: string): boolean {
  return new Date(d) < new Date();
}

// ─── AI Summary Card ───

function AiSummaryCard({ eventId, isVisible }: { eventId: string; isVisible: boolean }) {
  const auth = useAuth();
  const { data, isLoading, isError } = useQuery<AiEventSummary>({
    queryKey: ['event-summary', eventId, auth.clubId],
    queryFn: () => apiFetch<AiEventSummary>(`/events/${eventId}/summary`),
    enabled: isVisible && auth.isAuthenticated && !!auth.clubId && !!eventId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold">AI shrnutí</span>
          </div>
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) return null;

  const { summary, highlights, stats } = data;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.03] via-transparent to-cyan-500/[0.02]">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold">AI shrnutí</div>
            <div className="text-[11px] text-muted-foreground">
              Automaticky vygenerováno z dat události
            </div>
          </div>
        </div>
        <p className="mb-4 text-sm leading-relaxed text-foreground/80">{summary}</p>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-center">
            <div className="text-xl font-bold text-emerald-500">{stats.attended}</div>
            <div className="text-[10px] text-muted-foreground">Přítomno</div>
          </div>
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-center">
            <div className="text-xl font-bold text-red-500">{stats.absent}</div>
            <div className="text-[10px] text-muted-foreground">Nepřítomno</div>
          </div>
          <div className="rounded-lg bg-primary/10 px-3 py-2 text-center">
            <div className="text-xl font-bold text-primary">{stats.attendanceRate} %</div>
            <div className="text-[10px] text-muted-foreground">Docházka</div>
          </div>
          {stats.absentWithoutExcuse > 0 ? (
            <div className="rounded-lg bg-amber-500/10 px-3 py-2 text-center">
              <div className="text-xl font-bold text-amber-500">{stats.absentWithoutExcuse}</div>
              <div className="text-[10px] text-muted-foreground">Neomluveno</div>
            </div>
          ) : (
            <div className="rounded-lg bg-secondary/50 px-3 py-2 text-center">
              <div className="text-xl font-bold text-muted-foreground">{stats.rsvpYes}</div>
              <div className="text-[10px] text-muted-foreground">RSVP Ano</div>
            </div>
          )}
        </div>
        {highlights.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {highlights.map((h, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary"
              >
                {h}
              </span>
            ))}
          </div>
        )}
        {stats.scorers && stats.scorers.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Střelci
            </div>
            {stats.scorers.map((s, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-md bg-muted/30 px-3 py-1.5 text-xs"
              >
                <span className="font-medium">{s.name}</span>
                <span className="text-muted-foreground">
                  {s.goals > 0 && `${s.goals} gól${s.goals > 1 ? 'y' : ''}`}
                  {s.goals > 0 && s.assists > 0 && ', '}
                  {s.assists > 0 && `${s.assists} asistence`}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Per-Event Fee Section ───

const FEE_MARKER_RE = /<!--\s*fee:\s*(\{.*?\})\s*-->/s;

interface FeeData {
  amount: number;
  currency: string;
}

function parseFeeMarker(description: string | null | undefined): FeeData | null {
  if (!description) return null;
  const match = FEE_MARKER_RE.exec(description);
  if (!match || !match[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

function updateFeeMarker(description: string | null | undefined, fee: FeeData | null): string {
  const base = description ?? '';
  if (!fee) {
    return base.replace(/\n\n<!--\s*fee:.*?-->/s, '').replace(/<!--\s*fee:.*?-->\n?\n?/s, '');
  }
  const marker = `<!-- fee: ${JSON.stringify(fee)} -->`;
  if (FEE_MARKER_RE.test(base)) {
    return base.replace(FEE_MARKER_RE, marker);
  }
  return base ? `${base}\n\n${marker}` : marker;
}

function EventFeeSection({
  eventId,
  description,
  isCoachOrAdmin,
  onDescriptionUpdate,
}: {
  eventId: string;
  description: string | null | undefined;
  isCoachOrAdmin: boolean;
  onDescriptionUpdate: (newDesc: string) => void;
}) {
  const queryClient = useQueryClient();
  const fee = parseFeeMarker(description);
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  const feeMutation = useMutation({
    mutationFn: (newDesc: string) =>
      apiFetch(`/events/${eventId}`, {
        method: 'PATCH',
        body: JSON.stringify({ description: newDesc }),
      }),
    onSuccess: (_data, newDesc) => {
      onDescriptionUpdate(newDesc);
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  function saveFee(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseInt(amount, 10);
    if (isNaN(parsed) || parsed <= 0) return;
    const newFee: FeeData = { amount: parsed, currency: 'CZK' };
    feeMutation.mutate(updateFeeMarker(description, newFee));
  }

  async function handlePay() {
    if (!fee) return;
    setPayLoading(true);
    try {
      const data = await apiFetch<{ url: string }>('/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({
          feeName: `Poplatek za událost`,
          amountCents: fee.amount * 100,
          currency: fee.currency,
          metadata: { eventId },
        }),
      });
      if (data.url) window.location.href = data.url;
    } catch {
      // stripe may not be configured in dev
    } finally {
      setPayLoading(false);
    }
  }

  if (!fee && !isCoachOrAdmin) return null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <span className="text-base">💳</span>
          Poplatek za účast
        </CardTitle>
        {isCoachOrAdmin && fee && !editing && (
          <div className="flex gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => {
                setAmount(String(fee.amount));
                setEditing(true);
              }}
            >
              Upravit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => feeMutation.mutate(updateFeeMarker(description, null))}
              disabled={feeMutation.isPending}
            >
              Odebrat
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="pb-5 pt-0">
        {editing ? (
          <form onSubmit={saveFee} className="flex items-end gap-2">
            <div className="space-y-1 flex-1">
              <label htmlFor="fee-amount" className="text-xs font-medium text-muted-foreground">
                Částka (CZK)
              </label>
              <Input
                id="fee-amount"
                type="number"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                className="h-8 text-sm"
                autoFocus
              />
            </div>
            <Button type="submit" size="sm" className="h-8" disabled={feeMutation.isPending}>
              Uložit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => setEditing(false)}
            >
              Zrušit
            </Button>
          </form>
        ) : fee ? (
          <div className="flex items-center justify-between gap-3 rounded-lg bg-secondary/40 px-4 py-3">
            <div>
              <div className="text-2xl font-bold tabular-nums">{fee.amount} Kč</div>
              <div className="text-xs text-muted-foreground">za účast na události</div>
            </div>
            <Button size="sm" onClick={handlePay} disabled={payLoading}>
              {payLoading ? 'Přesměrovávám...' : `Zaplatit ${fee.amount} Kč`}
            </Button>
          </div>
        ) : isCoachOrAdmin ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">Žádný poplatek nastaven.</p>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs"
              onClick={() => {
                setAmount('');
                setEditing(true);
              }}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Přidat poplatek
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ─── Carpool Section ───

function parseCarpoolEntries(attendees: EventDetail['attendees']): {
  offers: Array<{ name: string; note: string }>;
  requests: Array<{ name: string; note: string }>;
} {
  const offers: Array<{ name: string; note: string }> = [];
  const requests: Array<{ name: string; note: string }> = [];
  for (const a of attendees) {
    if (!a.note?.startsWith('🚗')) continue;
    if (a.note.includes('Nabízím')) {
      offers.push({ name: a.name, note: a.note.replace('🚗 ', '') });
    } else if (a.note.includes('Potřebuji')) {
      requests.push({ name: a.name, note: a.note.replace('🚗 ', '') });
    }
  }
  return { offers, requests };
}

function CarpoolSection({
  event,
  memberCtx,
  onCarpool,
  isSaving,
}: {
  event: EventDetail;
  memberCtx: ReturnType<typeof useMemberContext>['data'];
  onCarpool: (args: { type: 'offer' | 'request' | 'none'; seats?: number; note?: string }) => void;
  isSaving: boolean;
}) {
  const [mode, setMode] = useState<'offer' | 'request' | 'none'>('none');
  const [seats, setSeats] = useState(2);
  const [note, setNote] = useState('');

  const { offers, requests } = parseCarpoolEntries(event.attendees);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm">Doprava</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {offers.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Nabídky míst</p>
            <div className="space-y-1.5">
              {offers.map((o, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-500/5 px-3 py-2"
                >
                  <Car className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="text-xs font-medium">{o.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">{o.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {requests.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Potřebují svézt</p>
            <div className="space-y-1.5">
              {requests.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-500/5 px-3 py-2"
                >
                  <User className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="text-xs font-medium">{r.name}</span>
                  <span className="text-xs text-muted-foreground ml-1">{r.note}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {offers.length === 0 && requests.length === 0 && (
          <p className="text-xs text-muted-foreground">Zatím žádné nabídky dopravy.</p>
        )}

        {memberCtx && (
          <div className="border-t border-border/30 pt-4">
            <p className="mb-2 text-xs font-medium">Moje doprava</p>
            <div className="flex flex-wrap gap-2">
              {(['offer', 'request', 'none'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMode(t)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    mode === t
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t === 'offer' ? 'Nabízím místa' : t === 'request' ? 'Potřebuji svézt' : 'Nic'}
                </button>
              ))}
            </div>
            {mode === 'offer' && (
              <div className="mt-3 flex items-center gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Počet míst</label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="h-8 w-20 text-sm"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">
                    Místo odjezdu
                  </label>
                  <Input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Jedu z Prahy 6..."
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
            {mode === 'request' && (
              <div className="mt-3">
                <label className="text-xs font-medium text-muted-foreground">Poznámka</label>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Kde mě vyzvednout..."
                  className="mt-1 h-8 text-sm"
                />
              </div>
            )}
            {mode !== 'none' && (
              <Button
                size="sm"
                className="mt-3 h-7 text-xs"
                onClick={() =>
                  onCarpool({
                    type: mode,
                    seats: mode === 'offer' ? seats : undefined,
                    note: note || undefined,
                  })
                }
                disabled={isSaving}
              >
                {isSaving ? 'Ukládám...' : 'Uložit'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Parse helpers ───

function parseComments(
  description: string,
): Array<{ id: string; authorId: string; author: string; text: string; at: string }> {
  const match = /<!--\s*comments:\s*([\s\S]*?)\s*-->/.exec(description);
  if (!match || !match[1]) return [];
  try {
    return JSON.parse(match[1]) as ReturnType<typeof parseComments>;
  } catch {
    return [];
  }
}

// ─── Main page ───

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const auth = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: memberCtx } = useMemberContext();

  const [bulkAttendance, setBulkAttendance] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [bulkRsvpConfirm, setBulkRsvpConfirm] = useState<'YES' | 'NO' | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCopied, setQrCopied] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const [editForm, setEditForm] = useState<EventEditFormState>({
    type: '',
    title: '',
    teamId: '',
    startsAt: '',
    endsAt: '',
    location: '',
    opponent: '',
    homeAway: '',
    description: '',
  });

  const isCoachOrAdmin =
    memberCtx &&
    (memberCtx.clubRoles.includes('OWNER') ||
      memberCtx.clubRoles.includes('ADMIN') ||
      memberCtx.teamRoles.some((tr) =>
        ['HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'].includes(tr.role),
      ));

  const isGuardian =
    memberCtx &&
    !isCoachOrAdmin &&
    memberCtx.guardianOf.length > 0;

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
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch(`/events/${eventId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      setIsEditing(false);
      setEditError(null);
    },
    onError: (err: ApiError) => setEditError(err?.message ?? 'Nepodařilo se uložit změny'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/events/${eventId}`, { method: 'DELETE' }),
    onSuccess: () => router.push('/admin/events'),
  });

  const rsvpMutation = useMutation({
    mutationFn: (args: { memberId: string; status: string; note?: string; reason?: 'ILLNESS' | 'SCHOOL' | 'FAMILY' | 'OTHER' }) =>
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

  const carpoolMutation = useMutation({
    mutationFn: (args: { type: 'offer' | 'request' | 'none'; seats?: number; note?: string }) =>
      apiFetch(`/events/${eventId}/carpool`, {
        method: 'PATCH',
        body: JSON.stringify(args),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
  });

  const statsMutation = useMutation({
    mutationFn: (
      stats: Array<{
        memberId: string;
        goals: number;
        assists: number;
        yellowCards: number;
        redCards: number;
      }>,
    ) =>
      apiFetch(`/events/${eventId}/stats`, {
        method: 'PATCH',
        body: JSON.stringify({ stats }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event', eventId] }),
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) =>
      apiFetch(`/events/${eventId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      }),
    onSuccess: () => {
      setCommentText('');
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  function openEditForm() {
    if (!event) return;
    setEditForm({
      type: event.type,
      title: event.title,
      teamId: event.teamId ?? '',
      startsAt: toLocalDatetimeValue(event.startsAt),
      endsAt: toLocalDatetimeValue(event.endsAt),
      location: event.location ?? '',
      opponent: event.opponent ?? '',
      homeAway: event.homeAway ?? '',
      description: event.description ?? '',
    });
    setEditError(null);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    setEditError(null);
    if (!editForm.title.trim() || !editForm.startsAt || !editForm.endsAt) {
      setEditError('Název, začátek a konec jsou povinné.');
      return;
    }
    updateMutation.mutate({
      type: editForm.type,
      title: editForm.title.trim(),
      startsAt: new Date(editForm.startsAt).toISOString(),
      endsAt: new Date(editForm.endsAt).toISOString(),
      teamId: editForm.teamId || null,
      location: editForm.location.trim() || null,
      opponent: editForm.opponent.trim() || null,
      homeAway: editForm.homeAway || null,
      description: editForm.description.trim() || null,
    });
  }

  async function generateQrToken() {
    if (!eventId) return;
    setQrLoading(true);
    try {
      const data = await apiFetch<{ url: string }>(`/events/${eventId}/qr-token`, {
        method: 'POST',
      });
      setQrUrl(data.url);
    } catch {
      // silently ignore
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

  function handleDescriptionUpdate(newDesc: string) {
    queryClient.setQueryData(['event', eventId, auth.clubId], (old: EventDetail | undefined) =>
      old ? { ...old, description: newDesc } : old,
    );
    queryClient.invalidateQueries({ queryKey: ['event', eventId] });
  }

  function handleBulkRsvpConfirm(status: 'YES' | 'NO') {
    const pending = event?.attendees.filter((a) => a.status === 'PENDING') ?? [];
    setBulkRsvpConfirm(null);
    Promise.all(
      pending.map((a) =>
        apiFetch(`/events/${eventId}/rsvp`, {
          method: 'POST',
          body: JSON.stringify({ memberId: a.memberId, eventId, status }),
        }),
      ),
    ).then(() => queryClient.invalidateQueries({ queryKey: ['event', eventId] }));
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Událost" />
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

  if (isError || !event) {
    return (
      <>
        <PageHeader
          title="Událost"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/events">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Zpět na události
              </Link>
            </Button>
          }
        />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Nepodařilo se načíst událost
          </CardContent>
        </Card>
      </>
    );
  }

  const past = isPast(event.endsAt);
  const isMatchOrTournament = event.type === 'MATCH' || event.type === 'TOURNAMENT';
  const myMemberId = memberCtx?.memberId;
  const myAttendee = myMemberId ? event.attendees.find((a) => a.memberId === myMemberId) : undefined;
  const myRsvp = myAttendee?.status ?? null;
  const rsvpDeadlinePassed =
    !!event.rsvpDeadline && new Date() > new Date(event.rsvpDeadline);

  const TABS = isMatchOrTournament
    ? [
        { id: 'overview', label: 'Přehled' },
        { id: 'attendance', label: 'Docházka' },
        { id: 'lineup', label: 'Sestava' },
        { id: 'result', label: 'Výsledek' },
        { id: 'carpool', label: 'Doprava' },
        { id: 'polls', label: 'Ankety' },
        { id: 'discussion', label: 'Diskuze' },
      ]
    : [
        { id: 'overview', label: 'Přehled' },
        { id: 'attendance', label: 'Docházka' },
        { id: 'plan', label: 'Plán' },
        { id: 'polls', label: 'Ankety' },
        { id: 'discussion', label: 'Diskuze' },
      ];

  return (
    <>
      <PageHeader
        title={event.title}
        subtitle={`Vytvořil/a ${event.createdBy}`}
        actions={
          <div className="flex items-center gap-2">
            {isCoachOrAdmin && !isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateQrToken}
                  disabled={qrLoading}
                >
                  <QrCode className="mr-1.5 h-3.5 w-3.5" />
                  {qrLoading ? 'Generuji...' : 'QR Docházka'}
                </Button>
                <Button variant="outline" size="sm" onClick={openEditForm}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" />
                  Upravit
                </Button>
                {!deleteConfirm ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteConfirm(true)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Smazat
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
              <Link href="/admin/events">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Zpět na události
              </Link>
            </Button>
          </div>
        }
      />

      {/* Edit sheet */}
      <EventEditSheet
        open={isEditing}
        onOpenChange={(open) => {
          setIsEditing(open);
          if (!open) setEditError(null);
        }}
        formState={editForm}
        onFormChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
        onSubmit={handleEditSubmit}
        teams={teams}
        isPending={updateMutation.isPending}
        error={editError}
      />

      {/* Hero card */}
      <EventHero event={event} past={past} />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-lg bg-muted p-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Přehled ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {myMemberId && !past && (
            <EventRsvpWidget
              myRsvp={myRsvp}
              rsvpDeadlinePassed={rsvpDeadlinePassed}
              isPending={rsvpMutation.isPending}
              isGuardian={!!isGuardian}
              onRsvp={(status, reason) => rsvpMutation.mutate({ memberId: myMemberId, status, reason })}
            />
          )}

          {event.description && (
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground/80 whitespace-pre-wrap">
                  {event.description}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Calendar export */}
          <Card>
            <CardContent className="p-5">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Přidat do kalendáře
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href={googleCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Calendar className="h-3 w-3" />
                  Google Calendar
                </a>
                <a
                  href={outlookCalendarUrl(event)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Calendar className="h-3 w-3" />
                  Outlook
                </a>
                <button
                  onClick={() => downloadICal([event], `${event.title}.ics`)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/50 px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Calendar className="h-3 w-3" />
                  Stáhnout .ics
                </button>
              </div>
            </CardContent>
          </Card>

          {past && <AiSummaryCard eventId={eventId} isVisible={activeTab === 'overview'} />}

          <EventFeeSection
            eventId={eventId}
            description={event.description}
            isCoachOrAdmin={!!isCoachOrAdmin}
            onDescriptionUpdate={handleDescriptionUpdate}
          />

          {qrUrl && (
            <Card className="border-primary/20 bg-primary/[0.02]">
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold">QR kód pro docházku</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setQrUrl(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Hráči naskenují tento odkaz při příchodu. Kód je platný po dobu trvání události.
                </p>
                <div className="flex justify-center rounded-lg border border-border/50 bg-white p-4">
                  <QRCodeSVG value={qrUrl} size={200} />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="min-w-0 flex-1 rounded-lg border border-border/50 bg-background px-3 py-2 font-mono text-xs break-all text-muted-foreground">
                    {qrUrl}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 text-xs"
                    onClick={copyQrUrl}
                  >
                    {qrCopied ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5 text-green-500" />
                        Zkopírováno
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Kopírovat odkaz
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: Docházka ── */}
      {activeTab === 'attendance' && (
        <EventAttendanceTab
          event={event}
          eventId={eventId}
          past={past}
          isCoachOrAdmin={!!isCoachOrAdmin}
          bulkAttendance={bulkAttendance}
          bulkRsvpConfirm={bulkRsvpConfirm}
          rsvpIsPending={rsvpMutation.isPending}
          attendanceIsPending={attendanceMutation.isPending}
          onSetBulkAttendance={setBulkAttendance}
          onSetBulkRsvpConfirm={setBulkRsvpConfirm}
          onSaveAttendance={(entries) => {
            attendanceMutation.mutate(entries, {
              onSuccess: () => setBulkAttendance({}),
            });
          }}
          onBulkRsvpConfirm={handleBulkRsvpConfirm}
        />
      )}

      {/* ── Tab: Plán (PRACTICE only) ── */}
      {activeTab === 'plan' && event.type === 'PRACTICE' && (
        <div className="space-y-4">
          <EventDrillsTab
            eventId={eventId}
            description={event.description ?? ''}
            isCoachOrAdmin={!!isCoachOrAdmin}
            onDescriptionUpdate={handleDescriptionUpdate}
          />
          <CarpoolSection
            event={event}
            memberCtx={memberCtx}
            onCarpool={(args) => carpoolMutation.mutate(args)}
            isSaving={carpoolMutation.isPending}
          />
        </div>
      )}

      {/* ── Tab: Sestava (MATCH/TOURNAMENT only) ── */}
      {activeTab === 'lineup' && isMatchOrTournament && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardContent className="p-5">
              <LineupBuilder
                eventId={eventId}
                description={event.description ?? ''}
                isCoachOrAdmin={!!isCoachOrAdmin}
                players={event.attendees
                  .filter((a) => a.status === 'YES' || event.attendees.length < 6)
                  .map((a) => ({ memberId: a.memberId, name: a.name }))}
                onDescriptionUpdate={(newDesc) => {
                  queryClient.setQueryData(
                    ['event', eventId, auth.clubId],
                    (old: EventDetail | undefined) =>
                      old ? { ...old, description: newDesc } : old,
                  );
                  queryClient.invalidateQueries({ queryKey: ['event', eventId] });
                }}
                isSaving={false}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Tab: Výsledek (MATCH/TOURNAMENT only) ── */}
      {activeTab === 'result' && isMatchOrTournament && (
        <EventStatsTab
          event={event}
          isCoachOrAdmin={!!isCoachOrAdmin}
          onSaveStats={(stats) => statsMutation.mutate(stats)}
          isSaving={statsMutation.isPending}
          onDescriptionUpdate={handleDescriptionUpdate}
        />
      )}

      {/* ── Tab: Doprava (MATCH/TOURNAMENT only) ── */}
      {activeTab === 'carpool' && isMatchOrTournament && (
        <EventCarpoolTab
          eventId={eventId}
          myMemberId={myMemberId}
          isCoachOrAdmin={!!isCoachOrAdmin}
          attendeesCount={event.attendees.length}
        />
      )}

      {/* ── Tab: Ankety ── */}
      {activeTab === 'polls' && auth.clubId && myMemberId && (
        <PollsSection
          clubId={auth.clubId}
          memberId={myMemberId}
          canManage={!!isCoachOrAdmin}
        />
      )}

      {/* ── Tab: Diskuze ── */}
      {activeTab === 'discussion' && (
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">Diskuze</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              {parseComments(event.description ?? '').length === 0 ? (
                <p className="text-xs text-muted-foreground">Zatím žádné komentáře.</p>
              ) : (
                <div className="space-y-3">
                  {parseComments(event.description ?? '').map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                        {c.author
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-semibold">{c.author}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(c.at).toLocaleString('cs-CZ', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground/80 break-words">
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Napište komentář..."
                  className="h-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && commentText.trim()) {
                      e.preventDefault();
                      commentMutation.mutate(commentText.trim());
                    }
                  }}
                />
                <Button
                  size="sm"
                  className="h-8 shrink-0"
                  disabled={!commentText.trim() || commentMutation.isPending}
                  onClick={() => commentMutation.mutate(commentText.trim())}
                >
                  {commentMutation.isPending ? '...' : 'Přidat'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {isMatchOrTournament && (
            <CarpoolSection
              event={event}
              memberCtx={memberCtx}
              onCarpool={(args) => carpoolMutation.mutate(args)}
              isSaving={carpoolMutation.isPending}
            />
          )}
        </div>
      )}
    </>
  );
}
