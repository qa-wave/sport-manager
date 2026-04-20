import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService, type MemberContext } from '../auth/rbac.service';
import type { CreateConversationInput } from '@branik/contracts';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly rbac: RbacService,
  ) {}

  /**
   * List conversations the current member participates in.
   * Returns summary with last message + unread count.
   */
  async listConversations(ctx: MemberContext) {
    return this.prisma.withClub(ctx.clubId, async (tx) => {
      const conversations = await tx.conversation.findMany({
        where: {
          participants: { some: { memberId: ctx.memberId } },
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
      const sorted = conversations.sort((a, b) => {
        const aTime = a.messages[0]?.createdAt ?? a.createdAt;
        const bTime = b.messages[0]?.createdAt ?? b.createdAt;
        return bTime.getTime() - aTime.getTime();
      });

      return sorted.map((conv) => {
        const myParticipation = conv.participants.find(
          (p) => p.memberId === ctx.memberId,
        );
        const lastReadAt = myParticipation?.lastReadAt;
        const lastMsg = conv.messages[0] ?? null;

        // Count unread: messages after lastReadAt
        // (For efficiency, we only check against the last message here.
        //  A full unread count would need a separate query.)
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
  }

  /**
   * Get a single conversation with paginated messages.
   * Also marks the conversation as read.
   */
  async getConversation(
    ctx: MemberContext,
    conversationId: string,
    cursor?: string,
    limit = 50,
  ) {
    return this.prisma.withClub(ctx.clubId, async (tx) => {
      // Verify membership
      const participation = await tx.conversationParticipant.findUnique({
        where: {
          conversationId_memberId: {
            conversationId,
            memberId: ctx.memberId,
          },
        },
      });
      if (!participation) {
        throw new ForbiddenException('Not a participant');
      }

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
      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }

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
            memberId: ctx.memberId,
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
  }

  /**
   * Send a message to a conversation.
   */
  async sendMessage(ctx: MemberContext, conversationId: string, body: string) {
    return this.prisma.withClub(ctx.clubId, async (tx) => {
      // Verify membership
      const participation = await tx.conversationParticipant.findUnique({
        where: {
          conversationId_memberId: {
            conversationId,
            memberId: ctx.memberId,
          },
        },
      });
      if (!participation) {
        throw new ForbiddenException('Not a participant');
      }

      // For ANNOUNCEMENT conversations, only admins/coaches can post
      const conversation = await tx.conversation.findUnique({
        where: { id: conversationId },
      });
      if (conversation?.type === 'ANNOUNCEMENT') {
        const isAdminOrCoach =
          ctx.clubRoles.some((r) => ['OWNER', 'ADMIN'].includes(r)) ||
          ctx.teamRoles.some((r) =>
            ['HEAD_COACH', 'ASSISTANT_COACH', 'TEAM_MANAGER'].includes(r.role),
          );
        if (!isAdminOrCoach) {
          throw new ForbiddenException(
            'Only admins and coaches can post in announcements',
          );
        }
      }

      const message = await tx.message.create({
        data: {
          conversationId,
          senderId: ctx.memberId,
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
            memberId: ctx.memberId,
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
  }

  /**
   * Create a new conversation.
   */
  async createConversation(ctx: MemberContext, input: CreateConversationInput) {
    return this.prisma.withClub(ctx.clubId, async (tx) => {
      // Ensure current member is included in participants
      const allParticipantIds = new Set([ctx.memberId, ...input.participantIds]);

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
          include: {
            participants: true,
          },
        });
        if (existing && existing.participants.length === 2) {
          return { id: existing.id, existed: true };
        }
      }

      const conversation = await tx.conversation.create({
        data: {
          clubId: ctx.clubId,
          type: input.type,
          title: input.title ?? null,
          teamId: input.teamId ?? null,
          participants: {
            create: [...allParticipantIds].map((memberId) => ({
              memberId,
            })),
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
  }

  /**
   * Mark conversation as read.
   */
  async markAsRead(ctx: MemberContext, conversationId: string) {
    return this.prisma.withClub(ctx.clubId, async (tx) => {
      await tx.conversationParticipant.update({
        where: {
          conversationId_memberId: {
            conversationId,
            memberId: ctx.memberId,
          },
        },
        data: { lastReadAt: new Date() },
      });
      return { ok: true };
    });
  }
}
