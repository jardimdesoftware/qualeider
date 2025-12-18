import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const { status, message } = this.getErrorDetails(exception);

    this.logException(exception, status, message, request);

    response.status(status).json({
      statusCode: status,
      message,
      error: this.getErrorName(status),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private getErrorDetails(exception: PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (exception.code) {
      case 'P2002':
        return {
          status: HttpStatus.CONFLICT,
          // [BR-001] Unicidade de Email
          message: this.handleUniqueConstraintViolation(exception),
        };
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Registro não encontrado',
        };
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Violação de chave estrangeira',
        };
      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'A operação viola uma relação necessária',
        };
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erro interno de banco de dados',
        };
    }
  }

  private handleUniqueConstraintViolation(
    exception: PrismaClientKnownRequestError,
  ): string {
    const meta = exception.meta as { target?: string[] };
    const fields = meta?.target?.join(', ') || 'campo';
    return `Já existe um registro com este ${fields}`;
  }

  private getErrorName(status: number): string {
    const errorNames: Record<number, string> = {
      [HttpStatus.NOT_FOUND]: 'Not Found',
      [HttpStatus.CONFLICT]: 'Conflict',
      [HttpStatus.BAD_REQUEST]: 'Bad Request',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal Server Error',
    };
    return errorNames[status] || 'Internal Server Error';
  }

  private logException(
    exception: PrismaClientKnownRequestError,
    status: number,
    message: string,
    request: any,
  ) {
    const logMessage = `Prisma Error [${exception.code}] on ${request.method} ${request.url}: ${message}`;

    if (status >= 500) {
      this.logger.error(logMessage, exception.stack);
    } else {
      this.logger.warn(logMessage);
    }
  }
}
