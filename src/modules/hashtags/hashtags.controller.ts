import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HashtagsService } from './hashtags.service';
import { ListTrendingDto } from './dto/list-trending.dto';

@ApiTags('Hashtags')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('hashtags')
export class HashtagsController {
  constructor(private readonly hashtagsService: HashtagsService) {}

  @ApiOperation({ summary: 'Lấy hashtag thịnh hành' })
  @Get('trending')
  listTrending(@Query() query: ListTrendingDto) {
    return this.hashtagsService.listTrending(query.limit);
  }

  @ApiOperation({ summary: 'Lấy bài viết theo hashtag' })
  @Get(':tag/posts')
  listPostsByTag(@Param('tag') tag: string) {
    return this.hashtagsService.listPostsByTag(tag);
  }
}
