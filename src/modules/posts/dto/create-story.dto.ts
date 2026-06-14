import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateStoryDto {
  @ApiProperty({ description: 'URL media da upload' })
  @IsUrl()
  mediaUrl!: string;

  @ApiProperty({ enum: ['image', 'video'] })
  @IsIn(['image', 'video'])
  mediaType!: 'image' | 'video';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  caption?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  musicId?: string;
}
