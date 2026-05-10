import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL. Optional when uploading a file.',
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  avatarUrl?: string;
}
