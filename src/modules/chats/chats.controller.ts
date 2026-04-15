import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Tạo cuộc trò chuyện' })
  @ApiResponse({ status: 201, description: 'Tạo cuộc trò chuyện thành công' })
  createConversation(@Req() req: any, @Body() body: CreateConversationDto) {
    return this.chatsService.createConversation(req.user.id, body);
  }

  @Post('messages')
  @ApiOperation({ summary: 'Gửi tin nhắn' })
  @ApiResponse({ status: 201, description: 'Gửi tin nhắn thành công' })
  sendMessage(@Req() req: any, @Body() body: SendMessageDto) {
    return this.chatsService.sendMessage(req.user.id, body);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Lấy danh sách cuộc trò chuyện' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách cuộc trò chuyện thành công' })
  getMyConversations(@Req() req: any) {
    return this.chatsService.getMyConversations(req.user.id);
  }

  @Get('messages/:conversationId')
  @ApiOperation({ summary: 'Lấy danh sách tin nhắn' })
  @ApiResponse({ status: 200, description: 'Lấy danh sách tin nhắn thành công' })
  getMessages(
    @Req() req: any,
    @Param('conversationId', ParseIntPipe) conversationId: number,
  ) {
    return this.chatsService.getMessages(req.user.id, conversationId);
  }
}