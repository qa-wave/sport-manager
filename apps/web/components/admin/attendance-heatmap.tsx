'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, ApiError, type AttendanceStatsResponse } from '@/lib/api';
import { useAuth } from '@/lib/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface AttendanceHeatmapProps {
  teamId: string;
}

/** Compact cell size for the heatmap grid */
const CELL = 'h-6 w-6 rounded-sm flex-shrink-0';

function HeatmapCell({
  attended,
  eventTitle,
  eventDate,
}: {
  attended: boolean | null;
  eventTitle: string;
  eventDate: string;
}) {
  const formatted = new Date(eventDate).toLocaleDateString('cs-CZ', {
    day: 'numeric',
    month: 'short',
  });

  let colorClass: string;
  let label: string;
  if (attended === true) {
    colorClass = 'bg-green-500';
    label = 'Zúčastnil se';
  } else if (attended === false) {
    colorClass = 'bg-red-500';
    label = 'Chybě';
  } else {
    colorClass = 'bg-muted';
    label = 'Bez záznamu';
  }

  return (
    <div
      className={`${CELL} ${colorClass} cursor-default transition-opacity hover:opacity-70`}
      title={`${eventTitle} · ${formatted} · ${label}`}
    />
  );
}

function LoadingSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <Skeleton className="h-4 w-52" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-4 w-28" />
            <div className="flex gap-1">
              {Array.from({ length: 10 }).map((_, j) => (
                <Skeleton key={j} className="h-6 w-6 rounded-sm" />
              ))}
            </div>
            <Skeleton className="ml-auto h-4 w-10" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function AttendanceHeatmap({ teamId }: AttendanceHeatmapProps) {
  const auth = useAuth();

  const { data, isLoading, isError } = useQuery<AttendanceStatsResponse, ApiError>({
    queryKey: ['team-attendance-stats', teamId, auth.clubId],
    queryFn: () => apiFetch<AttendanceStatsResponse>(`/teams/${teamId}/attendance-stats`),
    enabled: auth.isAuthenticated && !!auth.clubId && !!teamId,
    retry: false,
    staleTime: 60_000,
  });

  if (isLoading) return <LoadingSkeleton />;

  if (isError || !data) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardContent className="p-4 text-sm text-destructive">
          Nepodařilo se načíst data o docházce.
        </CardContent>
      </Card>
    );
  }

  const { members, events } = data;

  if (events.length === 0 || members.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Docházka za poslední 3 měsíce</CardTitle>
        </CardHeader>
        <CardContent className="py-6 text-center text-xs text-muted-foreground">
          Za poslední 3 měsíce nebyly nalezeny žádné události tohoto týmu.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Docházka za poslední 3 měsíce</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto pb-4">
        {/* Event date headers */}
        <div className="mb-2 flex items-end gap-2 pl-[8.5rem]">
          {events.map((e) => (
            <div
              key={e.id}
              className="flex w-6 flex-shrink-0 flex-col items-center gap-0.5"
              title={e.title}
            >
              <span className="rotate-[-45deg] whitespace-nowrap text-[9px] leading-none text-muted-foreground">
                {new Date(e.date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' })}
              </span>
            </div>
          ))}
          {/* Spacer for percentage column */}
          <div className="w-10 flex-shrink-0" />
        </div>

        {/* Member rows */}
        <div className="space-y-1">
          {members.map((member) => (
            <div key={member.memberId} className="flex items-center gap-2">
              {/* Name */}
              <span
                className="w-32 flex-shrink-0 truncate text-right text-xs font-medium"
                title={member.name}
              >
                {member.name}
              </span>

              {/* Cells */}
              <div className="flex gap-1">
                {member.events.map((e) => (
                  <HeatmapCell
                    key={e.eventId}
                    attended={e.attended}
                    eventTitle={events.find((ev) => ev.id === e.eventId)?.title ?? ''}
                    eventDate={e.date}
                  />
                ))}
              </div>

              {/* Rate */}
              <span
                className={`ml-1 w-10 flex-shrink-0 text-right text-xs font-mono tabular-nums font-semibold ${
                  member.attendanceRate >= 80
                    ? 'text-green-600 dark:text-green-400'
                    : member.attendanceRate >= 50
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-red-600 dark:text-red-400'
                }`}
              >
                {member.attendanceRate}%
              </span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-green-500" />
            Zúčastnil se
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-red-500" />
            Chyběl
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-muted border border-border/40" />
            Bez záznamu
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
