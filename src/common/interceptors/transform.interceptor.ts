import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Wraps every controller return into the response envelope the frontend expects:
 *   { success: true, message?, data }
 *
 * Rules (keyed off this BE's uniform `{ message, <oneKey>: payload }` style):
 *  - already has `success`            -> passed through unchanged (auth endpoints)
 *  - `{ message, <oneKey>: payload }` -> { success: true, message, data: payload }
 *  - `{ message }` only               -> { success: true, message }
 *  - anything else                    -> { success: true, data: <value> }
 */
@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(map((payload) => this.wrap(payload)));
  }

  private wrap(payload: unknown): unknown {
    if (payload === null || typeof payload !== 'object') {
      return { success: true, data: payload };
    }

    const obj = payload as Record<string, unknown>;

    if ('success' in obj) {
      return obj;
    }

    if ('message' in obj) {
      const { message, ...rest } = obj;
      const keys = Object.keys(rest);
      if (keys.length === 1) {
        return { success: true, message, data: rest[keys[0]] };
      }
      if (keys.length === 0) {
        return { success: true, message };
      }
    }

    return { success: true, data: payload };
  }
}
