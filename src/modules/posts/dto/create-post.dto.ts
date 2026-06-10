import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PostVisibility } from '@prisma/client';

export class CreatePostDto {
  @ApiProperty({
    example: 'Xin chào mọi người, đây là bài viết đầu tiên của tôi.',
    description: 'Nội dung bài viết',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  text!: string;

  @ApiPropertyOptional({
    enum: PostVisibility,
    example: 'PUBLIC',
    description: 'Quyền riêng tư của bài viết (mặc định PUBLIC)',
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

  // Accepted for FE contract compatibility but not persisted (no BE columns).
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  feeling?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isLive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  sharedFrom?: Record<string, unknown>;
}
