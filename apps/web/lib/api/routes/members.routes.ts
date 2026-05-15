import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/members — member list, detail, invite, status change.
 */
const members = new Hono<HonoEnv>();

members.use('/*', requireAuth());

/**
 * GET /v1/members
 * Lists all members of the active club, sorted by last name, first name.
 */
members.get('/', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }

  const result = await prisma.withClub(clubId, async (tx) => {
    const memberList = await tx.member.findMany({
      orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            dateOfBirth: true,
            avatarUrl: true,
          },
        },
        teamMemberships: {
          where: { leftAt: null },
          select: {
            role: true,
            team: { select: { id: true, name: true, ageGroup: true } },
          },
        },
        clubRoles: { select: { role: true } },
        guardianLinks: {
          select: {
            child: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        childLinks: {
          select: {
            guardian: {
              select: {
                id: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
            canViewPayments: true,
            canViewMedical: true,
            canSignWaivers: true,
          },
        },
      },
    });

    return memberList.map((m) => ({
      id: m.id,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      dateOfBirth: m.user.dateOfBirth,
      isMinor: m.isMinor,
      status: m.status,
      jerseyNumber: m.jerseyNumber,
      position: m.position,
      joinedAt: m.joinedAt,
      teamRoles: m.teamMemberships.map((tm) => ({
        teamId: tm.team.id,
        teamName: tm.team.name,
        ageGroup: tm.team.ageGroup,
        role: tm.role,
      })),
      clubRoles: m.clubRoles.map((cr) => cr.role),
      guardianOf: m.guardianLinks.map((gl) => ({
        memberId: gl.child.id,
        name: `${gl.child.user.firstName} ${gl.child.user.lastName}`,
      })),
      guardians: m.childLinks.map((cl) => ({
        memberId: cl.guardian.id,
        name: `${cl.guardian.user.firstName} ${cl.guardian.user.lastName}`,
        canViewPayments: cl.canViewPayments,
        canViewMedical: cl.canViewMedical,
        canSignWaivers: cl.canSignWaivers,
      })),
    }));
  });

  return c.json(result);
});

/**
 * GET /v1/members/:memberId
 * Full member detail with attendance history, payments, waivers.
 */
