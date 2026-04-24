import { ApiProperty } from '@nestjs/swagger';
import { ReactionType } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class ReactPostDto {
  @ApiProperty({
    example: '1',
    description: 'ID bài viết',
  })
  @IsString()
  postId!: string;

  @ApiProperty({
    enum: ReactionType,
    example: 'LIKE',
    description: 'Loại cảm xúc',
  })
  @IsEnum(ReactionType)
  type!: ReactionType;
}