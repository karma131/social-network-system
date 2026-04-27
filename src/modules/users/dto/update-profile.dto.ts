import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Nguyen Van A',
    description: 'Full name',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  fullName?: string;

  @ApiPropertyOptional({
    example: 'Xin chao, toi la A',
    description: 'Profile bio',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  bio?: string;
}
