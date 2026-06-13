import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SendChatMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @IsOptional()
  @IsIn(['text', 'image', 'file', 'video'])
  type?: 'text' | 'image' | 'file' | 'video';

  @IsOptional()
  @IsString()
  replyToId?: string;
}
