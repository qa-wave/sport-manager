import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { CreateConversationInput, SendMessageInput } from '@branik/contracts';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/rbac.middleware';
import type { HonoEnv } from '../../types/hono';

/**
 * /v1/conversations — inbox, chat, create, read.
 * Ported from apps/api/src/conversations/conversations.service.ts.
 *
 * Privacy-by-participation: all queries filter by memberId, so a user
 * cannot read conversations they're not part of.
 */
const conversations = new Hono<HonoEnv>();

conversations.use('/*', requireAuth());

// ---------------------------------------------------------------------------
// GET /v1/conversations
// List conversations the current member participates in.
// ---------------------------------------------------------------------------
conversations.get('/', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const result = await prisma.withClub(member.clubId, async (tx) => {
    const convList = await tx.conversation.findMany({
      where: {
        participants: { some: { memberId: member.memberId } },
      },
      include: {
        participants: {
          include: {
            member: {
              include: {
                user: { select: { firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
        },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              include: {
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
        team: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Sort by last message time (most recent first)
    const sorted = convList.sort((a, b) => {
      const aTime = a.messages[0]?.createdAt ?? a.createdAt;
      const bTime = b.messages[0]?.createdAt ?? b.createdAt;
      return bTime.getTime() - aTime.getTime();
    });

    return sorted.map((conv) => {
      const myParticipation = conv.participants.find(
        (p) => p.memberId === member.memberId,
      );
      const lastReadAt = myParticipation?.lastReadAt;
      const lastMsg = conv.messages[0] ?? null;

      const hasUnread = lastMsg && lastReadAt
        ? lastMsg.createdAt > lastReadAt
        : lastMsg && !lastReadAt;

      return {
        id: conv.id,
        type: conv.type,
        title: conv.title,
        teamId: conv.teamId,
        teamName: conv.team?.name ?? null,
        participantCount: conv.participants.length,
        participants: conv.participants.map((p) => ({
          memberId: p.memberId,
          firstName: p.member.user.firstName,
          lastName: p.member.user.lastName,
          avatarUrl: p.member.user.avatarUrl,
        })),
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              body: lastMsg.body,
              senderName: `${lastMsg.sender.user.firstName} ${lastMsg.sender.user.lastName}`,
              createdAt: lastMsg.createdAt,
            }
          : null,
        hasUnread: !!hasUnread,
        muted: myParticipation?.muted ?? false,
      };
    });
  });

  return c.json(result);
});

// ---------------------------------------------------------------------------
// GET /v1/conversations/:conversationId
// Get single conversation with paginated messages (cursor-based).
// Also marks conversation as read.
// ---------------------------------------------------------------------------
conversations.get('/:conversationId', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const conversationId = c.req.param('conversationId');
  const cursor = c.req.query('cursor');
  const limitParam = c.req.query('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 100) : 50;

  const result = await prisma.withClub(member.clubId, async (tx) => {
    // Verify participation (privacy-by-participation)
    const participation = await tx.conversationParticipant.findUnique({
      where: {
        conversationId_memberId: {
          conversationId,
          memberId: member.memberId,
        },
      },
    });
    if (!participation) return null;

    const conversation = await tx.conversation.findUnique({
      where: { id: conversationId },
      include: {
        team: { select: { id: true, name: true } },
        participants: {
          include: {
            member: {
              include: {
                user: { select: { firstName: true, lastName: true, avatarUrl: true } },
              },
            },
          },
        },
      },
    });
    if (!conversation) return null;

    // Fetch messages (cursor-based pagination)
    const messages = await tx.message.findMany({
      where: {
        conversationId,
        deletedAt: null,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        sender: {
          include: {
            user: { select: { firstName: true, lastName: true, avatarUrl: true } },
          },
        },
      },
    });

    // Mark as read
    await tx.conversationParticipant.update({
      where: {
        conversationId_memberId: {
          conversationId,
          memberId: member.memberId,
        },
      },
      data: { lastReadAt: new Date() },
    });

    return {
      id: conversation.id,
      type: conversation.type,
      title: conversation.title,
      teamId: conversation.teamId,
      teamName: conversation.team?.name ?? null,
      participants: conversation.participants.map((p) => ({
        memberId: p.memberId,
        firstName: p.member.user.firstName,
        lastName: p.member.user.lastName,
        avatarUrl: p.member.user.avatarUrl,
        muted: p.muted,
      })),
      messages: messages.reverse().map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: `${m.sender.user.firstName} ${m.sender.user.lastName}`,
        senderAvatar: m.sender.user.avatarUrl,
        body: m.body,
        createdAt: m.createdAt,
        editedAt: m.editedAt,
      })),
      hasMore: messages.length === limit,
      nextCursor:
        messages.length === limit
          ? messages[0]!.createdAt.toISOString()
          : null,
    };
  });

  if (!result) {
    return c.json({ error: 'Not Found', message: 'Conversation not found or access denied' }, 404);
  }

  return c.json(result);
});

// ---------------------------------------------------------------------------
// POST /v1/conversations
// Create a new conversation. For DMs, deduplicates if one already exists.
// ---------------------------------------------------------------------------
conversations.post(
  '/',
  zValidator('json', CreateConversationInput),
  async (c) => {
    const member = c.get('member');
    if (!member) {
      return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
    }

    const input = c.req.valid('json');

    const result = await prisma.withClub(member.clubId, async (tx) => {
      // Ensure current member is always a participant
      const allParticipantIds = new Set([member.memberId, ...input.participantIds]);

      // For DMs, check if conversation already exists between these 2 members
      if (input.type === 'DM' && allParticipantIds.size === 2) {
        const ids = [...allParticipantIds];
        const existing = await tx.conversation.findFirst({
          where: {
            type: 'DM',
            participants: {
              every: { memberId: { in: ids } },
            },
          },
          include: { participants: true },
        });
        if (existing && existing.participants.length === 2) {
          return { id: existing.id, existed: true };
        }
      }

      const conversation = await tx.conversation.create({
        data: {
          clubId: member.clubId,
          type: input.type,
          title: input.title ?? null,
          teamId: input.teamId ?? null,
          participants: {
            create: [...allParticipantIds].map((memberId) => ({ memberId })),
          },
        },
        include: {
          participants: {
            include: {
              member: {
                include: {
                  user: { select: { firstName: true, lastName: true } },
                },
              },
            },
          },
        },
      });

      return {
        id: conversation.id,
        existed: false,
        type: conversation.type,
        title: conversation.title,
        participants: conversation.participants.map((p) => ({
          memberId: p.memberId,
          firstName: p.member.user.firstName,
          lastName: p.member.user.lastName,
        })),
      };
    });

    return c.json(result, 201);
  },
);

// ---------------------------------------------------------------------------
// POST /v1/conversations/:conversationId/messages
// Send a message. ANNOUNCEMENT conversations: only admins/coaches can post.
// ---------------------------------------------------------------------------
conversations.post(
  '/:conversationId/messages',
  zValidator('json', SendMessageInput),
  async (c) => {
    const member = c.get('member');
    if (!member) {
      return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
    }

    const conversationId = c.req.param('conversationId');
    const { body } = c.req.valid('json');

    const result = await prisma.withClub(member.clubId, async (tx) => {
      // Verify participation
      const participation = await tx.conversationParticipant.findUnique({
        where: {
          conversationId_memberId: {
            conversationId,
            memberId: member.memberId,
          },
        },
      });
      if (!participation) {
        throw Object.assign(new Error('Not a participant'), {
          statusCode: 403,
          code: 'NOT_PARTICIPANT',
        });
      }

      // For ANNOUNCEMENT conversations, only admins/coaches can post
      const conversation = await tx.conversation.findUnique({
        where: { id: conversationId },
      });
      if (conversation?.type === 'ANNOUNCEMENT') {
        const isAdminOrCoach =
          member.clubRoles.some((r) => ['OWNER', 'ADMIN'].includes(r)) ||
          member.teamRoles.some((r) =>
            ['HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'].includes(r.role),
          );
        if (!isAdminOrCoach) {
          throw Object.assign(
            new Error('Only admins and coaches can post in announcements'),
            { statusCode: 403, code: 'ANNOUNCEMENT_RESTRICTED' },
          );
        }
      }

      const message = await tx.message.create({
        data: {
          conversationId,
          senderId: member.memberId,
          body,
        },
        include: {
          sender: {
            include: {
              user: { select: { firstName: true, lastName: true, avatarUrl: true } },
            },
          },
        },
      });

      // Mark as read for sender
      await tx.conversationParticipant.update({
        where: {
          conversationId_memberId: {
            conversationId,
            memberId: member.memberId,
          },
        },
        data: { lastReadAt: new Date() },
      });

      return {
        id: message.id,
        senderId: message.senderId,
        senderName: `${message.sender.user.firstName} ${message.sender.user.lastName}`,
        senderAvatar: message.sender.user.avatarUrl,
        body: message.body,
        createdAt: message.createdAt,
        editedAt: message.editedAt,
      };
    });

    return c.json(result, 201);
  },
);

// ---------------------------------------------------------------------------
// PATCH /v1/conversations/:conversationId/read
// Mark conversation as read.
// ---------------------------------------------------------------------------
conversations.patch('/:conversationId/read', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const conversationId = c.req.param('conversationId');

  await prisma.withClub(member.clubId, async (tx) => {
    await tx.conversationParticipant.update({
      where: {
        conversationId_memberId: {
          conversationId,
          memberId: member.memberId,
        },
      },
      data: { lastReadAt: new Date() },
    });
  });

  return c.json({ ok: true });
});

export { conversations as conversationsRoutes };
