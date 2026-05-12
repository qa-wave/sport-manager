import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { prisma } from '../prisma';
import { requireAuth, requireRole } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/polls — polls stored in club.config.polls array.
 *
 * No DB schema changes needed — uses club.config (JSONB).
 */
const polls = new Hono<HonoEnv>();
polls.use('/*', requireAuth());

function asJson(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

export type PollOption = {
  text: string;
  votes: string[]; // array of memberId
};

export type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  teamId?: string | null;
  createdByMemberId: string;
  createdAt: string;
  active: boolean;
};

async function getPolls(clubId: string): Promise<Poll[]> {
  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { config: true } });
  if (!club) return [];
  const cfg = (club.config as Record<string, unknown>) ?? {};
  const raw = Array.isArray(cfg.polls) ? (cfg.polls as Poll[]) : [];
  return raw;
}

async function savePolls(clubId: string, polls: Poll[]): Promise<void> {
  const club = await prisma.club.findUnique({ where: { id: clubId }, select: { config: true } });
  if (!club) return;
  const cfg = (club.config as Record<string, unknown>) ?? {};
  await prisma.club.update({
    where: { id: clubId },
    data: { config: asJson({ ...cfg, polls }) },
  });
}

// GET /v1/polls
polls.get('/', async (c) => {
  const clubId = c.get('clubId');
  if (!clubId) return c.json({ error: 'Bad Request', message: 'x-club-id required' }, 400);

  const allPolls = await getPolls(clubId);
  const active = allPolls.filter((p) => p.active !== false);
  return c.json(active);
});

// POST /v1/polls
const CreatePollInput = z.object({
  question: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).min(2).max(10),
  teamId: z.string().uuid().nullable().optional(),
});

polls.post(
  '/',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH', 'ASSISTANT_COACH'),
  zValidator('json', CreatePollInput),
  async (c) => {
    const member = c.get('member')!;
    const input = c.req.valid('json');

    const allPolls = await getPolls(member.clubId);

    const newPoll: Poll = {
      id: crypto.randomUUID(),
      question: input.question,
      options: input.options.map((text) => ({ text, votes: [] })),
      teamId: input.teamId ?? null,
      createdByMemberId: member.memberId,
      createdAt: new Date().toISOString(),
      active: true,
    };

    await savePolls(member.clubId, [...allPolls, newPoll]);
    return c.json(newPoll, 201);
  },
);

// POST /v1/polls/:pollId/vote
const VoteInput = z.object({ optionIndex: z.number().int().min(0) });

polls.post(
  '/:pollId/vote',
  zValidator('json', VoteInput),
  async (c) => {
    const member = c.get('member')!;
    const pollId = c.req.param('pollId');
    const { optionIndex } = c.req.valid('json');

    if (!member.memberId) {
      return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
    }

    const allPolls = await getPolls(member.clubId);
    const idx = allPolls.findIndex((p) => p.id === pollId);
    if (idx === -1) {
      return c.json({ error: 'Not Found', message: 'Poll not found' }, 404);
    }

    const poll = allPolls[idx]!;
    if (!poll.active) {
      return c.json({ error: 'Bad Request', message: 'Poll is closed' }, 400);
    }
    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return c.json({ error: 'Bad Request', message: 'Invalid optionIndex' }, 400);
    }

    // Remove any existing vote from this member across all options
    const updated: Poll = {
      id: poll.id,
      question: poll.question,
      options: poll.options.map((opt, i) => ({
        ...opt,
        votes: i === optionIndex
          ? opt.votes.includes(member.memberId)
            ? opt.votes.filter((v) => v !== member.memberId) // toggle off
            : [...opt.votes.filter((v) => v !== member.memberId), member.memberId]
          : opt.votes.filter((v) => v !== member.memberId),
      })),
      teamId: poll.teamId,
      createdByMemberId: poll.createdByMemberId,
      createdAt: poll.createdAt,
      active: poll.active,
    };

    allPolls[idx] = updated;
    await savePolls(member.clubId, allPolls);
    return c.json(updated);
  },
);

// DELETE /v1/polls/:pollId
polls.delete(
  '/:pollId',
  requireRole('ADMIN', 'OWNER', 'HEAD_COACH'),
  async (c) => {
    const member = c.get('member')!;
    const pollId = c.req.param('pollId');

    const allPolls = await getPolls(member.clubId);
    const idx = allPolls.findIndex((p) => p.id === pollId);
    if (idx === -1) {
      return c.json({ error: 'Not Found', message: 'Poll not found' }, 404);
    }

    // Mark as inactive (soft delete)
    const current = allPolls[idx]!;
    allPolls[idx] = { ...current, active: false };
    await savePolls(member.clubId, allPolls);
    return c.body(null, 204);
  },
);

export { polls as pollsRoutes };
