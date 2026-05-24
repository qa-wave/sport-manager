import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/feedback — coach gives feedback to a player.
 *
 * Visibility model:
 *   - Player sees feedback ABOUT them (recipient).
 *   - Author sees feedback they wrote.
 *   - Club admins/owners see all feedback (oversight).
 *   - Parents do NOT see player feedback — it's coach <-> player.
 *
 * Authorship rules:
 *   - Author must be a coach (HEAD_COACH / ASSISTANT_COACH / TEAM_MANAGER) on
 *     a team the recipient also plays on, OR a club admin/owner.
 */
const feedback = new Hono<HonoEnv>();

feedback.use('/*', requireAuth());

const CreateFeedbackInput = z.object({
  playerId: z.string().min(1),
  text: z.string().min(1).max(2000),
  rating: z.number().int().min(1).max(5).optional(),
  category: z.string().max(40).optional(),
});

function isAdmin(roles: string[]): boolean {
  return roles.includes('OWNER') || roles.includes('ADMIN');
}

function isCoachRole(role: string): boolean {
  return role === 'HEAD_COACH' || role === 'ASSISTANT_COACH' || role === 'TEAM_MANAGER';
}

function serializeFeedback(row: {
  id: string;
  rating: number | null;
  text: string;
  category: string | null;
  createdAt: Date;
  playerId: string;
  authorId: string;
  author?: { user: { firstName: string; lastName: string; avatarUrl: string | null } } | null;
  player?: { user: { firstName: string; lastName: string; avatarUrl: string | null } } | null;
}) {
  return {
    id: row.id,
    rating: row.rating,
    text: row.text,
    category: row.category,
    createdAt: row.createdAt.toISOString(),
    playerId: row.playerId,
    authorId: row.authorId,
    authorName: row.author ? `${row.author.user.firstName} ${row.author.user.lastName}` : null,
    authorAvatarUrl: row.author?.user.avatarUrl ?? null,
    playerName: row.player ? `${row.player.user.firstName} ${row.player.user.lastName}` : null,
    playerAvatarUrl: row.player?.user.avatarUrl ?? null,
  };
}

// ---------------------------------------------------------------------------
// GET /v1/feedback/me — feedback received by current member (as player)
// ---------------------------------------------------------------------------
feedback.get('/me', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const rows = await prisma.withClub(member.clubId, (tx) =>
    tx.playerFeedback.findMany({
      where: { playerId: member.memberId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
      },
    }),
  );

  return c.json({ items: rows.map(serializeFeedback) });
});

// ---------------------------------------------------------------------------
// GET /v1/feedback/player/:playerId — feedback for a specific player
// Authorization: must be the player themselves, a coach on a shared team,
// or club admin/owner.
// ---------------------------------------------------------------------------
feedback.get('/player/:playerId', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }
  const playerId = c.req.param('playerId');

  const result = await prisma.withClub(member.clubId, async (tx) => {
    // Authorization check
    if (member.memberId !== playerId && !isAdmin(member.clubRoles)) {
      const playerTeams = await tx.teamMembership.findMany({
        where: { memberId: playerId, role: 'PLAYER', leftAt: null },
        select: { teamId: true },
      });
      const myCoachTeams = new Set(
        member.teamRoles.filter((r) => isCoachRole(r.role)).map((r) => r.teamId),
      );
      const sharedTeam = playerTeams.some((t) => myCoachTeams.has(t.teamId));
      if (!sharedTeam) {
        return { forbidden: true as const };
      }
    }

    const rows = await tx.playerFeedback.findMany({
      where: { playerId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        player: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
      },
    });
    return { items: rows.map(serializeFeedback) };
  });

  if ('forbidden' in result) {
    return c.json({ error: 'Forbidden', message: 'Not authorized to view this feedback' }, 403);
  }
  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /v1/feedback/coachable-players — list of players the current coach
