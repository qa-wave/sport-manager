'use client';

import { useState } from 'react';
import { SquareActivity } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { apiFetch } from '@/lib/api';
import type { EventDetail } from '@/lib/api';

// ─── Score section ───

type ScoreStatus = 'not_started' | 'first_half' | 'half_time' | 'second_half' | 'full_time';

interface ScoreData {
  home: number;
  away: number;
  status: ScoreStatus;
  updatedAt: string;
}

const SCORE_MARKER_RE = /<!--\s*score:\s*(\{.*?\})\s*-->/s;

function parseScoreMarker(description: string | null | undefined): ScoreData | null {
  if (!description) return null;
  const match = SCORE_MARKER_RE.exec(description);
  if (!match || !match[1]) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

const SCORE_STATUS_LABEL: Record<ScoreStatus, string> = {
  not_started: 'Nezahájeno',
  first_half: '1. poločas',
  half_time: 'Poločas',
  second_half: '2. poločas',
  full_time: 'Konec',
};

// ─── Stats helpers ───

const STATS_MARKER_RE = /<!--\s*stats:\s*([\s\S]*?)\s*-->/;

type StatRow = {
  memberId: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
};

function parseStats(description: string): StatRow[] {
  const match = STATS_MARKER_RE.exec(description);
  if (!match || !match[1]) return [];
  try {
    return JSON.parse(match[1]) as StatRow[];
  } catch {
    return [];
  }
}

// ─── Live Score Component ───

interface LiveScoreSectionProps {
  eventId: string;
  description: string | null | undefined;
  opponent: string | null | undefined;
  homeAway: string | null | undefined;
  isCoachOrAdmin: boolean;
  onDescriptionUpdate: (newDesc: string) => void;
}

function LiveScoreSection({
  eventId,
  description,
  opponent,
  homeAway,
  isCoachOrAdmin,
  onDescriptionUpdate,
}: LiveScoreSectionProps) {
  const queryClient = useQueryClient();
  const [localScore, setLocalScore] = useState<ScoreData | null>(null);

  const score = localScore ?? parseScoreMarker(description);
  const isLive = score?.status === 'first_half' || score?.status === 'second_half';

  const scoreMutation = useMutation({
    mutationFn: (data: { homeScore: number; awayScore: number; status: ScoreStatus }) =>
      apiFetch(`/events/${eventId}/score`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: (_result, vars) => {
      const newScore: ScoreData = {
        home: vars.homeScore,
        away: vars.awayScore,
        status: vars.status,
        updatedAt: new Date().toISOString(),
      };
      setLocalScore(newScore);
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });

  function updateScore(field: 'home' | 'away', delta: number) {
    const current = score ?? {
      home: 0,
      away: 0,
      status: 'not_started' as ScoreStatus,
      updatedAt: '',
    };
    const newHome = field === 'home' ? Math.max(0, current.home + delta) : current.home;
    const newAway = field === 'away' ? Math.max(0, current.away + delta) : current.away;
    scoreMutation.mutate({ homeScore: newHome, awayScore: newAway, status: current.status });
  }

  function updateStatus(status: ScoreStatus) {
    const current = score ?? {
      home: 0,
      away: 0,
      status: 'not_started' as ScoreStatus,
      updatedAt: '',
    };
    scoreMutation.mutate({ homeScore: current.home, awayScore: current.away, status });
  }

  const clubName = homeAway === 'HOME' ? 'Domácí' : homeAway === 'AWAY' ? 'Hosté' : 'My';
  const oppName = opponent ?? 'Soupeř';
  const leftTeam = homeAway === 'AWAY' ? oppName : clubName;
  const rightTeam = homeAway === 'AWAY' ? clubName : oppName;
  const leftScore = homeAway === 'AWAY' ? (score?.away ?? 0) : (score?.home ?? 0);
  const rightScore = homeAway === 'AWAY' ? (score?.home ?? 0) : (score?.away ?? 0);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          {isLive && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider">LIVE</span>
            </span>
          )}
          <CardTitle className="text-sm">Živý výsledek</CardTitle>
        </div>
        {score && (
          <span className="text-xs text-muted-foreground">{SCORE_STATUS_LABEL[score.status]}</span>
        )}
      </CardHeader>

      <CardContent className="pb-5 pt-0">
        {!score ? (
          <div className="rounded-lg border border-dashed border-border/60 py-6 text-center">
            <p className="text-sm text-muted-foreground">Výsledek zatím nezadán</p>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-4 py-2">
            <div className="flex flex-col items-center gap-1 min-w-[80px]">
              <span className="text-xs font-medium text-muted-foreground truncate max-w-[100px] text-center">
                {leftTeam}
              </span>
              <span className="text-5xl font-black tabular-nums leading-none">{leftScore}</span>
            </div>
            <span className="text-3xl font-bold text-muted-foreground/50">:</span>
            <div className="flex flex-col items-center gap-1 min-w-[80px]">
              <span className="text-xs font-medium text-muted-foreground truncate max-w-[100px] text-center">
                {rightTeam}
              </span>
              <span className="text-5xl font-black tabular-nums leading-none">{rightScore}</span>
            </div>
          </div>
        )}

        {isCoachOrAdmin && (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  {homeAway === 'AWAY' ? oppName : clubName}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateScore('home', -1)}
                    disabled={scoreMutation.isPending || (score?.home ?? 0) === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-lg font-bold hover:bg-muted/50 disabled:opacity-40 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-lg font-bold tabular-nums">
                    {score?.home ?? 0}
                  </span>
                  <button
                    onClick={() => updateScore('home', 1)}
                    disabled={scoreMutation.isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-lg font-bold hover:bg-muted/50 disabled:opacity-40 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
              <span className="text-muted-foreground/40 text-xl">:</span>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">
                  {homeAway === 'AWAY' ? clubName : oppName}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateScore('away', -1)}
                    disabled={scoreMutation.isPending || (score?.away ?? 0) === 0}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-lg font-bold hover:bg-muted/50 disabled:opacity-40 transition-colors"
                  >
                    -
                  </button>
                  <span className="w-6 text-center text-lg font-bold tabular-nums">
                    {score?.away ?? 0}
                  </span>
                  <button
                    onClick={() => updateScore('away', 1)}
                    disabled={scoreMutation.isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-lg font-bold hover:bg-muted/50 disabled:opacity-40 transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-1.5">
              {(
                [
                  'not_started',
                  'first_half',
                  'half_time',
                  'second_half',
                  'full_time',
                ] as ScoreStatus[]
              ).map((s) => (
                <button
                  key={s}
                  onClick={() => updateStatus(s)}
                  disabled={scoreMutation.isPending}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition-all ${
                    score?.status === s
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {SCORE_STATUS_LABEL[s]}
                </button>
              ))}
            </div>

            {!score && (
              <div className="flex justify-center">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() =>
                    scoreMutation.mutate({ homeScore: 0, awayScore: 0, status: 'not_started' })
                  }
                  disabled={scoreMutation.isPending}
                >
                  Zahájit sledování výsledku
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Match Stats Component ───

interface StatsSectionProps {
  event: EventDetail;
  isCoachOrAdmin: boolean;
  onSaveStats: (stats: StatRow[]) => void;
  isSaving: boolean;
}

function StatsSection({ event, isCoachOrAdmin, onSaveStats, isSaving }: StatsSectionProps) {
  const saved = parseStats(event.description ?? '');

  const [rows, setRows] = useState<StatRow[]>(() => {
    const playerAttendees = event.attendees.filter(
      (a) => a.status === 'YES' || saved.some((s) => s.memberId === a.memberId),
    );
    return playerAttendees.map((a) => {
      const existing = saved.find((s) => s.memberId === a.memberId);
      return existing ?? { memberId: a.memberId, goals: 0, assists: 0, yellowCards: 0, redCards: 0 };
    });
  });

  const totals = rows.reduce(
    (acc, r) => ({
      goals: acc.goals + r.goals,
      assists: acc.assists + r.assists,
      yellowCards: acc.yellowCards + r.yellowCards,
      redCards: acc.redCards + r.redCards,
    }),
    { goals: 0, assists: 0, yellowCards: 0, redCards: 0 },
  );

  function updateRow(memberId: string, field: keyof Omit<StatRow, 'memberId'>, value: number) {
    setRows((prev) => prev.map((r) => (r.memberId === memberId ? { ...r, [field]: value } : r)));
  }

  const nameMap = Object.fromEntries(event.attendees.map((a) => [a.memberId, a.name]));

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SquareActivity className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm">Statistiky zápasu</CardTitle>
          </div>
          {isCoachOrAdmin && (
            <Button
              size="sm"
              className="h-7 text-xs"
              onClick={() => onSaveStats(rows)}
              disabled={isSaving}
            >
              {isSaving ? 'Ukládám...' : 'Uložit'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="text-[11px] uppercase tracking-wider">Hráč</TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-center">
                  Góly
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-center">
                  Asistence
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-center">
                  ZK
                </TableHead>
                <TableHead className="text-[11px] uppercase tracking-wider text-center">
                  CK
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.memberId} className="border-border/30">
                  <TableCell className="text-sm font-medium">
                    {nameMap[row.memberId] ?? row.memberId}
                  </TableCell>
                  {(['goals', 'assists', 'yellowCards', 'redCards'] as const).map((field) => (
                    <TableCell key={field} className="text-center">
                      {isCoachOrAdmin ? (
                        <Input
                          type="number"
                          min={0}
                          max={field === 'redCards' ? 1 : field === 'yellowCards' ? 2 : 20}
                          value={row[field]}
                          onChange={(e) =>
                            updateRow(row.memberId, field, Math.max(0, Number(e.target.value)))
                          }
                          className="mx-auto h-7 w-14 text-center text-xs"
                        />
                      ) : (
                        <span className="text-sm">{row[field] > 0 ? row[field] : '—'}</span>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {rows.length > 0 && (
                <TableRow className="border-border/50 bg-muted/30 font-bold">
                  <TableCell className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Celkem
                  </TableCell>
                  <TableCell className="text-center text-sm font-bold">{totals.goals}</TableCell>
                  <TableCell className="text-center text-sm font-bold">{totals.assists}</TableCell>
                  <TableCell className="text-center text-sm">
                    <span className={totals.yellowCards > 0 ? 'text-amber-500 font-bold' : ''}>
                      {totals.yellowCards || '—'}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    <span className={totals.redCards > 0 ? 'text-red-500 font-bold' : ''}>
                      {totals.redCards || '—'}
                    </span>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Public interface ───

interface EventStatsTabProps {
  event: EventDetail;
  isCoachOrAdmin: boolean;
  onSaveStats: (stats: StatRow[]) => void;
  isSaving: boolean;
  onDescriptionUpdate: (newDesc: string) => void;
}

export function EventStatsTab({
  event,
  isCoachOrAdmin,
  onSaveStats,
  isSaving,
  onDescriptionUpdate,
}: EventStatsTabProps) {
  return (
    <div className="space-y-4">
      <LiveScoreSection
        eventId={event.id}
        description={event.description}
        opponent={event.opponent}
        homeAway={event.homeAway}
        isCoachOrAdmin={isCoachOrAdmin}
        onDescriptionUpdate={onDescriptionUpdate}
      />
      {event.type === 'MATCH' && (
        <StatsSection
          event={event}
          isCoachOrAdmin={isCoachOrAdmin}
          onSaveStats={onSaveStats}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
