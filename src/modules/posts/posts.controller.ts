import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post as HttpPost,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { UploadType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { multerDiskStorage } from '../uploads/multer.config';
import { UploadsService } from '../uploads/uploads.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { ReactPostDto } from './dto/react-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { PinPostDto } from './dto/pin-post.dto';
import { PostsService } from './posts.service';

type RequestCoUser = Request & {
  user: {
    sub: string;
    email: string;
    role: string;
  };
};

type RequestMaybeUser = Request & {
  user?: {
    sub: string;
    email: string;
    role: string;
  };
};

@ApiTags('Posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  @HttpPost()
  createPost(@Req() req: RequestCoUser, @Body() dto: CreatePostDto) {
    return this.postsService.createPost(req.user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Tải lên ảnh/video cho bài viết' })
  @HttpPost('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: multerDiskStorage,
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async upload(
    @Req() req: RequestCoUser,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { upload } = await this.uploadsService.saveFile(
      req.user.sub,
      file,
      UploadType.POST_IMAGE,
    );
    const base = `${req.protocol}://${req.get('host')}`;
    // Return just { url } so TransformInterceptor wraps it as data:{ url } —
    // the FE proxy reads body.data.url. (A `message` key would make the
    // interceptor treat the url string itself as `data`.)
    return { url: `${base}${upload.fileUrl}` };
  }

  @ApiBearerAuth('access-token')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách bài viết public' })
  @Get()
  getPublicPosts(@Req() req: RequestMaybeUser) {
    return this.postsService.getPublicPosts(req.user?.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Lấy danh sách bài viết của tôi' })
  @Get('me')
  getMyPosts(@Req() req: RequestCoUser) {
    return this.postsService.getMyPosts(req.user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Lấy chi tiết một bài viết' })
  @Get(':id')
  getPostById(@Param('id') id: string, @Req() req: RequestMaybeUser) {
    return this.postsService.getPostById(id, req.user?.sub);
  }

  @ApiOperation({ summary: 'Lấy bình luận của bài viết' })
  @Get(':id/comments')
  listComments(@Param('id') id: string) {
    return this.postsService.listComments(id);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bình luận bài viết' })
  @HttpPost(':id/comments')
  comment(
    @Param('id') id: string,
    @Req() req: RequestCoUser,
    @Body() dto: CreateCommentDto,
  ) {
    return this.postsService.addComment(id, req.user.sub, dto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Thả/đổi cảm xúc cho bài viết' })
  @HttpPost(':id/react')
  react(
    @Param('id') id: string,
    @Req() req: RequestCoUser,
    @Body() dto: ReactPostDto,
  ) {
    return this.postsService.reactPost(id, req.user.sub, dto.emoji);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Bỏ cảm xúc khỏi bài viết' })
  @Delete(':id/react')
  unreact(@Param('id') id: string, @Req() req: RequestCoUser) {
    return this.postsService.unreactPost(id, req.user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ghim/bỏ ghim bài viết' })
  @HttpPost(':id/pin')
  pin(
    @Param('id') id: string,
    @Req() req: RequestCoUser,
    @Body() dto: PinPostDto,
  ) {
    return this.postsService.pinPost(id, req.user.sub, dto.pinned);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xóa bài viết' })
  @Delete(':id')
  deletePost(@Param('id') id: string, @Req() req: RequestCoUser) {
    return this.postsService.deletePost(id, req.user.sub);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  @Patch(':id')
  updatePost(
    @Param('id') id: string,
    @Req() req: RequestCoUser,
    @Body() dto: UpdatePostDto,
  ) {
    return this.postsService.updatePost(id, req.user.sub, dto);
  }
}