import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : { message: 'Internal server error' };

    const message =
      typeof exceptionResponse === 'object' && 'message' in exceptionResponse
        ? (exceptionResponse as any).message
        : exceptionResponse;

    if (status >= 500) {
      this.logger.error(`[${status}] ${message}`, (exception as Error).stack);
    } else {
      this.logger.warn(`[${status}] ${message}`);
    }

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      error: exception instanceof HttpException ? exception.name : 'InternalServerError',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}