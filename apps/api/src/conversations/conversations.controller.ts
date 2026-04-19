import { Controller, Get, Post, Patch, Param, Query, Body } from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CurrentMember } from '../auth/decorators/current-member.decorator';
import type { MemberContext } from '../auth/rbac.service';
import { CreateConversationInput, SendMessageInput } from '@club/contracts';
import { RequireFeature } from '../features/feature.decorator';

/**
 * Conversations / messages. Gated by the `messages` feature flag — a club
 * with `features.messages = false` gets 404 on every endpoint below.
 */
@Controller('conversations')
@RequireFeature('messages')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  /** List conversations the current member participates in. */
  @Get()
  async list(@CurrentMember() me: MemberContext) {
    return this.conversations.listConversations(me);
  }

  /** Get conversation detail with messages. */
  @Get(':conversationId')
  async getOne(
    @CurrentMember() me: MemberContext,
    @Param('conversationId') conversationId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.conversations.getConversation(
      me,
      conversationId,
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  /** Create a new conversation. */
  @Post()
  async create(
    @CurrentMember() me: MemberContext,
    @Body() body: any,
  ) {
    const input = CreateConversationInput.parse(body);
    return this.conversations.createConversation(me, input);
  }

  /** Send a message. */
  @Post(':conversationId/messages')
  async sendMessage(
    @CurrentMember() me: MemberContext,
    @Param('conversationId') conversationId: string,
    @Body() body: any,
  ) {
    const input = SendMessageInput.parse(body);
    return this.conversations.sendMessage(me, conversationId, input.body);
  }

  /** Mark conversation as read. */
  @Patch(':conversationId/read')
  async markRead(
    @CurrentMember() me: MemberContext,
    @Param('conversationId') conversationId: string,
  ) {
    return this.conversations.markAsRead(me, conversationId);
  }
}
