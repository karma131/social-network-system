import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Global error envelope: { success: false, message } at the right HTTP status.
 * Normalizes NestJS's default `{ statusCode, message, error }` (where `message`
 * may be a string[] for validation errors) into a single `message` string so
 * the frontend proxy can read `data.message` and relay the status.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    res.status(status).json({ success: false, message: this.message(exception) });
  }

  private message(exception: unknown): string {
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') return body;
      const msg = (body as { message?: unknown }).message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string') return msg;
      return exception.message;
    }
    return 'Internal server error';
  }
}
