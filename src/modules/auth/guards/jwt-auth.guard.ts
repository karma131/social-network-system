import {
  Injectable,
  CanActivate,
  ExecutionContext
} from '@nestjs/common';

@Injectable()
export class JwtAuthGuard implements CanActivate {

  canActivate(
    context: ExecutionContext
  ): boolean {

    const request = context
      .switchToHttp()
      .getRequest();

    // giả lập user đã đăng nhập
    request.user = {
      id: '1',
      email: 'test@gmail.com',
      role: 'user'
    };

    return true;
  }

}
