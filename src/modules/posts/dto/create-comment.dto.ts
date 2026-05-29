import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** FE comment body (browser -> /api/posts/:id/comments). */
export class CreateCommentDto {
  @ApiProperty({ example: 'Bình luận của tôi', description: 'Nội dung bình luận' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text!: string;

  // Accepted for FE contract compatibility but not persisted (no Comment column).
  @ApiPropertyOptional({ description: 'URL ảnh đính kèm (chưa hỗ trợ lưu)' })
  @IsOptional()
  @IsString()
  imageUrl?: string;
}
