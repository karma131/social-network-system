import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum UserStatusDto {
  ACTIVE = 'ACTIVE',
  BLOCKED = 'BLOCKED',
}

export class UpdateUserStatusDto {
  @ApiProperty({
    enum: UserStatusDto,
    example: UserStatusDto.BLOCKED,
  })
  @IsEnum(UserStatusDto)
  status: UserStatusDto;
}