members.get('/:memberId', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }
  const memberId = c.req.param('memberId');

  const result = await prisma.withClub(clubId, async (tx) => {
    const m = await tx.member.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            avatarUrl: true,
            locale: true,
          },
        },
        teamMemberships: {
          where: { leftAt: null },
          include: {
            team: {
              select: {
                id: true,
                name: true,
                ageGroup: true,
                sport: true,
                season: true,
              },
            },
          },
        },
        clubRoles: { select: { role: true } },
        guardianLinks: {
          include: {
            child: {
              select: {
                id: true,
                jerseyNumber: true,
                user: { select: { firstName: true, lastName: true } },
                teamMemberships: {
                  where: { leftAt: null },
                  select: {
                    team: { select: { name: true } },
                    role: true,
                  },
                },
              },
            },
          },
        },
        childLinks: {
          include: {
            guardian: {
              select: {
                id: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
          },
        },
        attendances: {
          take: 10,
          orderBy: { event: { startsAt: 'desc' } },
          include: {
            event: { select: { title: true, type: true, startsAt: true } },
          },
        },
        paymentsAsPayer: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: { fee: { select: { name: true } } },
        },
        paymentsOnBehalfOf: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            fee: { select: { name: true } },
            payer: {
              select: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        waiverSignaturesFor: {
          include: {
            waiver: { select: { title: true, type: true } },
            signedBy: {
              select: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    });

    if (!m) return null;

    return {
      id: m.id,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      email: m.user.email,
      phone: m.user.phone,
      avatarUrl: m.user.avatarUrl,
      dateOfBirth: m.user.dateOfBirth,
      locale: m.user.locale,
      isMinor: m.isMinor,
      status: m.status,
      jerseyNumber: m.jerseyNumber,
      position: m.position,
      medicalNotes: m.medicalNotes,
      joinedAt: m.joinedAt,
      teamRoles: m.teamMemberships.map((tm) => ({
        teamId: tm.team.id,
        teamName: tm.team.name,
        ageGroup: tm.team.ageGroup,
        sport: tm.team.sport,
        season: tm.team.season,
        role: tm.role,
        joinedAt: tm.joinedAt,
      })),
      clubRoles: m.clubRoles.map((cr) => cr.role),
      guardianOf: m.guardianLinks.map((gl) => ({
        memberId: gl.child.id,
        name: `${gl.child.user.firstName} ${gl.child.user.lastName}`,
        jerseyNumber: gl.child.jerseyNumber,
        teams: gl.child.teamMemberships.map((t) => `${t.team.name} (${t.role})`),
        canViewPayments: gl.canViewPayments,
        canViewMedical: gl.canViewMedical,
        canSignWaivers: gl.canSignWaivers,
      })),
      guardians: m.childLinks.map((cl) => ({
        memberId: cl.guardian.id,
        name: `${cl.guardian.user.firstName} ${cl.guardian.user.lastName}`,
        email: cl.guardian.user.email,
        phone: cl.guardian.user.phone,
        relationship: cl.relationship,
        isPrimary: cl.isPrimary,
        canViewPayments: cl.canViewPayments,
        canMakePayments: cl.canMakePayments,
        canViewMedical: cl.canViewMedical,
        canSignWaivers: cl.canSignWaivers,
      })),
      recentAttendance: m.attendances.map((a) => ({
        eventTitle: a.event.title,
        eventType: a.event.type,
        eventDate: a.event.startsAt,
        status: a.status,
        attended: a.attended,
      })),
      paymentsMade: m.paymentsAsPayer.map((p) => ({
        feeName: p.fee.name,
        amountCents: p.amountCents,
        currency: p.currency,
        status: p.status,
        paidAt: p.paidAt,
      })),
      paymentsFor: m.paymentsOnBehalfOf.map((p) => ({
        feeName: p.fee.name,
        amountCents: p.amountCents,
        currency: p.currency,
        status: p.status,
        paidAt: p.paidAt,
        paidBy: `${p.payer.user.firstName} ${p.payer.user.lastName}`,
      })),
      waivers: m.waiverSignaturesFor.map((w) => ({
        title: w.waiver.title,
        type: w.waiver.type,
        signedAt: w.signedAt,
        signedBy: `${w.signedBy.user.firstName} ${w.signedBy.user.lastName}`,
      })),
    };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Member not found' }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /v1/members/:memberId/stats
// Attendance and RSVP statistics for a specific member.
// Accessible by: the member themselves, their guardian, club admin/owner.
// ---------------------------------------------------------------------------
members.get('/:memberId/stats', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }
  const memberId = c.req.param('memberId');
  const requestingMember = c.get('member');

  // Authorization check: self, guardian, or admin/owner
  if (requestingMember) {
    const isSelf = requestingMember.memberId === memberId;
    const isAdminOrOwner =
      requestingMember.clubRoles.includes('ADMIN') ||
      requestingMember.clubRoles.includes('OWNER');
    const isGuardian = requestingMember.guardianOf.some((g) => g.childMemberId === memberId);
    if (!isSelf && !isAdminOrOwner && !isGuardian) {
      return c.json({ error: 'Forbidden', message: 'Access denied' }, 403);
    }
  }

  const result = await prisma.withClub(clubId, async (tx) => {
    // Verify member belongs to this club
    const member = await tx.member.findUnique({
      where: { id: memberId },
      select: { id: true, teamMemberships: { where: { leftAt: null }, select: { teamId: true } } },
    });
    if (!member) return null;

    const teamIds = member.teamMemberships.map((tm) => tm.teamId);

    // Fetch all attendances for this member (past events only)
    const now = new Date();
    const allAttendances = await tx.eventAttendance.findMany({
      where: {
        memberId,
        event: { startsAt: { lte: now } },
      },
      include: {
        event: { select: { id: true, title: true, startsAt: true, teamId: true, rsvpDeadline: true } },
      },
      orderBy: { event: { startsAt: 'desc' } },
    });

    const total = allAttendances.length;
    const attended = allAttendances.filter((a) => a.attended === true).length;
    const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

    // Trend: compare current month vs previous month attendance rate
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthAttendances = allAttendances.filter(
      (a) => new Date(a.event.startsAt) >= thisMonthStart,
    );
    const prevMonthAttendances = allAttendances.filter(
      (a) =>
        new Date(a.event.startsAt) >= prevMonthStart &&
        new Date(a.event.startsAt) < thisMonthStart,
    );
    const thisMonthRate =
      thisMonthAttendances.length > 0
        ? (thisMonthAttendances.filter((a) => a.attended === true).length /
            thisMonthAttendances.length) *
          100
        : null;
    const prevMonthRate =
      prevMonthAttendances.length > 0
        ? (prevMonthAttendances.filter((a) => a.attended === true).length /
            prevMonthAttendances.length) *
          100
        : null;
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (thisMonthRate !== null && prevMonthRate !== null) {
      if (thisMonthRate > prevMonthRate + 5) trend = 'up';
      else if (thisMonthRate < prevMonthRate - 5) trend = 'down';
    }

    // Team average attendance rate (for the member's primary team)
    let teamAverage = 0;
    if (teamIds.length > 0) {
      const primaryTeamId = teamIds[0]!;
      const teamAttendances = await tx.eventAttendance.findMany({
        where: {
          event: { teamId: primaryTeamId, startsAt: { lte: now } },
          attended: { not: null },
        },
        select: { attended: true },
      });
      if (teamAttendances.length > 0) {
        const teamAttended = teamAttendances.filter((a) => a.attended === true).length;
        teamAverage = Math.round((teamAttended / teamAttendances.length) * 100);
      }
    }

    // RSVP stats
    const rsvpTotal = allAttendances.length;
    // On-time: responded before rsvpDeadline (or any response if no deadline)
    const onTime = allAttendances.filter((a) => {
      if (!a.respondedAt) return false;
      if (!a.event.rsvpDeadline) return true;
      return new Date(a.respondedAt) <= new Date(a.event.rsvpDeadline);
    }).length;
    // Reliability: said YES and actually attended
    const saidYes = allAttendances.filter((a) => a.status === 'YES').length;
    const saidYesAndAttended = allAttendances.filter(
      (a) => a.status === 'YES' && a.attended === true,
    ).length;
    const reliability = saidYes > 0 ? Math.round((saidYesAndAttended / saidYes) * 100) : 0;

    // Recent form: last 10 events
    const recentForm = allAttendances.slice(0, 10).map((a) => ({
      eventTitle: a.event.title,
      date: a.event.startsAt.toISOString(),
      rsvpStatus: a.status,
      attended: a.attended,
    }));

    // Current streak: consecutive attended events (most recent first)
    const sortedForStreak = [...allAttendances].sort(
      (a, b) => new Date(b.event.startsAt).getTime() - new Date(a.event.startsAt).getTime(),
    );
    let streak = 0;
    for (const a of sortedForStreak) {
      if (a.attended === true) {
        streak++;
      } else if (a.attended === false) {
        break;
      }
      // attended === null → no record, skip without breaking streak
    }

    return {
      attendance: {
        total,
        attended,
        rate: attendanceRate,
        trend,
        teamAverage,
      },
      rsvp: {
        total: rsvpTotal,
        onTime,
        reliability,
      },
      recentForm,
      streak,
    };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Member not found' }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /v1/members — invite / create a new member in the active club.
// Requires OWNER or ADMIN.
// ---------------------------------------------------------------------------
const InviteMemberInput = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  email: z.string().email(),
  teamId: z.string().cuid().optional(),
  teamRole: z
    .enum(['PLAYER', 'HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER', 'MEDIC'])
    .optional(),
});

members.post(
  '/',
  requireRole('OWNER', 'ADMIN'),
  zValidator('json', InviteMemberInput),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
    }

    const input = c.req.valid('json');

    const result = await prisma.withClub(clubId, async (tx) => {
      // Upsert user — existing users just get linked to the new club.
      let user = await tx.user.findUnique({ where: { email: input.email } });
      if (!user) {
        user = await tx.user.create({
          data: {
            email: input.email,
            firstName: input.firstName,
            lastName: input.lastName,
            // Temp password — in a real flow an invite email + magic link would be sent.
            passwordHash: '',
          },
        });
      }

      // Check if already a member of this club.
      const existing = await tx.member.findUnique({
        where: { userId_clubId: { userId: user.id, clubId } },
      });
      if (existing) {
        return { error: 'Conflict', message: 'User is already a member of this club' } as const;
      }

      const member = await tx.member.create({
        data: {
          userId: user.id,
          clubId,
          status: 'ACTIVE',
        },
      });

      // Optionally add team membership.
      if (input.teamId && input.teamRole) {
        await tx.teamMembership.create({
          data: {
            memberId: member.id,
            teamId: input.teamId,
            role: input.teamRole,
          },
        });
      }

      return { id: member.id, userId: user.id };
    });

    if ('error' in result) {
      return c.json({ error: result.error, message: result.message }, 409);
    }

    return c.json(result, 201);
  },
);

// ---------------------------------------------------------------------------
// PATCH /v1/members/:memberId — update member status.
// Requires OWNER or ADMIN.
// ---------------------------------------------------------------------------
const PatchMemberInput = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED']),
});

