'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Clock, MapPin, User, ExternalLink } from 'lucide-react';
import { PageHeader } from '@/components/admin/page-header';
import { RsvpBar } from '@/components/admin/rsvp-bar';
import { apiFetch, ApiError, type EventDetail } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EVENT_TYPE_VARIANT, RSVP_VARIANT } from '@/lib/role-colors';

function formatDateTime(d: string): string {
  return new Date(d).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function isPast(d: string): boolean {
  return new Date(d) < new Date();
}

export default function EventDetailPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const auth = useAuth();
  const queryClient = useQueryClient();

  const { data: event, isLoading, isError } = useQuery<EventDetail, ApiError>({
    queryKey: ['event', eventId, auth.clubId],
    queryFn: () => apiFetch<EventDetail>(`/events/${eventId}`),
    enabled: auth.isAuthenticated && !!auth.clubId && !!eventId,
    retry: false,
  });

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

  if (isLoading) {
    return (
      <>
        <PageHeader title="Event" />
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
          title="Event"
          actions={
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/events"><ChevronLeft className="mr-1 h-4 w-4" />Back</Link>
            </Button>
          }
        />
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">Failed to load event</CardContent>
        </Card>
      </>
    );
  }

  const past = isPast(event.endsAt);

  return (
    <>
      <PageHeader
        title={event.title}
        subtitle={`Created by ${event.createdBy}`}
        actions={
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/events"><ChevronLeft className="mr-1 h-4 w-4" />Back to events</Link>
          </Button>
        }
      />

      {/* Hero */}
      <Card className="relative overflow-hidden gradient-card">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-cyan-500/[0.02]" />
        <CardContent className="relative p-6">
          <div className="flex flex-wrap items-start gap-4">
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant={EVENT_TYPE_VARIANT[event.type] ?? 'default'} className="text-xs">
                  {event.type}
                </Badge>
                {event.homeAway && (
                  <Badge variant="outline" className="text-[10px]">{event.homeAway}</Badge>
                )}
                {past && <Badge variant="outline" className="text-[10px] text-muted-foreground">PAST</Badge>}
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
              <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">RSVP Summary</div>
              <RsvpBar summary={event.rsvpSummary} className="mb-3" />
              <div className="grid grid-cols-4 gap-1 text-center text-xs">
                <div>
                  <div className="text-lg font-bold text-green-500">{event.rsvpSummary.yes}</div>
                  <div className="text-muted-foreground">Yes</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-yellow-500">{event.rsvpSummary.maybe}</div>
                  <div className="text-muted-foreground">Maybe</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-500">{event.rsvpSummary.no}</div>
                  <div className="text-muted-foreground">No</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-muted-foreground">{event.rsvpSummary.pending}</div>
                  <div className="text-muted-foreground">Pending</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster table */}
      <Card className="overflow-hidden gradient-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">
            Attendance Roster ({event.attendees.length} members)
          </CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="text-[10px] uppercase tracking-wider">Member</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider">Note</TableHead>
              {past && <TableHead className="text-[10px] uppercase tracking-wider">Attended</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {event.attendees.map((a) => (
              <TableRow key={a.memberId} className="border-border/30">
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary/10 text-[10px] font-semibold text-primary">
                        {a.name.split(' ').map((n) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{a.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={RSVP_VARIANT[a.status] ?? 'default'} className="text-[10px]">
                    {a.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {a.note ?? '--'}
                </TableCell>
                {past && (
                  <TableCell>
                    {a.attended != null ? (
                      <Badge variant={a.attended ? 'success' : 'danger'} className="text-[10px]">
                        {a.attended ? 'Yes' : 'No'}
                      </Badge>
                    ) : (
                      <button
                        className="text-xs text-primary hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          attendanceMutation.mutate([{ memberId: a.memberId, attended: true }]);
                        }}
                      >
                        Mark present
                      </button>
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
