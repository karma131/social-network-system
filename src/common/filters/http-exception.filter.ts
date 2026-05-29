import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

/**
 * Global error envelope: { success: false, message } at the right HTTP status.
 * Normalizes NestJS's default `{ statusCode, message, error }` (where `message`
 * may be a string[] for validation errors) into a single `message` string so
 * the frontend proxy can read `data.message` and relay the status.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    const req = http.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Log the real stack for unexpected (non-HTTP) errors — otherwise the
    // generic "Internal server error" hides the cause in deployed logs.
    if (!(exception instanceof HttpException)) {
      this.logger.error(
        `Unhandled error on ${req.method} ${req.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

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
