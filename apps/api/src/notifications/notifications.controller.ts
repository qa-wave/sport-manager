import { Controller, Get, Patch, Param, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CurrentMember } from '../auth/decorators/current-member.decorator';
import type { MemberContext } from '../auth/rbac.service';
import { RequireFeature } from '../features/feature.decorator';

@Controller('notifications')
@RequireFeature('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** List notifications (paginated, newest first). */
  @Get()
  async list(
    @CurrentMember() me: MemberContext,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.notifications.listNotifications(me, {
      unreadOnly: unreadOnly === 'true',
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }

  /** Get unread count for badge. */
  @Get('unread-count')
  async unreadCount(@CurrentMember() me: MemberContext) {
    return this.notifications.getUnreadCount(me);
  }

  /** Mark a single notification as read. */
  @Patch(':notificationId/read')
  async markRead(
    @CurrentMember() me: MemberContext,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notifications.markAsRead(me, notificationId);
  }

  /** Mark all notifications as read. */
  @Patch('read-all')
  async markAllRead(@CurrentMember() me: MemberContext) {
    return this.notifications.markAllRead(me);
  }
}
