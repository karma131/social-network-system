import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

type RequestCoUser = Request & {
  user: { sub: string; email: string; role: string };
};

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @ApiOperation({ summary: 'Người dùng báo cáo bài viết' })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateReportDto, @Req() req: RequestCoUser) {
    return this.reportsService.create(req.user.sub, dto);
  }

  @ApiOperation({ summary: 'Admin lấy danh sách báo cáo' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  list(@Query('status') status?: string) {
    return this.reportsService.list(status);
  }

  @ApiOperation({ summary: 'Admin duyệt báo cáo và xóa bài viết' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/approve')
  approve(@Param('id') id: string, @Req() req: RequestCoUser) {
    return this.reportsService.approve(req.user.sub, id);
  }

  @ApiOperation({ summary: 'Admin từ chối báo cáo' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/reject')
  reject(@Param('id') id: string, @Req() req: RequestCoUser) {
    return this.reportsService.reject(req.user.sub, id);
  }
}
