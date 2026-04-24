import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({
    example: 'Tôi đã sửa lại nội dung bình luận',
    description: 'Nội dung bình luận mới',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;
}