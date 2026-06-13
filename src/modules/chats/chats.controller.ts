import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { CreateChatGroupDto } from './dto/create-chat-group.dto';
import { ListMessagesQueryDto } from './dto/list-messages.dto';
import { SendChatMessageDto } from './dto/send-chat-message.dto';

type RequestCoUser = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Chats')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('groups')
  createGroup(@Req() req: RequestCoUser, @Body() dto: CreateChatGroupDto) {
    return this.chatsService.createGroup(req.user.sub, dto);
  }

  @Get('groups')
  listGroups(@Req() req: RequestCoUser) {
    return this.chatsService.listGroups(req.user.sub);
  }

  @Post(':conversationId/messages')
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Req() req: RequestCoUser,
    @Body() dto: SendChatMessageDto,
  ) {
    return this.chatsService.sendGroupMessage(
      conversationId,
      req.user.sub,
      dto,
    );
  }

  @ApiOperation({ summary: 'Lay lich su tin nhan (cursor pagination)' })
  @Get(':conversationId/messages')
  async listMessages(
    @Param('conversationId') conversationId: string,
    @Req() req: RequestCoUser,
    @Query() query: ListMessagesQueryDto,
  ) {
    const data = await this.chatsService.listHistory(
      conversationId,
      req.user.sub,
      query.cursor,
      query.cursorId,
      query.limit,
    );
    return { success: true, data };
  }
}
