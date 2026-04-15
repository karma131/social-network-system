import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateCommentDto {
  @ApiPropertyOptional({ example: 'Noi dung comment da sua' })
  @IsOptional()
  @IsString()
  content?: string;
}