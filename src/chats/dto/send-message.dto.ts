import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  conversationId: number;

  @ApiProperty({ example: 'Xin chao' })
  @IsString()
  @IsNotEmpty()
  content: string;
}