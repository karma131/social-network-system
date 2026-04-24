import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateDirectConversationDto {
  @ApiProperty({
    example: '2',
    description: 'ID người dùng muốn nhắn tin',
  })
  @IsString()
  targetUserId!: string;
}