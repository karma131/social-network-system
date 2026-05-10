<<<<<<< HEAD
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class FilterPostDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({ example: 'hello' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'PUBLISHED' })
  @IsOptional()
  @IsIn(['PUBLISHED', 'HIDDEN', 'DELETED'])
  status?: string;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt', 'likesCount'])
  sortBy?: string;

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
=======
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class FilterPostDto {
  @ApiPropertyOptional({ example: '1' })
  @IsOptional()
  page?: string;

  @ApiPropertyOptional({ example: '10' })
  @IsOptional()
  limit?: string;

  @ApiPropertyOptional({ example: 'hello' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'PUBLISHED' })
  @IsOptional()
  @IsIn(['PUBLISHED', 'HIDDEN', 'DELETED'])
  status?: string;

  @ApiPropertyOptional({ example: 'createdAt' })
  @IsOptional()
  @IsIn(['createdAt', 'likesCount'])
  sortBy?: string;

  @ApiPropertyOptional({ example: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
>>>>>>> origin/main
}