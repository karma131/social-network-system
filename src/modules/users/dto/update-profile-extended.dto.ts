import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileExtendedDto {
  @ApiPropertyOptional({ example: 'Nguyen Van A' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  name?: string;

  @ApiPropertyOptional({ example: 'Xin chao, toi la A' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bio?: string;

  @ApiPropertyOptional({ example: 'Ha Noi, Viet Nam' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @ApiPropertyOptional({ example: 'Software Engineer at Acme' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  work?: string;

  @ApiPropertyOptional({ example: 'HUST - K65' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  education?: string;

  @ApiPropertyOptional({ example: 'Single' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  relationship?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.jpg' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  coverUrl?: string;
}
