import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PostVisibility } from '@prisma/client';

export class CreatePostDto {
  @ApiPropertyOptional({
    example: 'Xin chào mọi người, đây là bài viết đầu tiên của tôi.',
    description: 'Nội dung bài viết',
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @ApiProperty({
    enum: PostVisibility,
    example: 'PUBLIC', // 👈 sửa chỗ này
    description: 'Quyền riêng tư của bài viết',
  })
  @IsEnum(PostVisibility)
  visibility!: PostVisibility;
}