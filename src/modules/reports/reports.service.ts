import { Injectable, NotFoundException } from '@nestjs/common';
import { PostStatus, ReportStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

type ReportWithReporter = Prisma.ReportGetPayload<{
  include: { reporter: { select: { name: true } } };
}>;

const STATUS_TO_DTO: Record<ReportStatus, string> = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Shape a Report row into the DTO the FE/socket expect. */
  private toDTO(r: ReportWithReporter) {
    return {
      id: r.id.toString(),
      reporterId: r.reporterId.toString(),
      reporterName: r.reporter?.name ?? 'Unknown',
      postId: r.postId.toString(),
      postOwnerId: r.postOwnerId ? r.postOwnerId.toString() : undefined,
      postSnapshot: r.postSnapshot,
      reason: r.reason,
      status: STATUS_TO_DTO[r.status],
      createdAt: r.createdAt.getTime(),
    };
  }

  async create(reporterId: string, dto: CreateReportDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: BigInt(dto.postId) },
      select: { id: true, userId: true },
    });
    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    const report = await this.prisma.report.create({
      data: {
        postId: BigInt(dto.postId),
        reporterId: BigInt(reporterId),
        postOwnerId: dto.postOwnerId ? BigInt(dto.postOwnerId) : post.userId,
        reason: dto.reason.slice(0, 1000),
        status: ReportStatus.PENDING,
        postSnapshot: (dto.postSnapshot ?? undefined) as Prisma.InputJsonValue,
      },
      include: { reporter: { select: { name: true } } },
    });

    return {
      message: 'Gửi báo cáo thành công',
      report: this.toDTO(report),
    };
  }

  async list(status?: string) {
    const where: Prisma.ReportWhereInput = {};
    if (status) {
      const upper = status.toUpperCase();
      if (upper in ReportStatus) {
        where.status = upper as ReportStatus;
      }
    }

    const reports = await this.prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { reporter: { select: { name: true } } },
    });

    return {
      message: 'Lấy danh sách báo cáo thành công',
      reports: reports.map((r) => this.toDTO(r)),
    };
  }

  async approve(adminId: string, reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: BigInt(reportId) },
      select: { id: true, postId: true, postOwnerId: true, status: true },
    });
    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    await this.prisma.$transaction([
      this.prisma.post.update({
        where: { id: report.postId },
        data: { status: PostStatus.DELETED, deletedAt: new Date() },
      }),
      this.prisma.report.update({
        where: { id: report.id },
        data: {
          status: ReportStatus.APPROVED,
          resolvedAt: new Date(),
          resolvedById: BigInt(adminId),
        },
      }),
      this.prisma.adminLog.create({
        data: {
          adminId: BigInt(adminId),
          action: 'APPROVE_REPORT',
          targetType: 'POST',
          targetId: report.postId,
          reason: 'Phê duyệt báo cáo và xóa bài viết',
        },
      }),
    ]);

    return {
      message: 'Phê duyệt báo cáo thành công',
      ok: true,
      reportId: report.id.toString(),
      postId: report.postId.toString(),
      postOwnerId: report.postOwnerId
        ? report.postOwnerId.toString()
        : undefined,
    };
  }

  async reject(adminId: string, reportId: string) {
    const report = await this.prisma.report.findUnique({
      where: { id: BigInt(reportId) },
      select: { id: true, postId: true },
    });
    if (!report) {
      throw new NotFoundException('Không tìm thấy báo cáo');
    }

    await this.prisma.report.update({
      where: { id: report.id },
      data: {
        status: ReportStatus.REJECTED,
        resolvedAt: new Date(),
        resolvedById: BigInt(adminId),
      },
    });

    return {
      message: 'Từ chối báo cáo thành công',
      ok: true,
      reportId: report.id.toString(),
      postId: report.postId.toString(),
    };
  }
}
