<<<<<<< HEAD
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    example: 'ADMIN',
  })
  @IsString()
  @IsIn(['USER', 'ADMIN'])
  role: string;
=======
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({
    example: 'ADMIN',
  })
  @IsString()
  @IsIn(['USER', 'ADMIN'])
  role: string;
>>>>>>> origin/main
}