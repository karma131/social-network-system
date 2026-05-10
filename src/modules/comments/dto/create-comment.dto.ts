import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Bài viết hay quá',
    description: 'Nội dung bình luận',
  })
  @IsString()
  @MaxLength(2000)
  content!: string;

  @ApiProperty({
    example: '1',
    description: 'ID bài viết',
  })
  @IsString()
  postId!: string;

  @ApiPropertyOptional({
    example: '2',
    description: 'ID bình luận cha nếu là trả lời bình luận',
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}