members.patch(
  '/:memberId',
  requireRole('OWNER', 'ADMIN'),
  zValidator('json', PatchMemberInput),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
    }
    const memberId = c.req.param('memberId');
    const input = c.req.valid('json');

    const result = await prisma.withClub(clubId, async (tx) => {
      const existing = await tx.member.findUnique({ where: { id: memberId } });
      if (!existing) return null;

      return tx.member.update({
        where: { id: memberId },
        data: { status: input.status },
        select: { id: true, status: true },
      });
    });

    if (!result) {
      return c.json({ error: 'Not Found', message: 'Member not found' }, 404);
    }

    return c.json(result);
  },
);

// ---------------------------------------------------------------------------
// POST /v1/members/import — bulk CSV import.
// Body: { csv: string } — raw semicolon-delimited CSV content.
// CSV format (first row = header, skipped):
//   jméno;příjmení;email;tým;role
// Requires OWNER or ADMIN.
// Returns: { imported: number, errors: string[] }
// ---------------------------------------------------------------------------
const ImportMembersInput = z.object({
  csv: z.string().min(1),
});

const VALID_TEAM_ROLES = [
  'PLAYER',
  'HEAD_COACH',
  'ASSISTANT_COACH',
  'TEAM_MANAGER',
  'MEDIC',
] as const;
type ValidTeamRole = (typeof VALID_TEAM_ROLES)[number];

