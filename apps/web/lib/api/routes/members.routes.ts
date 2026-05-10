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

export { members as membersRoutes };
