import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { ListMessagesQueryDto } from './dto/list-messages.dto';

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

  @ApiOperation({ summary: 'Lấy lịch sử tin nhắn (cursor pagination)' })
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
      query.limit,
    );
    return { success: true, data };
  }
}
