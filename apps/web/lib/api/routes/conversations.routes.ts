import { EventEmitter } from 'events';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { CreateConversationInput, SendMessageInput } from '@sport-manager/contracts';
import { prisma } from '../prisma';
import { requireAuth } from '../middleware/rbac.middleware';
import { sendPushToUser } from '../services/push.service';
import type { HonoEnv } from '../../types/hono';

/**
 * In-memory event emitter for real-time SSE chat.
 * When a message is POSTed, we emit an event that all SSE listeners pick up.
 * This is intentionally simple — no Redis pub/sub needed for MVP.
 */
const messageEmitter = new EventEmitter();
messageEmitter.setMaxListeners(200);

// Typing state: conversationId -> Map<memberId, { name, expiresAt }>
const typingState = new Map<string, Map<string, { name: string; expiresAt: number }>>();

// Periodic cleanup of expired typing entries to prevent unbounded growth.
// Runs every 60s, removes entries whose 3s window has long passed.
const typingCleanupRef = (globalThis as { __typingCleanup?: NodeJS.Timeout }).__typingCleanup;
if (typingCleanupRef) clearInterval(typingCleanupRef);
(globalThis as { __typingCleanup?: NodeJS.Timeout }).__typingCleanup = setInterval(() => {
  const now = Date.now();
  for (const [conversationId, perMember] of typingState) {
    for (const [memberId, entry] of perMember) {
      if (entry.expiresAt < now - 30_000) perMember.delete(memberId);
    }
    if (perMember.size === 0) typingState.delete(conversationId);
  }
}, 60_000);

type MessageReaction = { emoji: string; memberId: string };

