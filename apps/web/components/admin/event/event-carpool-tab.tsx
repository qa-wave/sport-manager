'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Car, MapPin, Clock, Plus, UserPlus, UserMinus, Trash2, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// ─── Types ───

interface CarpoolOffer {
  id: string;
  memberId: string;
  memberName: string;
  seats: number;
  takenSeats: string[];
  departureTime: string;
  departureLocation: string;
  note?: string;
}

// ─── Offer form ───

interface OfferFormState {
  seats: string;
  departureTime: string;
  departureLocation: string;
  note: string;
}

const DEFAULT_FORM: OfferFormState = {
  seats: '3',
  departureTime: '',
  departureLocation: '',
  note: '',
};

// ─── Helpers ───

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function freeSeats(offer: CarpoolOffer): number {
  return Math.max(0, offer.seats - offer.takenSeats.length);
}

// ─── Offer card ───

interface OfferCardProps {
  offer: CarpoolOffer;
  myMemberId: string | undefined;
  isCoachOrAdmin: boolean;
  onJoin: (offerId: string) => void;
  onLeave: (offerId: string) => void;
  onDelete: (offerId: string) => void;
  isPending: boolean;
}

function OfferCard({
  offer,
  myMemberId,
  isCoachOrAdmin,
  onJoin,
  onLeave,
  onDelete,
  isPending,
}: OfferCardProps) {
  const isDriver = offer.memberId === myMemberId;
  const hasJoined = myMemberId ? offer.takenSeats.includes(myMemberId) : false;
  const available = freeSeats(offer);
  const filledRatio = offer.takenSeats.length / offer.seats;

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Driver avatar */}
          <Avatar className="h-10 w-10 shrink-0 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials(offer.memberName)}
            </AvatarFallback>
          </Avatar>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold truncate">{offer.memberName}</span>
              {isDriver && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Vy
                </Badge>
              )}
              <Badge
                variant={available > 0 ? 'success' : 'danger'}
                className="text-[10px] px-1.5 py-0 ml-auto shrink-0"
              >
                {available > 0 ? `${available} volných míst` : 'Plně obsazeno'}
              </Badge>
            </div>

            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3 w-3 shrink-0" />
                <span>{offer.departureTime}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{offer.departureLocation}</span>
              </div>
              {offer.note && (
                <p className="text-xs text-muted-foreground/70 italic mt-1">{offer.note}</p>
              )}
            </div>

            {/* Seats progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">
                  {offer.takenSeats.length} / {offer.seats} míst obsazeno
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, filledRatio * 100)}%` }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="mt-3 flex items-center gap-2">
              {!isDriver && (
                <>
                  {hasJoined ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
                      onClick={() => onLeave(offer.id)}
                      disabled={isPending}
                    >
                      <UserMinus className="mr-1 h-3 w-3" />
                      Odhlásit se
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onJoin(offer.id)}
                      disabled={isPending || available === 0}
                    >
                      <UserPlus className="mr-1 h-3 w-3" />
                      Přidat se
                    </Button>
                  )}
                </>
              )}

              {(isDriver || isCoachOrAdmin) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 ml-auto"
                  onClick={() => onDelete(offer.id)}
                  disabled={isPending}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── New offer form ───

interface NewOfferFormProps {
  onSubmit: (data: Omit<CarpoolOffer, 'id' | 'memberId' | 'memberName' | 'takenSeats'>) => void;
  onCancel: () => void;
  isPending: boolean;
}

function NewOfferForm({ onSubmit, onCancel, isPending }: NewOfferFormProps) {
  const [form, setForm] = useState<OfferFormState>(DEFAULT_FORM);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const seats = parseInt(form.seats, 10);
    if (isNaN(seats) || seats < 1 || seats > 20) {
      setError('Počet míst musí být 1–20.');
      return;
    }
    if (!form.departureTime.trim()) {
      setError('Čas odjezdu je povinný.');
      return;
    }
    if (!form.departureLocation.trim()) {
      setError('Místo odjezdu je povinné.');
      return;
    }
    setError(null);
    onSubmit({
      seats,
      departureTime: form.departureTime.trim(),
      departureLocation: form.departureLocation.trim(),
      ...(form.note.trim() ? { note: form.note.trim() } : {}),
    });
  }

  return (
    <Card className="border-primary/20 bg-primary/[0.02]">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Car className="h-4 w-4 text-primary" />
          Nabídnout spolujízdu
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Počet volných míst</label>
              <Input
                type="number"
                min={1}
                max={20}
                value={form.seats}
                onChange={(e) => setForm((f) => ({ ...f, seats: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Čas odjezdu</label>
              <Input
                type="time"
                value={form.departureTime}
                onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Místo odjezdu</label>
            <Input
              value={form.departureLocation}
              onChange={(e) => setForm((f) => ({ ...f, departureLocation: e.target.value }))}
              placeholder="např. Metro Dejvická, parkoviště"
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Poznámka{' '}
              <span className="text-muted-foreground/60">(nepovinné)</span>
            </label>
            <Input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="Odjíždím v 9:30, prosím potvrdit den před..."
              className="h-8 text-sm"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <Button type="submit" size="sm" className="h-8 text-xs" disabled={isPending}>
              {isPending ? 'Ukládám...' : 'Nabídnout'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={onCancel}
            >
              Zrušit
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───

interface EventCarpoolTabProps {
  eventId: string;
  myMemberId: string | undefined;
  isCoachOrAdmin: boolean;
  attendeesCount: number;
}

export function EventCarpoolTab({
  eventId,
  myMemberId,
  isCoachOrAdmin,
  attendeesCount,
}: EventCarpoolTabProps) {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data: offers = [], isLoading } = useQuery<CarpoolOffer[]>({
    queryKey: ['carpool', eventId, auth.clubId],
    queryFn: () => apiFetch<CarpoolOffer[]>(`/events/${eventId}/carpool`),
    enabled: auth.isAuthenticated && !!auth.clubId && !!eventId,
    staleTime: 30_000,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['carpool', eventId] });

  const createMutation = useMutation({
    mutationFn: (
      data: Omit<CarpoolOffer, 'id' | 'memberId' | 'memberName' | 'takenSeats'>,
    ) => apiFetch(`/events/${eventId}/carpool`, { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      invalidate();
      setShowForm(false);
    },
  });

  const joinMutation = useMutation({
    mutationFn: (offerId: string) =>
      apiFetch(`/events/${eventId}/carpool/${offerId}/join`, { method: 'POST' }),
    onSuccess: invalidate,
  });

  const leaveMutation = useMutation({
    mutationFn: (offerId: string) =>
      apiFetch(`/events/${eventId}/carpool/${offerId}/leave`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (offerId: string) =>
      apiFetch(`/events/${eventId}/carpool/${offerId}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });

  const isMutating =
    createMutation.isPending ||
    joinMutation.isPending ||
    leaveMutation.isPending ||
    deleteMutation.isPending;

  // Stats: how many attendees have a seat (driver or passenger)
  const coveredMemberIds = new Set<string>();
  for (const offer of offers) {
    coveredMemberIds.add(offer.memberId);
    for (const passengerId of offer.takenSeats) {
      coveredMemberIds.add(passengerId);
    }
  }
  const coveredCount = coveredMemberIds.size;

  // Does the current user already have an offer?
  const myOffer = myMemberId ? offers.find((o) => o.memberId === myMemberId) : undefined;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      {attendeesCount > 0 && (
        <Card className="bg-muted/40">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {coveredCount} z {attendeesCount}{' '}
                {attendeesCount === 1
                  ? 'hráče'
                  : attendeesCount < 5
                    ? 'hráčů'
                    : 'hráčů'}{' '}
                má zajištěnou dopravu
              </p>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{
                    width: `${Math.min(100, (coveredCount / attendeesCount) * 100)}%`,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form toggle button */}
      {!showForm && !myOffer && (
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          className="w-full h-9 text-sm border-dashed"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nabídnout spolujízdu
        </Button>
      )}

      {/* Create form */}
      {showForm && (
        <NewOfferForm
          onSubmit={(data) => createMutation.mutate(data)}
          onCancel={() => setShowForm(false)}
          isPending={createMutation.isPending}
        />
      )}

      {/* Offers list */}
      {offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <Car className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Zatím žádné nabídky spolujízdy.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Nabídněte místo v autě spoluhráčům a rodičům!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {offers.map((offer) => (
            <OfferCard
              key={offer.id}
              offer={offer}
              myMemberId={myMemberId}
              isCoachOrAdmin={isCoachOrAdmin}
              onJoin={(id) => joinMutation.mutate(id)}
              onLeave={(id) => leaveMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
              isPending={isMutating}
            />
          ))}
        </div>
      )}
    </div>
  );
}
