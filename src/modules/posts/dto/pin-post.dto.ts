import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

/** FE pin body (browser -> /api/posts/:id/pin). true pins, false unpins. */
export class PinPostDto {
  @ApiProperty({ example: true, description: 'true để ghim, false để bỏ ghim' })
  @IsBoolean()
  pinned!: boolean;
}
