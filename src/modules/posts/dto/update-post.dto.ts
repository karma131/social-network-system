import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PostVisibility } from '@prisma/client';

export class UpdatePostDto {
  @ApiPropertyOptional({
    example: 'Nội dung mới của bài viết',
    description: 'Nội dung bài viết',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  text?: string;

  @ApiPropertyOptional({
    enum: PostVisibility,
    example: 'PUBLIC',
    description: 'Quyền riêng tư',
  })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;

  @ApiPropertyOptional({ description: 'URL ảnh đã upload' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'URL video đã upload' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  // Accepted for FE contract compatibility but not persisted (no BE column).
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  feeling?: Record<string, unknown>;
}
