import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'a@gmail.com',
    description: 'Email người dùng',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '123456',
    description: 'Mật khẩu',
  })
  @IsString()
  @MinLength(6)
  password!: string;
}