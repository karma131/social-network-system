import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
<<<<<<< HEAD
import { MailService } from './mail.service';
=======
>>>>>>> origin/main

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AuthController],
<<<<<<< HEAD
  providers: [AuthService, JwtStrategy, MailService,],
=======
  providers: [AuthService, JwtStrategy],
>>>>>>> origin/main
  exports: [AuthService],
})
export class AuthModule {}