/**
 * /v1/conversations — inbox, chat, create, read.
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

    // Batch-fetch unread counts for all conversations
    const unreadCounts = await Promise.all(
      sorted.map(async (conv) => {
        const myParticipation = conv.participants.find(
          (p) => p.memberId === member.memberId,
        );
        const lastReadAt = myParticipation?.lastReadAt;
        return tx.message.count({
          where: {
            conversationId: conv.id,
            deletedAt: null,
            senderId: { not: member.memberId },
            ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
          },
        });
      }),
    );

    return sorted.map((conv, idx) => {
      const myParticipation = conv.participants.find(
        (p) => p.memberId === member.memberId,
      );
      const lastMsg = conv.messages[0] ?? null;
      const unreadCount = unreadCounts[idx] ?? 0;

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
        hasUnread: unreadCount > 0,
        unreadCount,
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
    const now = new Date();
    await tx.conversationParticipant.update({
      where: {
        conversationId_memberId: {
          conversationId,
          memberId: member.memberId,
        },
      },
      data: { lastReadAt: now },
    });

    // Build readBy for each message: participants whose lastReadAt >= message.createdAt
    // After updating our own lastReadAt to now, we fetch all participants' lastReadAt
    const allParticipants = await tx.conversationParticipant.findMany({
      where: { conversationId },
      select: { memberId: true, lastReadAt: true },
    });

    const orderedMessages = messages.reverse();

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
      messages: orderedMessages.map((m) => {
        const readBy = allParticipants
          .filter(
            (p) =>
              p.memberId !== m.senderId &&
              p.lastReadAt != null &&
              p.lastReadAt >= m.createdAt,
          )
          .map((p) => p.memberId);
        return {
          id: m.id,
          senderId: m.senderId,
          senderName: `${m.sender.user.firstName} ${m.sender.user.lastName}`,
          senderAvatar: m.sender.user.avatarUrl,
          body: m.body,
          reactions: (m.reactions as MessageReaction[] | null) ?? [],
          createdAt: m.createdAt,
          editedAt: m.editedAt,
          readBy,
        };
      }),
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

      const newMessage = {
        id: message.id,
        senderId: message.senderId,
        senderName: `${message.sender.user.firstName} ${message.sender.user.lastName}`,
        senderAvatar: message.sender.user.avatarUrl,
        body: message.body,
        reactions: [] as MessageReaction[],
        createdAt: message.createdAt,
        editedAt: message.editedAt,
        readBy: [] as string[],
      };

      // Broadcast to all SSE subscribers for this conversation
      messageEmitter.emit(`conversation:${conversationId}`, { type: 'message', data: newMessage });

      // Push notification to other participants (fire-and-forget)
      sendMessagePushNotifications({
        conversationId,
        senderMemberId: member.memberId,
        senderName: newMessage.senderName,
        body,
        clubId: member.clubId,
      }).catch((err) => console.error('[conversations] sendMessagePushNotifications failed:', err));

      return newMessage;
    });

    return c.json(result, 201);
  },
);

// ---------------------------------------------------------------------------
// POST /v1/conversations/:conversationId/read
// Mark conversation as read (updates lastReadAt).
// ---------------------------------------------------------------------------
conversations.post('/:conversationId/read', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const conversationId = c.req.param('conversationId');

  await prisma.withClub(member.clubId, async (tx) => {
    await tx.conversationParticipant.updateMany({
      where: {
        conversationId,
        memberId: member.memberId,
      },
      data: { lastReadAt: new Date() },
    });
  });

  // Broadcast read receipt event to SSE subscribers
  messageEmitter.emit(`conversation:${conversationId}`, {
    type: 'read',
    data: { memberId: member.memberId, readAt: new Date().toISOString() },
  });

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// PATCH /v1/conversations/:conversationId/read
// Mark conversation as read (legacy — kept for backward compat).
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

// ---------------------------------------------------------------------------
// POST /v1/conversations/:conversationId/typing
// Broadcast typing indicator to SSE subscribers.
// ---------------------------------------------------------------------------
conversations.post('/:conversationId/typing', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const conversationId = c.req.param('conversationId');

  // Verify participation
  const participation = await prisma.withClub(member.clubId, async (tx) => {
    return tx.conversationParticipant.findUnique({
      where: {
        conversationId_memberId: { conversationId, memberId: member.memberId },
      },
      select: { memberId: true },
    });
  });
  if (!participation) {
    return c.json({ error: 'Not Found' }, 404);
  }

  // Fetch member name for the typing indicator
  const memberData = await prisma.member.findUnique({
    where: { id: member.memberId },
    select: { user: { select: { firstName: true } } },
  });
  const name = memberData?.user.firstName ?? 'Někdo';

  // Update in-memory typing state (expires in 3s)
  if (!typingState.has(conversationId)) {
    typingState.set(conversationId, new Map());
  }
  typingState.get(conversationId)!.set(member.memberId, {
    name,
    expiresAt: Date.now() + 3000,
  });

  // Broadcast to SSE subscribers (excluding sender — handled client-side)
  messageEmitter.emit(`conversation:${conversationId}`, {
    type: 'typing',
    data: { memberId: member.memberId, name },
  });

  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// POST /v1/conversations/:conversationId/messages/:messageId/react
// Toggle emoji reaction on a message.
// ---------------------------------------------------------------------------
conversations.post(
  '/:conversationId/messages/:messageId/react',
  zValidator('json', z.object({ emoji: z.string().max(10) })),
  async (c) => {
    const member = c.get('member');
    if (!member) {
      return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
    }

    const conversationId = c.req.param('conversationId');
    const messageId = c.req.param('messageId');
    const { emoji } = c.req.valid('json');

    const result = await prisma.withClub(member.clubId, async (tx) => {
      // Verify participation
      const participation = await tx.conversationParticipant.findUnique({
        where: {
          conversationId_memberId: { conversationId, memberId: member.memberId },
        },
      });
      if (!participation) return null;

      const message = await tx.message.findFirst({
        where: { id: messageId, conversationId, deletedAt: null },
        select: { id: true, reactions: true },
      });
      if (!message) return null;

      const existing = (message.reactions as MessageReaction[] | null) ?? [];
      const idx = existing.findIndex(
        (r) => r.emoji === emoji && r.memberId === member.memberId,
      );

      let updated: MessageReaction[];
      if (idx >= 0) {
        // Toggle off — remove the reaction
        updated = existing.filter((_, i) => i !== idx);
      } else {
        // Toggle on — add the reaction
        updated = [...existing, { emoji, memberId: member.memberId }];
      }

      await tx.message.update({
        where: { id: messageId },
        data: { reactions: updated },
      });

      return { messageId, reactions: updated };
    });

    if (!result) {
      return c.json({ error: 'Not Found', message: 'Message not found or access denied' }, 404);
    }

    // Broadcast reaction update to SSE subscribers
    messageEmitter.emit(`conversation:${conversationId}`, {
      type: 'reaction',
      data: result,
    });

    return c.json(result);
  },
);

// ---------------------------------------------------------------------------
// GET /v1/conversations/:conversationId/stream
// Server-Sent Events endpoint for real-time messages.
// ---------------------------------------------------------------------------
conversations.get('/:conversationId/stream', async (c) => {
  const member = c.get('member');
  if (!member) {
    return c.json({ error: 'Forbidden', message: 'Club membership required' }, 403);
  }

  const conversationId = c.req.param('conversationId');

  // Verify participation before opening the stream
  const participation = await prisma.withClub(member.clubId, async (tx) => {
    return tx.conversationParticipant.findUnique({
      where: {
        conversationId_memberId: {
          conversationId,
          memberId: member.memberId,
        },
      },
    });
  });

  if (!participation) {
    return c.json({ error: 'Not Found', message: 'Conversation not found or access denied' }, 404);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Controller may be closed — ignore
        }
      };

      // Heartbeat every 30s to keep the connection alive through proxies
      const heartbeat = setInterval(() => send({ type: 'heartbeat' }), 30_000);

      // Listen for all events in this conversation (messages, typing, reactions, reads)
      const handler = (event: unknown) => {
        // Don't echo typing events back to the sender
        if (
          event &&
          typeof event === 'object' &&
          (event as { type: string }).type === 'typing' &&
          (event as { data: { memberId: string } }).data?.memberId === member.memberId
        ) {
          return;
        }
        send(event);
      };
      messageEmitter.on(`conversation:${conversationId}`, handler);

      // Cleanup when client disconnects
      c.req.raw.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        messageEmitter.off(`conversation:${conversationId}`, handler);
        try { controller.close(); } catch { /* already closed */ }
      });

      // Initial connected event
      send({ type: 'connected', conversationId });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
});

// ---------------------------------------------------------------------------
// Internal helper — push "new message" notification to all participants
// except the sender.
// ---------------------------------------------------------------------------
async function sendMessagePushNotifications(opts: {
  conversationId: string;
  senderMemberId: string;
  senderName: string;
  body: string;
  clubId: string;
}): Promise<void> {
  try {
    const participants = await prisma.conversationParticipant.findMany({
      where: {
        conversationId: opts.conversationId,
        memberId: { not: opts.senderMemberId },
        muted: false,
      },
      select: { member: { select: { userId: true } } },
    });

    const preview = opts.body.length > 80 ? `${opts.body.slice(0, 80)}...` : opts.body;

    await Promise.all(
      participants.map(({ member }) =>
        sendPushToUser(member.userId, {
          title: opts.senderName,
          body: preview,
          url: `/admin/messages`,
          tag: `conversation-${opts.conversationId}`,
        }),
      ),
    );
  } catch (err) {
    console.error('[push] Failed to send message push notifications:', err);
  }
}

export { conversations as conversationsRoutes };
