import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { ReactionsModule } from './modules/reactions/reactions.module';
import { FollowsModule } from './modules/follows/follows.module';
import { FriendsModule } from './modules/friends/friends.module';
import { FeedsModule } from './modules/feeds/feeds.module';
import { AdminModule } from './modules/admin/admin.module';
import { ReportsModule } from './modules/reports/reports.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { ChatsModule } from './modules/chats/chats.module';
import { HashtagsModule } from './modules/hashtags/hashtags.module';

@Module({
  imports: [
    AdminModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    ReactionsModule,
    FollowsModule,
    FriendsModule,
    NotificationsModule,
    FeedsModule,
    UploadsModule,
    ChatsModule,
    HashtagsModule,
  ],
})
export class AppModule {}