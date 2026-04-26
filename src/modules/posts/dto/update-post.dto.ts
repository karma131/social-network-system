import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PostVisibility } from '@prisma/client';

export class UpdatePostDto {
  @ApiPropertyOptional({
    example: 'Nội dung mới của bài viết',
    description: 'Nội dung bài viết',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiPropertyOptional({
    enum: PostVisibility,
    example: 'PUBLIC',
    description: 'Quyền riêng tư',
  })
  @IsOptional()
  @IsEnum(PostVisibility)
  visibility?: PostVisibility;
}