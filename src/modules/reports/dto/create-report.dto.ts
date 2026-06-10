import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateReportDto {
  @IsNotEmpty()
  @IsString()
  postId: string;

  @IsOptional()
  @IsString()
  postOwnerId?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(1000)
  reason: string;

  // Opaque post snapshot kept for admin display in the moderation queue.
  @IsOptional()
  postSnapshot?: unknown;
}
