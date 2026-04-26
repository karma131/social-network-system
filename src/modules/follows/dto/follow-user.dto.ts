import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FollowUserDto {
  @ApiProperty({
    example: '2',
    description: 'ID người dùng muốn theo dõi',
  })
  @IsString()
  followingId!: string;
}