import {
  Injectable,
  CanActivate,
  ExecutionContext
} from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {

  canActivate(
    context: ExecutionContext
  ): boolean {

    const request = context
      .switchToHttp()
      .getRequest();

    const user = request.user;

    // giả lập check role
    if (
      user &&
      (user.role === 'admin' || user.role === 'user')
    ) {
      return true;
    }

    return false;
  }

}
