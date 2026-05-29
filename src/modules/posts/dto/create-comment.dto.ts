import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** FE comment body (browser -> /api/posts/:id/comments). Text OR image required. */
export class CreateCommentDto {
  @ApiPropertyOptional({ example: 'Bình luận của tôi', description: 'Nội dung bình luận' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  text?: string;

  // Accepted for FE contract compatibility but not persisted (no Comment column).
  @ApiPropertyOptional({ description: 'URL ảnh đính kèm (chưa hỗ trợ lưu)' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