function normalizeRole(raw: string): ValidTeamRole | null {
  const upper = raw.trim().toUpperCase().replace(/\s+/g, '_');
  if ((VALID_TEAM_ROLES as readonly string[]).includes(upper)) {
    return upper as ValidTeamRole;
  }
  // Czech aliases
  const aliases: Record<string, ValidTeamRole> = {
    HRÁČ: 'PLAYER',
    HRAC: 'PLAYER',
    HLAVNÍ_TRENÉR: 'HEAD_COACH',
    HLAVNI_TRENER: 'HEAD_COACH',
    ASISTENT: 'ASSISTANT_COACH',
    ASISTENT_TRENÉRA: 'ASSISTANT_COACH',
    ASISTENT_TRENERA: 'ASSISTANT_COACH',
    MANAŽER: 'TEAM_MANAGER',
    MANAZER: 'TEAM_MANAGER',
    LÉKAŘ: 'MEDIC',
    LEKAR: 'MEDIC',
  };
  return aliases[upper] ?? null;
}

members.post(
  '/import',
  requireRole('OWNER', 'ADMIN'),
  zValidator('json', ImportMembersInput),
  async (c) => {
    const clubId = c.get('clubId');
    if (!clubId) {
      return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
    }

    const { csv } = c.req.valid('json');

    // Parse CSV — semicolon separated, skip header row
    const lines = csv.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      return c.json(
        { error: 'Bad Request', message: 'CSV musí obsahovat alespoň jeden datový řádek' },
        400,
      );
    }

    const dataLines = lines.slice(1); // skip header
    const imported: number[] = [];
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const rowNum = i + 2; // 1-based, +1 for header
      const cols = dataLines[i]!.split(';').map((c) => c.trim());

      const [firstName, lastName, email, teamName, roleRaw] = cols;

      if (!firstName || !lastName || !email) {
        errors.push(`Řádek ${rowNum}: chybí jméno, příjmení nebo email`);
        continue;
      }

      const emailNorm = email.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailNorm)) {
        errors.push(`Řádek ${rowNum}: neplatný formát emailu "${email}"`);
        continue;
      }

      try {
        const result = await prisma.withClub(clubId, async (tx) => {
          // Upsert user
          let user = await tx.user.findUnique({ where: { email: emailNorm } });
          if (!user) {
            user = await tx.user.create({
              data: {
                email: emailNorm,
                firstName,
                lastName,
                passwordHash: '',
              },
            });
          }

          // Skip if already a member
          const existing = await tx.member.findUnique({
            where: { userId_clubId: { userId: user.id, clubId } },
          });
          if (existing) {
            return { skipped: true, reason: `email "${emailNorm}" je již členen klubu` };
          }

          const member = await tx.member.create({
            data: {
              userId: user.id,
              clubId,
              status: 'ACTIVE',
            },
          });

          // Optionally assign to team with role
          if (teamName && roleRaw) {
            const role = normalizeRole(roleRaw);
            if (!role) {
              return {
                skipped: false,
                memberId: member.id,
                warning: `neznámá role "${roleRaw}", člen vytvořen bez týmového přiřazení`,
              };
            }

            const team = await tx.team.findFirst({
              where: {
                clubId,
                name: { equals: teamName, mode: 'insensitive' },
              },
            });

            if (!team) {
              return {
                skipped: false,
                memberId: member.id,
                warning: `tým "${teamName}" nenalezen, člen vytvořen bez týmového přiřazení`,
              };
            }

            await tx.teamMembership.create({
              data: {
                memberId: member.id,
                teamId: team.id,
                role,
              },
            });
          }

          return { skipped: false, memberId: member.id };
        });

        if (result.skipped) {
          errors.push(`Řádek ${rowNum}: ${result.reason}`);
        } else {
          imported.push(rowNum);
          if ('warning' in result && result.warning) {
            errors.push(`Řádek ${rowNum} (varování): ${result.warning}`);
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'neznámá chyba';
        errors.push(`Řádek ${rowNum}: ${msg}`);
      }
    }

    return c.json({ imported: imported.length, errors }, 200);
  },
);

