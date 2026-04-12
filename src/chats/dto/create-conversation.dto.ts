import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsInt } from 'class-validator';

export class CreateConversationDto {
  @ApiProperty({ example: [2] })
  @IsArray()
  @ArrayMinSize(1)
  participantIds: number[];
}