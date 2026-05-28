import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { HashtagsController } from './hashtags.controller';
import { HashtagsService } from './hashtags.service';

@Module({
  imports: [PrismaModule],
  controllers: [HashtagsController],
  providers: [HashtagsService],
  exports: [HashtagsService],
})
export class HashtagsModule {}
