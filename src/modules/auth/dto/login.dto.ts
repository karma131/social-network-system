import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'a@gmail.com',
    description: 'Email người dùng',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: '12345678',
    description: 'Mật khẩu',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
