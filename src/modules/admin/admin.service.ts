import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PostStatus, UserStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async banUser(adminId: string, userId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: BigInt(userId),
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: BigInt(userId),
      },
      data: {
        status: UserStatus.BANNED,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });
    

    await this.prisma.adminLog.create({
      data: {
        adminId: BigInt(adminId),
        action: 'BAN_USER',
        targetType: 'USER',
        targetId: BigInt(userId),
        reason: 'Khóa tài khoản người dùng',
      },
    });

    return {
      message: 'Khóa người dùng thành công',
      user: {
        ...updatedUser,
        id: updatedUser.id.toString(),
      },
    };
  }
  async updateUserRole(adminId: string, userId: string, role: string) {
  // 🔹 validate role
  const validRoles = ['USER', 'ADMIN'];
  if (!validRoles.includes(role)) {
    throw new BadRequestException('Role không hợp lệ');
  }

  // 🔹 check user tồn tại
  const user = await this.prisma.user.findUnique({
    where: { id: BigInt(userId) },
  });

  if (!user) {
    throw new NotFoundException('Không tìm thấy người dùng');
  }

  // ❗ tránh tự hạ quyền chính mình (optional nhưng nên có)
  if (adminId === userId) {
    throw new BadRequestException('Không thể tự thay đổi quyền của chính mình');
  }

  // 🔹 update role
  const updatedUser = await this.prisma.user.update({
    where: { id: BigInt(userId) },
    data: {
      role: role as any,
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      updatedAt: true,
    },
  });

  // 🔹 log
  await this.prisma.adminLog.create({
    data: {
      adminId: BigInt(adminId),
      action: 'UPDATE_ROLE',
      targetType: 'USER',
      targetId: BigInt(userId),
      reason: `Cập nhật role thành ${role}`,
    },
  });

  return {
    message: 'Cập nhật quyền thành công',
    user: {
      ...updatedUser,
      id: updatedUser.id.toString(),
    },
  };
}
async createAdmin(adminId: string, dto: any) {
  const { fullName, email, password, role, status } = dto;

  // 🔹 check email tồn tại
  const existingUser = await this.prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new BadRequestException('Email đã tồn tại');
  }

  // 🔹 hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // 🔹 tạo user
  const newUser = await this.prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash: hashedPassword,
      role: role || 'ADMIN',
      status: status || 'ACTIVE',
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  // 🔹 log admin
  await this.prisma.adminLog.create({
    data: {
      adminId: BigInt(adminId),
      action: 'CREATE_ADMIN',
      targetType: 'USER',
      targetId: newUser.id,
      reason: 'Tạo tài khoản admin mới',
    },
  });

  return {
    message: 'Tạo admin thành công',
    user: {
      ...newUser,
      id: newUser.id.toString(),
    },
  };
}

  async unbanUser(adminId: string, userId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: BigInt(userId),
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const updatedUser = await this.prisma.user.update({
      where: {
        id: BigInt(userId),
      },
      data: {
        status: UserStatus.ACTIVE,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        updatedAt: true,
      },
    });

    await this.prisma.adminLog.create({
      data: {
        adminId: BigInt(adminId),
        action: 'UNBAN_USER',
        targetType: 'USER',
        targetId: BigInt(userId),
        reason: 'Mở khóa tài khoản người dùng',
      },
    });

    return {
      message: 'Mở khóa người dùng thành công',
      user: {
        ...updatedUser,
        id: updatedUser.id.toString(),
      },
    };
  }
  async getUsers(params: {
  page: number;
  limit: number;
  search: string;
}) {
  const { page, limit, search } = params;

  const skip = (page - 1) * limit;

  const users = await this.prisma.user.findMany({
    where: {
      OR: [
        {
          fullName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ],
    },
    skip,
    take: limit,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      fullName: true,
      email: true,
      avatarUrl: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  const total = await this.prisma.user.count({
    where: {
      OR: [
        {
          fullName: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ],
    },
  });

  return {
    message: 'Lấy danh sách người dùng thành công',
    data: users.map((u) => ({
      ...u,
      id: u.id.toString(),
    })),
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

  async hidePost(adminId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: BigInt(postId),
      },
      select: {
        id: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    const updatedPost = await this.prisma.post.update({
      where: {
        id: BigInt(postId),
      },
      data: {
        status: PostStatus.HIDDEN,
      },
      select: {
        id: true,
        userId: true,
        content: true,
        visibility: true,
        status: true,
        updatedAt: true,
      },
    });

    await this.prisma.adminLog.create({
      data: {
        adminId: BigInt(adminId),
        action: 'HIDE_POST',
        targetType: 'POST',
        targetId: BigInt(postId),
        reason: 'Ẩn bài viết',
      },
    });

    return {
      message: 'Ẩn bài viết thành công',
      post: {
        ...updatedPost,
        id: updatedPost.id.toString(),
        userId: updatedPost.userId.toString(),
      },
    };
  }

  async approvePost(adminId: string, postId: string) {
  // 🔹 check tồn tại
  const post = await this.prisma.post.findUnique({
    where: { id: BigInt(postId) },
    select: {
      id: true,
      status: true,
    },
  });

  if (!post) {
    throw new NotFoundException('Không tìm thấy bài viết');
  }

  // 🔹 tránh approve lại
  if (post.status === PostStatus.PUBLISHED) {
    throw new BadRequestException('Bài viết đã được phê duyệt trước đó');
  }

  // 🔹 update status
  const updatedPost = await this.prisma.post.update({
    where: { id: BigInt(postId) },
    data: {
      status: PostStatus.PUBLISHED,
    },
    select: {
      id: true,
      userId: true,
      content: true,
      visibility: true,
      status: true,
      updatedAt: true,
    },
  });

  // 🔹 log admin
  await this.prisma.adminLog.create({
    data: {
      adminId: BigInt(adminId),
      action: 'APPROVE_POST',
      targetType: 'POST',
      targetId: BigInt(postId),
      reason: 'Phê duyệt bài viết',
    },
  });

  return {
    message: 'Phê duyệt bài viết thành công',
    post: {
      ...updatedPost,
      id: updatedPost.id.toString(),
      userId: updatedPost.userId.toString(),
    },
  };
}

async getPosts(query: any) {
  const {
    page = '1',
    limit = '10',
    search = '',
    status,
    sortBy = 'createdAt',
    order = 'desc',
  } = query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  const skip = (pageNumber - 1) * limitNumber;

  // 🔹 filter
  const where: any = {};

  if (search) {
    where.content = {
      contains: search,
      mode: 'insensitive',
    };
  }

  if (status) {
    where.status = status;
  }

  // 🔹 query
  const posts = await this.prisma.post.findMany({
    where,
    skip,
    take: limitNumber,
    orderBy: {
      [sortBy]: order,
    },
    select: {
      id: true,
      content: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
        },
      },
    },
  });

  const total = await this.prisma.post.count({ where });

  return {
    message: 'Lấy danh sách bài viết thành công',
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      total,
      totalPages: Math.ceil(total / limitNumber),
    },
    posts: posts.map((post) => ({
      ...post,
      id: post.id.toString(),
      user: {
        ...post.user,
        id: post.user.id.toString(),
      },
    })),
  };
}

async getUserReport(query: any) {
  const { period = 'month' } = query;

  const now = new Date();
  let startDate = new Date();

  // 🔹 xác định khoảng thời gian
  if (period === 'week') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(now.getMonth() - 1);
  } else if (period === 'year') {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  // 🔹 tổng user
  const totalUsers = await this.prisma.user.count();

  // 🔹 user mới trong khoảng thời gian
  const newUsers = await this.prisma.user.count({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
  });

  // 🔹 user bị khóa
  const bannedUsers = await this.prisma.user.count({
    where: {
      status: UserStatus.BANNED,
    },
  });

  // 🔹 user hoạt động
  const activeUsers = await this.prisma.user.count({
    where: {
      status: UserStatus.ACTIVE,
    },
  });

  return {
    message: 'Lấy báo cáo người dùng thành công',
    period,
    data: {
      totalUsers,
      newUsers,
      bannedUsers,
      activeUsers,
    },
    range: {
      from: startDate,
      to: now,
    },
  };
}

async getPostReport(query: any) {
  const { period = 'month' } = query;

  const now = new Date();
  let startDate = new Date();

  // 🔹 xác định khoảng thời gian
  if (period === 'week') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    startDate.setMonth(now.getMonth() - 1);
  } else if (period === 'year') {
    startDate.setFullYear(now.getFullYear() - 1);
  }

  // 🔹 tổng bài viết
  const totalPosts = await this.prisma.post.count();

  // 🔹 bài viết mới
  const newPosts = await this.prisma.post.count({
    where: {
      createdAt: {
        gte: startDate,
      },
    },
  });

  // 🔹 bài đã publish
  const publishedPosts = await this.prisma.post.count({
    where: {
      status: PostStatus.PUBLISHED,
    },
  });

  // 🔹 bài bị ẩn
  const hiddenPosts = await this.prisma.post.count({
    where: {
      status: PostStatus.HIDDEN,
    },
  });

  // 🔹 bài bị xóa
  const deletedPosts = await this.prisma.post.count({
    where: {
      status: PostStatus.DELETED,
    },
  });

  return {
    message: 'Lấy báo cáo bài viết thành công',
    period,
    data: {
      totalPosts,
      newPosts,
      publishedPosts,
      hiddenPosts,
      deletedPosts,
    },
    range: {
      from: startDate,
      to: now,
    },
  };
}

  async deletePost(adminId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: {
        id: BigInt(postId),
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Không tìm thấy bài viết');
    }

    const deletedPost = await this.prisma.post.update({
      where: {
        id: BigInt(postId),
      },
      data: {
        status: PostStatus.DELETED,
        deletedAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        status: true,
        deletedAt: true,
      },
    });

    await this.prisma.adminLog.create({
      data: {
        adminId: BigInt(adminId),
        action: 'DELETE_POST',
        targetType: 'POST',
        targetId: BigInt(postId),
        reason: 'Xóa mềm bài viết',
      },
    });

    return {
      message: 'Xóa bài viết thành công',
      post: {
        ...deletedPost,
        id: deletedPost.id.toString(),
        userId: deletedPost.userId.toString(),
      },
    };
  }

  async getAdminLogs() {
    const logs = await this.prisma.adminLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        adminId: true,
        action: true,
        targetType: true,
        targetId: true,
        reason: true,
        createdAt: true,
        admin: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    return {
      message: 'Lấy danh sách lịch sử admin thành công',
      logs: logs.map((log) => ({
        ...log,
        id: log.id.toString(),
        adminId: log.adminId.toString(),
        targetId: log.targetId.toString(),
        admin: {
          ...log.admin,
          id: log.admin.id.toString(),
        },
      })),
    };
  }
}
