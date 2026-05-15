/**
 * AI Summary Service — template-based event summary generator.
 * No external LLM. Builds context-aware sentences from attendance/RSVP data.
 */

import { prisma } from '../prisma';

export interface EventSummaryResult {
  summary: string;
  highlights: string[];
  stats: {
    totalMembers: number;
    attended: number;
    absent: number;
    absentWithoutExcuse: number;
    attendanceRate: number;
    rsvpYes: number;
    rsvpNo: number;
    rsvpMaybe: number;
    rsvpPending: number;
    topStreak?: { name: string; count: number };
    scorers?: Array<{ name: string; goals: number; assists: number }>;
    score?: { home: number; away: number; status: string };
  };
}

// Regex matchers for description markers
const SCORE_MARKER_RE = /<!--\s*score:\s*(\{.*?\})\s*-->/s;
const STATS_MARKER_RE = /<!--\s*stats:\s*([\s\S]*?)\s*-->/;

function parseScore(description: string | null): { home: number; away: number; status: string } | null {
  if (!description) return null;
  const m = SCORE_MARKER_RE.exec(description);
  if (!m || !m[1]) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

function parseStats(description: string | null): Array<{
  memberId: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}> {
  if (!description) return [];
  const m = STATS_MARKER_RE.exec(description);
  if (!m || !m[1]) return [];
  try { return JSON.parse(m[1]); } catch { return []; }
}

function pluralMembers(n: number): string {
  if (n === 1) return '1 hrac';
  if (n >= 2 && n <= 4) return `${n} hraci`;
  return `${n} hracu`;
}

function pct(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export async function generateEventSummary(
  eventId: string,
  clubId: string,
): Promise<EventSummaryResult | null> {
  const event = await prisma.withClub(clubId, async (tx) => {
    const ev = await tx.event.findUnique({
      where: { id: eventId },
      include: {
        team: { select: { id: true, name: true } },
        attendances: {
          include: {
            member: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });
    return ev;
  });

  if (!event) return null;

  // Check event has some attendance data (at least one attended=true/false)
  const hasAttendanceData = event.attendances.some((a) => a.attended !== null);
  if (!hasAttendanceData) return null;

  // ── Attendance stats ──
  const attended = event.attendances.filter((a) => a.attended === true).length;
  const absentAttendances = event.attendances.filter((a) => a.attended === false);
  const absent = absentAttendances.length;
  // absent without excuse = attended=false AND (status=PENDING or status=YES)
  const absentWithoutExcuse = absentAttendances.filter(
    (a) => a.status === 'PENDING' || a.status === 'YES',
  ).length;
  const totalWithData = attended + absent;

  // ── RSVP stats ──
  const rsvpYes = event.attendances.filter((a) => a.status === 'YES').length;
  const rsvpNo = event.attendances.filter((a) => a.status === 'NO').length;
  const rsvpMaybe = event.attendances.filter((a) => a.status === 'MAYBE').length;
  const rsvpPending = event.attendances.filter((a) => a.status === 'PENDING').length;

  // ── Score / stats from description markers ──
  const score = parseScore(event.description);
  const playerStats = parseStats(event.description);

  // ── Streak detection: find member with longest current attendance streak ──
  let topStreak: { name: string; count: number } | undefined;
  if (event.teamId) {
    try {
      const recentEvents = await prisma.event.findMany({
        where: {
          clubId,
          teamId: event.teamId,
          endsAt: { lte: event.endsAt },
        },
        orderBy: { startsAt: 'desc' },
        take: 20,
        select: {
          id: true,
          attendances: {
            where: { attended: true },
            select: { memberId: true },
          },
        },
      });

      // Build streak map: memberId -> consecutive events attended from latest backwards
      const streakMap = new Map<string, number>();
      const memberIds = new Set(event.attendances.map((a) => a.memberId));

      for (const memberId of memberIds) {
        let streak = 0;
        for (const ev of recentEvents) {
          const wasPresent = ev.attendances.some((a) => a.memberId === memberId);
          if (wasPresent) {
            streak++;
          } else {
            break;
          }
        }
        if (streak > 0) streakMap.set(memberId, streak);
      }

      // Find top streak
      let maxStreak = 0;
      let topMemberId: string | undefined;
      for (const [memberId, streak] of streakMap) {
        if (streak > maxStreak) {
          maxStreak = streak;
          topMemberId = memberId;
        }
      }

      if (topMemberId && maxStreak >= 3) {
        const att = event.attendances.find((a) => a.memberId === topMemberId);
        if (att) {
          const name = `${att.member.user.firstName} ${att.member.user.lastName}`;
          topStreak = { name, count: maxStreak };
        }
      }
    } catch {
      // Non-critical — ignore streak on error
    }
  }

  // ── Build member name map for stats ──
  const memberNameMap = new Map<string, string>();
  for (const a of event.attendances) {
    memberNameMap.set(
      a.memberId,
      `${a.member.user.firstName} ${a.member.user.lastName}`,
    );
  }

  // ── Scorers (for MATCH/TOURNAMENT) ──
  const scorers = playerStats
    .filter((s) => s.goals > 0 || s.assists > 0)
    .map((s) => ({
      name: memberNameMap.get(s.memberId) ?? 'Neznamy hrac',
      goals: s.goals,
      assists: s.assists,
    }))
    .sort((a, b) => b.goals - a.goals || b.assists - a.assists);

  // ── Build summary text ──
  const lines: string[] = [];
  const highlights: string[] = [];

  const typeLabel: Record<string, string> = {
    PRACTICE: 'Treninku',
    MATCH: 'Zapasu',
    TOURNAMENT: 'Turnaje',
    MEETING: 'Schuzky',
    SOCIAL: 'Spolecenske akce',
  };
  const typeLabelCs: Record<string, string> = {
    PRACTICE: 'Treninku',
    MATCH: 'Zapasu',
    TOURNAMENT: 'Turnaje',
    MEETING: 'Schuzky',
    SOCIAL: 'Spolecenske akce',
  };

  const eventTypeLabel = typeLabelCs[event.type] ?? 'Udalosti';
  const attendanceRate = pct(attended, totalWithData);
  const teamName = event.team?.name;

  // Main attendance sentence
  if (totalWithData > 0) {
    lines.push(
      `${eventTypeLabel} se zucastnilo ${attended} z ${totalWithData} clenu (${attendanceRate} %).`,
    );
    if (attendanceRate >= 85) {
      highlights.push(`Vynikajici dochazka ${attendanceRate} %`);
    } else if (attendanceRate >= 70) {
      highlights.push(`Dochazka ${attendanceRate} %`);
    } else {
      highlights.push(`Nizka dochazka ${attendanceRate} %`);
    }
  }

  // Absent without excuse
  if (absentWithoutExcuse > 0) {
    lines.push(
      `${absentWithoutExcuse === 1 ? '1 hrac chybel' : `${absentWithoutExcuse} hraci chybeli`} bez omluvy.`,
    );
    if (absentWithoutExcuse >= 3) {
      highlights.push(`${absentWithoutExcuse}x neomluvenou absenci`);
    }
  }

  // RSVP summary
  if (rsvpYes + rsvpNo + rsvpMaybe + rsvpPending > 0) {
    const rsvpRate = pct(rsvpYes, rsvpYes + rsvpNo + rsvpMaybe + rsvpPending);
    if (rsvpRate < 60 && rsvpPending > 0) {
      lines.push(`${rsvpPending} clenu neodpovedelo na RSVP.`);
    }
  }

  // Score for match/tournament
  if ((event.type === 'MATCH' || event.type === 'TOURNAMENT') && score) {
    const scoreLabel =
      score.status === 'full_time'
        ? `Konecny vysledek: ${score.home}:${score.away}.`
        : `Prubezny stav: ${score.home}:${score.away} (${score.status}).`;
    lines.push(scoreLabel);

    const won = score.home > score.away;
    const draw = score.home === score.away;
    if (score.status === 'full_time') {
      if (won) {
        highlights.push(`Vitezstvi ${score.home}:${score.away}`);
      } else if (draw) {
        highlights.push(`Remiza ${score.home}:${score.away}`);
      } else {
        highlights.push(`Prohra ${score.home}:${score.away}`);
      }
    }
  }

  // Scorers
  if (scorers.length > 0) {
    const scorerNames = scorers
      .slice(0, 3)
      .map((s) => `${s.name} (${s.goals}g${s.assists > 0 ? `, ${s.assists}a` : ''})`)
      .join(', ');
    lines.push(`Strelci: ${scorerNames}.`);
    const topScorer = scorers[0];
    if (topScorer && topScorer.goals >= 2) {
      highlights.push(`Hattrick alert: ${topScorer.name}`);
    }
  }

  // Streak highlight
  if (topStreak) {
    lines.push(
      `Streak alert: ${topStreak.name} ma serii ${topStreak.count} ${topStreak.count === 1 ? 'tveninku' : 'treninku'} v rade!`,
    );
    highlights.push(`Seria ${topStreak.count}x: ${topStreak.name}`);
  }

  // Team name
  if (teamName) {
    highlights.push(`Tym: ${teamName}`);
  }

  const summary = lines.join(' ') || 'Zadna data k zobrazeni.';

  return {
    summary,
    highlights,
    stats: {
      totalMembers: totalWithData,
      attended,
      absent,
      absentWithoutExcuse,
      attendanceRate,
      rsvpYes,
      rsvpNo,
      rsvpMaybe,
      rsvpPending,
      topStreak,
      scorers: scorers.length > 0 ? scorers : undefined,
      score: score ?? undefined,
    },
  };
}
