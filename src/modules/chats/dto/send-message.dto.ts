import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({
    example: 'Xin chào, bạn khỏe không?',
    description: 'Nội dung tin nhắn',
  })
  @IsString()
  @MaxLength(5000)
  content!: string;

  @ApiPropertyOptional({
    example: '10',
    description: 'ID tin nhắn được reply',
  })
  @IsOptional()
  @IsString()
  replyToMessageId?: string;
}