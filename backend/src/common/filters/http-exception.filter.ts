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

    const status = this.getStatus(exception);
    const exceptionResponse = this.getExceptionResponse(exception);
    const message = this.getMessage(exceptionResponse);

    this.logException(status, message, exception);

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      error: this.getErrorName(exception),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getStatus(exception: unknown): number {
    return exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getExceptionResponse(exception: unknown): string | object {
    return exception instanceof HttpException
      ? exception.getResponse()
      : { message: 'Internal server error' };
  }

  private getMessage(exceptionResponse: string | object): string | string[] {
    if (typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
      return (exceptionResponse as any).message;
    }
    return exceptionResponse as string;
  }

  private getErrorName(exception: unknown): string {
    return exception instanceof HttpException
      ? exception.name
      : 'InternalServerError';
  }

  private logException(
    status: number,
    message: string | string[] | object,
    exception: unknown,
  ) {
    const logMessage = `[${status}] ${JSON.stringify(message)}`;
    if (status >= 500) {
      this.logger.error(logMessage, (exception as Error).stack);
    } else {
      this.logger.warn(logMessage);
    }
  }
}