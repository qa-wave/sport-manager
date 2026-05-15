'use client';

import { Calendar, Clock, ExternalLink, MapPin, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RsvpBar } from '@/components/admin/rsvp-bar';
import { EventMap } from '@/components/admin/event-map';
import { EVENT_TYPE_LABEL } from '@/lib/event-labels';
import { EVENT_TYPE_VARIANT } from '@/lib/role-colors';
import type { EventDetail } from '@/lib/api';
import { RsvpDeadlineBadge } from './rsvp-deadline-badge';

interface EventHeroProps {
  event: EventDetail;
  past: boolean;
}

function formatDateTime(d: string): string {
  return new Date(d).toLocaleDateString('cs-CZ', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTime(d: string): string {
  return new Date(d).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

export function EventHero({ event, past }: EventHeroProps) {
  return (
    <Card className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-cyan-500/[0.02]" />
      <CardContent className="relative p-6">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={EVENT_TYPE_VARIANT[event.type] ?? 'default'} className="text-xs">
                {EVENT_TYPE_LABEL[event.type] ?? event.type}
              </Badge>
              {event.homeAway && (
                <Badge variant="outline" className="text-[11px]">{event.homeAway}</Badge>
              )}
              {past && (
                <Badge variant="outline" className="text-[11px] text-muted-foreground">MINULÉ</Badge>
              )}
              {event.rsvpDeadline && !past && (
                <RsvpDeadlineBadge deadline={event.rsvpDeadline} />
              )}
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
                    <a
                      href={event.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
              {event.location && (
                <EventMap location={event.location} height={200} className="mt-2" />
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
          </div>

          {/* RSVP summary */}
          <div className="w-full rounded-lg bg-secondary/30 p-4 sm:w-56">
            <div className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Přehled RSVP
            </div>
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
                <div className="text-lg font-bold text-muted-foreground">
                  {event.rsvpSummary.pending}
                </div>
                <div className="text-muted-foreground">Čeká</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