// ---------------------------------------------------------------------------
// GET /v1/members/:memberId/badges
// Returns attendance gamification data: streaks, badge list, stats.
// Same access rules as /stats.
// ---------------------------------------------------------------------------

interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  check: (opts: { totalAttended: number; currentStreak: number; longestStreak: number; fullMonths: number }) => boolean;
}

const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: 'first_training',
    name: 'První trénink',
    icon: '🎯',
    description: 'Zúčastnil ses prvního tréninku',
    check: ({ totalAttended }) => totalAttended >= 1,
  },
  {
    id: 'regular',
    name: 'Pravidelný',
    icon: '⭐',
    description: '5 a více účastí',
    check: ({ totalAttended }) => totalAttended >= 5,
  },
  {
    id: 'reliable',
    name: 'Spolehlivý',
    icon: '🏅',
    description: '10 a více účastí',
    check: ({ totalAttended }) => totalAttended >= 10,
  },
  {
    id: 'iron_man',
    name: 'Železný muž',
    icon: '💪',
    description: '25 a více účastí',
    check: ({ totalAttended }) => totalAttended >= 25,
  },
  {
    id: 'legend',
    name: 'Legenda',
    icon: '🏆',
    description: '50 a více účastí',
    check: ({ totalAttended }) => totalAttended >= 50,
  },
  {
    id: 'streak_3',
    name: 'Série 3',
    icon: '🔥',
    description: '3 po sobě jdoucí účasti',
    check: ({ longestStreak }) => longestStreak >= 3,
  },
  {
    id: 'streak_10',
    name: 'Série 10',
    icon: '🔥🔥',
    description: '10 po sobě jdoucích účastí',
    check: ({ longestStreak }) => longestStreak >= 10,
  },
  {
    id: 'full_month',
    name: '100% měsíc',
    icon: '⭐',
    description: 'Celý měsíc bez absence',
    check: ({ fullMonths }) => fullMonths >= 1,
  },
];

