import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      user?: {
        role?: string;
      };
    }>();

    const userRole = request.user?.role?.toUpperCase();
    const canAccess = requiredRoles.some(
      (role) => role.toUpperCase() === userRole,
    );

    if (!canAccess) {
      throw new ForbiddenException('Khong co quyen truy cap');
    }

    return true;
  }
}
