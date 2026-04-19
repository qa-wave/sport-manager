import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { MemberContext } from '../auth/rbac.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List notifications for the current member, newest first.
   * Returns both read and unread, paginated.
   */
  async listNotifications(
    ctx: MemberContext,
    opts: { unreadOnly?: boolean; limit?: number; cursor?: string },
  ) {
    return this.prisma.withClub(ctx.clubId, async (tx) => {
      const where: any = { memberId: ctx.memberId };
      if (opts.unreadOnly) where.read = false;
      if (opts.cursor) where.createdAt = { lt: new Date(opts.cursor) };

      const notifications = await tx.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: opts.limit ?? 20,
      });

      return {
        items: notifications.map((n) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          link: n.link,
          read: n.read,
          createdAt: n.createdAt,
        })),
        hasMore: notifications.length === (opts.limit ?? 20),
        nextCursor:
          notifications.length > 0
            ? notifications[notifications.length - 1]!.createdAt.toISOString()
            : null,
      };
    });
  }

  /**
   * Get unread count for the bell badge.
   */
  async getUnreadCount(ctx: MemberContext) {
    return this.prisma.withClub(ctx.clubId, async (tx) => {
      const count = await tx.notification.count({
        where: { memberId: ctx.memberId, read: false },
      });
      return { count };
    });
  }

  /**
   * Mark one notification as read.
   */
  async markAsRead(ctx: MemberContext, notificationId: string) {
    return this.prisma.withClub(ctx.clubId, async (tx) => {
      await tx.notification.updateMany({
        where: { id: notificationId, memberId: ctx.memberId },
        data: { read: true },
      });
      return { ok: true };
    });
  }

  /**
   * Mark all notifications as read.
   */
  async markAllRead(ctx: MemberContext) {
    return this.prisma.withClub(ctx.clubId, async (tx) => {
      const result = await tx.notification.updateMany({
        where: { memberId: ctx.memberId, read: false },
        data: { read: true },
      });
      return { marked: result.count };
    });
  }

  /**
   * Create a notification for a specific member.
   * Used internally by other services (events, messages, payments).
   */
  async createNotification(
    clubId: string,
    memberId: string,
    data: {
      type: string;
      title: string;
      body?: string;
      link?: string;
    },
  ) {
    return this.prisma.withClub(clubId, async (tx) => {
      return tx.notification.create({
        data: {
          clubId,
          memberId,
          type: data.type as any,
          title: data.title,
          body: data.body,
          link: data.link,
        },
      });
    });
  }

  /**
   * Broadcast a notification to multiple members.
   */
  async broadcastNotification(
    clubId: string,
    memberIds: string[],
    data: {
      type: string;
      title: string;
      body?: string;
      link?: string;
    },
  ) {
    return this.prisma.withClub(clubId, async (tx) => {
      return tx.notification.createMany({
        data: memberIds.map((memberId) => ({
          clubId,
          memberId,
          type: data.type as any,
          title: data.title,
          body: data.body,
          link: data.link,
        })),
      });
    });
  }
}
