import { AuthGuard } from '@nestjs/passport';

/**
 * Like JwtAuthGuard but never rejects: if a valid Bearer token is present,
 * `req.user` is populated; otherwise the request continues with `req.user`
 * undefined. Used by the public feed so logged-in viewers get `myReaction`
 * while anonymous viewers still see posts.
 */
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser>(_err: unknown, user: TUser): TUser | undefined {
    return user || undefined;
  }
}
