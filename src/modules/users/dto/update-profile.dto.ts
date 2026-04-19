import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Nguyen Van A',
    description: 'Họ và tên',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Ảnh đại diện',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/cover.jpg',
    description: 'Ảnh bìa',
  })
  @IsOptional()
  @IsString()
  @IsUrl()
  coverUrl?: string;

  @ApiPropertyOptional({
    example: 'Xin chào, tôi là A',
    description: 'Tiểu sử',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bio?: string;
}