// can write feedback for (members of their teams). Empty for non-coaches.
// ---------------------------------------------------------------------------
feedback.get('/coachable-players', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const myCoachTeamIds = member.teamRoles
    .filter((r) => isCoachRole(r.role))
    .map((r) => r.teamId);

  const canSeeAll = isAdmin(member.clubRoles);
  if (!canSeeAll && myCoachTeamIds.length === 0) {
    return c.json({ items: [] });
  }

  const rows = await prisma.withClub(member.clubId, (tx) =>
    tx.teamMembership.findMany({
      where: {
        role: 'PLAYER',
        leftAt: null,
        ...(canSeeAll ? {} : { teamId: { in: myCoachTeamIds } }),
      },
      include: {
        member: {
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
        team: { select: { id: true, name: true } },
      },
      orderBy: { joinedAt: 'asc' },
    }),
  );

  // Dedup by memberId (a player can be on multiple teams)
  const map = new Map<string, {
    memberId: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    teams: Array<{ id: string; name: string }>;
  }>();
  for (const tm of rows) {
    const existing = map.get(tm.memberId);
    if (existing) {
      existing.teams.push(tm.team);
    } else {
      map.set(tm.memberId, {
        memberId: tm.memberId,
        firstName: tm.member.user.firstName,
        lastName: tm.member.user.lastName,
        avatarUrl: tm.member.user.avatarUrl,
        teams: [tm.team],
      });
    }
  }

  return c.json({ items: [...map.values()] });
});

// ---------------------------------------------------------------------------
// POST /v1/feedback — create feedback for a player.
// Author must be a coach on a team the player is on (or club admin).
// ---------------------------------------------------------------------------
feedback.post('/', zValidator('json', CreateFeedbackInput), async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const input = c.req.valid('json');

  const result = await prisma.withClub(member.clubId, async (tx) => {
    // Verify the player exists in this club
    const player = await tx.member.findFirst({
      where: { id: input.playerId },
      select: { id: true },
    });
    if (!player) {
      return { error: 'not_found' as const };
    }

    if (!isAdmin(member.clubRoles)) {
      // Coach must share a team with the player
      const myCoachTeamIds = member.teamRoles
        .filter((r) => isCoachRole(r.role))
        .map((r) => r.teamId);
      if (myCoachTeamIds.length === 0) {
        return { error: 'forbidden' as const };
      }
      const shared = await tx.teamMembership.findFirst({
        where: {
          memberId: input.playerId,
          role: 'PLAYER',
          leftAt: null,
          teamId: { in: myCoachTeamIds },
        },
        select: { id: true },
      });
      if (!shared) {
        return { error: 'forbidden' as const };
      }
    }

    const created = await tx.playerFeedback.create({
      data: {
        clubId: member.clubId,
        playerId: input.playerId,
        authorId: member.memberId,
        text: input.text,
        rating: input.rating ?? null,
        category: input.category ?? null,
      },
      include: {
        author: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        player: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
      },
    });

    // Notify the player
    await tx.notification.create({
      data: {
        clubId: member.clubId,
        memberId: input.playerId,
        type: 'GENERAL',
        title: 'Nová zpětná vazba',
        body: `Od ${created.author.user.firstName} ${created.author.user.lastName}`,
        link: '/admin/feedback',
      },
    }).catch(() => undefined); // notification is best-effort

    return { ok: true as const, feedback: serializeFeedback(created) };
  });

  if ('error' in result && result.error === 'not_found') {
    return c.json({ error: 'Not Found', message: 'Player not found' }, 404);
  }
  if ('error' in result && result.error === 'forbidden') {
    return c.json({ error: 'Forbidden', message: 'You must coach a team this player is on' }, 403);
  }
  return c.json(result, 201);
});

// ---------------------------------------------------------------------------
// DELETE /v1/feedback/:id — only author or club admin can delete
// ---------------------------------------------------------------------------
feedback.delete('/:id', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }
  const id = c.req.param('id');

  const result = await prisma.withClub(member.clubId, async (tx) => {
    const row = await tx.playerFeedback.findUnique({ where: { id }, select: { authorId: true } });
    if (!row) return { error: 'not_found' as const };
    if (row.authorId !== member.memberId && !isAdmin(member.clubRoles)) {
      return { error: 'forbidden' as const };
    }
    await tx.playerFeedback.delete({ where: { id } });
    return { ok: true as const };
  });

  if ('error' in result && result.error === 'not_found') {
    return c.json({ error: 'Not Found' }, 404);
  }
  if ('error' in result && result.error === 'forbidden') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  return c.json(result);
});

export { feedback as feedbackRoutes };
