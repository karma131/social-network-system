import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/** FE react body: a lowercase ReactionId (like|love|care|haha|wow|sad|angry). */
export class ReactPostDto {
  @ApiProperty({
    example: 'haha',
    description: 'Loại cảm xúc (like, love, care, haha, wow, sad, angry)',
  })
  @IsString()
  @IsNotEmpty()
  emoji!: string;
}
