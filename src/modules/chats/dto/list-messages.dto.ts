import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class ListMessagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  cursor?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 30;
}
