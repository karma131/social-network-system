import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt } from 'class-validator';

export enum ReactionTypeDto {
  LIKE = 'LIKE',
  LOVE = 'LOVE',
  HAHA = 'HAHA',
  WOW = 'WOW',
  SAD = 'SAD',
  ANGRY = 'ANGRY',
}

export class CreateReactionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  postId: number;

  @ApiProperty({
    enum: ReactionTypeDto,
    example: ReactionTypeDto.LIKE,
  })
  @IsEnum(ReactionTypeDto)
  type: ReactionTypeDto;
}