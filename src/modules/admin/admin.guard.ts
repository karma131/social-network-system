import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      user?: { sub: string; email: string; role: string };
    }>();

    if (!request.user) {
      throw new UnauthorizedException('Bạn chưa đăng nhập');
    }

    if (request.user.role !== 'ADMIN') {
      throw new ForbiddenException('Bạn không có quyền truy cập chức năng admin');
    }

    return true;
  }
}