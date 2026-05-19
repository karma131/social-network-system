import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({ example: 'Nguyen Van B' })
  @IsString()
  fullName: string;

  @ApiProperty({ example: 'admin2@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'ADMIN', enum: ['USER', 'ADMIN'] })
  @IsEnum(['USER', 'ADMIN'])
  role: 'USER' | 'ADMIN';

  @ApiProperty({ example: 'ACTIVE', required: false })
  @IsOptional()
  status?: 'ACTIVE' | 'BANNED';
}