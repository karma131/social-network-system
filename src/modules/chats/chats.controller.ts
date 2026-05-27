import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';
import { CreateGroupConversationDto } from './dto/create-group-conversation.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { SendMessageDto } from './dto/send-message.dto';

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
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @ApiOperation({ summary: 'Tạo cuộc trò chuyện riêng 1-1' })
  @Post('direct')
  createDirectConversation(
    @Req() req: RequestCoUser,
    @Body() dto: CreateDirectConversationDto,
  ) {
    return this.chatsService.createDirectConversation(req.user.sub, dto);
  }

  @ApiOperation({ summary: 'Tạo nhóm chat' })
  @Post('group')
  createGroupConversation(
    @Req() req: RequestCoUser,
    @Body() dto: CreateGroupConversationDto,
  ) {
    return this.chatsService.createGroupConversation(req.user.sub, dto);
  }

  @ApiOperation({ summary: 'Lấy danh sách cuộc trò chuyện của tôi' })
  @ApiBearerAuth('access-token')
  @Get()
  getMyConversations(@Req() req: RequestCoUser) {
    return this.chatsService.getMyConversations(req.user.sub);
  }

  @ApiOperation({ summary: 'Lấy chi tiết một cuộc trò chuyện' })
  @Get(':conversationId')
  getConversationById(
    @Param('conversationId') conversationId: string,
    @Req() req: RequestCoUser,
  ) {
    return this.chatsService.getConversationById(conversationId, req.user.sub);
  }

  @ApiOperation({ summary: 'Gửi tin nhắn text' })
  @Post(':conversationId/messages')
  sendMessage(
    @Param('conversationId') conversationId: string,
    @Req() req: RequestCoUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatsService.sendMessage(conversationId, req.user.sub, dto);
  }

  @ApiOperation({ summary: 'Lấy danh sách tin nhắn của cuộc trò chuyện' })
  @Get(':conversationId/messages')
  getMessages(
    @Param('conversationId') conversationId: string,
    @Req() req: RequestCoUser,
    @Query() query: GetMessagesDto,
  ) {
    return this.chatsService.getMessages(conversationId, req.user.sub, query);
  }

  @ApiOperation({ summary: 'Đánh dấu cuộc trò chuyện đã đọc' })
  @Patch(':conversationId/read')
  markConversationAsRead(
    @Param('conversationId') conversationId: string,
    @Req() req: RequestCoUser,
  ) {
    return this.chatsService.markConversationAsRead(conversationId, req.user.sub);
  }
}
