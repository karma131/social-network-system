import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateCoverDto {
  @ApiPropertyOptional({
    example: 'https://example.com/cover.jpg',
    description: 'Cover URL. Optional when uploading a file.',
  })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  coverUrl?: string;
}