members.get('/:memberId/badges', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) {
    return c.json({ error: 'Bad Request', message: 'x-club-id header required' }, 400);
  }
  const memberId = c.req.param('memberId');
  const requestingMember = c.get('member');

  // Same authorization as /stats
  if (requestingMember) {
    const isSelf = requestingMember.memberId === memberId;
    const isAdminOrOwner =
      requestingMember.clubRoles.includes('ADMIN') ||
      requestingMember.clubRoles.includes('OWNER');
    const isGuardian = requestingMember.guardianOf.some((g) => g.childMemberId === memberId);
    if (!isSelf && !isAdminOrOwner && !isGuardian) {
      return c.json({ error: 'Forbidden', message: 'Access denied' }, 403);
    }
  }

  const result = await prisma.withClub(clubId, async (tx) => {
    const member = await tx.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });
    if (!member) return null;

    const now = new Date();
    const allAttendances = await tx.eventAttendance.findMany({
      where: {
        memberId,
        event: { startsAt: { lte: now } },
        attended: true,
      },
      include: {
        event: { select: { id: true, startsAt: true } },
      },
      orderBy: { event: { startsAt: 'asc' } },
    });

    const totalAttended = allAttendances.length;

    // Compute current streak (most recent first)
    const allForStreak = await tx.eventAttendance.findMany({
      where: {
        memberId,
        event: { startsAt: { lte: now } },
      },
      include: {
        event: { select: { startsAt: true } },
      },
      orderBy: { event: { startsAt: 'desc' } },
    });

    let currentStreak = 0;
    for (const a of allForStreak) {
      if (a.attended === true) {
        currentStreak++;
      } else if (a.attended === false) {
        break;
      }
      // attended === null → skip (no record yet)
    }

    // Longest streak
    let longestStreak = 0;
    let runningStreak = 0;
    for (const a of allForStreak.slice().reverse()) {
      if (a.attended === true) {
        runningStreak++;
        longestStreak = Math.max(longestStreak, runningStreak);
      } else if (a.attended === false) {
        runningStreak = 0;
      }
    }

    // Attendance rate (total events vs attended)
    const totalEvents = await tx.eventAttendance.count({
      where: { memberId, event: { startsAt: { lte: now } } },
    });
    const attendanceRate = totalEvents > 0 ? Math.round((totalAttended / totalEvents) * 100) : 0;

    // Full months: months where all events with attendance records were attended
    const attendanceByMonth = new Map<string, { attended: number; total: number }>();
    const allMonthlyAttendances = await tx.eventAttendance.findMany({
      where: {
        memberId,
        event: { startsAt: { lte: now } },
        attended: { not: null },
      },
      include: {
        event: { select: { startsAt: true } },
      },
    });
    for (const a of allMonthlyAttendances) {
      const d = new Date(a.event.startsAt);
      // Don't count current (incomplete) month
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) continue;
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const entry = attendanceByMonth.get(key) ?? { attended: 0, total: 0 };
      entry.total++;
      if (a.attended === true) entry.attended++;
      attendanceByMonth.set(key, entry);
    }
    let fullMonths = 0;
    for (const { attended: att, total } of attendanceByMonth.values()) {
      if (total >= 3 && att === total) fullMonths++;
    }

    // Evaluate badges and assign approximate earnedAt dates
    const badgeOpts = { totalAttended, currentStreak, longestStreak, fullMonths };

    // For earned-at estimation: find the attendance record that pushed over threshold
    function earnedAtForCount(count: number): string | null {
      if (count <= 0 || allAttendances.length < count) return null;
      return allAttendances[count - 1]!.event.startsAt.toISOString();
    }

    const badges = BADGE_DEFINITIONS.map((def) => {
      const earned = def.check(badgeOpts);
      let earnedAt: string | null = null;
      if (earned) {
        if (def.id === 'first_training') earnedAt = earnedAtForCount(1);
        else if (def.id === 'regular') earnedAt = earnedAtForCount(5);
        else if (def.id === 'reliable') earnedAt = earnedAtForCount(10);
        else if (def.id === 'iron_man') earnedAt = earnedAtForCount(25);
        else if (def.id === 'legend') earnedAt = earnedAtForCount(50);
        else earnedAt = new Date().toISOString(); // streak/month badges: now
      }
      return { id: def.id, name: def.name, icon: def.icon, description: def.description, earned, earnedAt };
    });

    return {
      currentStreak,
      longestStreak,
      totalAttended,
      attendanceRate,
      badges,
    };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Member not found' }, 404);
  }

  return c.json(result);
});

export { members as membersRoutes };
