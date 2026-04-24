import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateGroupConversationDto {
  @ApiPropertyOptional({
    example: 'Nhóm bạn thân',
    description: 'Tên nhóm chat',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    example: ['2', '3'],
    description: 'Danh sách user id sẽ được thêm vào nhóm',
    type: [String],
  })
  @IsArray()
  participantIds!: string[];
}