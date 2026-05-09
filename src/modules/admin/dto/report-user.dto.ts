import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export class ReportUserDto {
  @ApiPropertyOptional({ example: 'month', enum: ['week', 'month', 'year'] })
  @IsOptional()
  @IsIn(['week', 'month', 'year'])
  period?: 'week' | 'month' | 'year';
}