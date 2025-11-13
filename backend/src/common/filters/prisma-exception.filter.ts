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

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erro interno de banco de dados';

    switch (exception.code) {
      case 'P2002':
        status = HttpStatus.CONFLICT;
        message = this.handleUniqueConstraintViolation(exception);
        break;

      case 'P2025':
        status = HttpStatus.NOT_FOUND;
        message = 'Registro não encontrado';
        break;

      case 'P2003':
        status = HttpStatus.BAD_REQUEST;
        message = 'Violação de chave estrangeira';
        break;

      case 'P2014':
        status = HttpStatus.BAD_REQUEST;
        message = 'A operação viola uma relação necessária';
        break;

      default:
        this.logger.error(
          `[Prisma Error ${exception.code}] ${exception.message}`,
          exception.stack,
        );
        break;
    }

    this.logger.warn(
      `Prisma Error [${exception.code}] on ${request.method} ${request.url}: ${message}`,
    );

    response.status(status).json({
      statusCode: status,
      message,
      error: this.getErrorName(status),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private handleUniqueConstraintViolation(
    exception: PrismaClientKnownRequestError,
  ): string {
    const meta = exception.meta as { target?: string[] };
    const fields = meta?.target?.join(', ') || 'campo';
    return `Já existe um registro com este ${fields}`;
  }

  private getErrorName(status: number): string {
    switch (status) {
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      default:
        return 'Internal Server Error';
    }
  }
}
