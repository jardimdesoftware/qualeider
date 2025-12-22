import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '@/common/decorators/response-message.decorator';

interface StandardResponse<T = any> {
  statusCode: number;
  message: string;
  data?: T;
}

/**
 * Interceptor global que padroniza o formato de todas as respostas da API.
 * 
 * Comportamento:
 * - Se a resposta já está formatada (tem statusCode e message), não modifica
 * - Caso contrário, envolve a resposta em { statusCode, message, data }
 * - A mensagem pode ser customizada via @ResponseMessage() ou é gerada automaticamente
 * 
 * @example
 * Antes (controller):
 * ```typescript
 * return {
 *   statusCode: HttpStatus.CREATED,
 *   message: 'Animal criado com sucesso',
 *   data: result,
 * };
 * ```
 * 
 * Depois (controller):
 * ```typescript
 * @ResponseMessage('Animal criado com sucesso')
 * return result; // O interceptor formata automaticamente
 * ```
 */
@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        if (this.isAlreadyFormatted(data)) {
          return data;
        }

        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        // Tenta obter mensagem customizada via decorator
        const customMessage = this.reflector.getAllAndOverride<string>(
          RESPONSE_MESSAGE_KEY,
          [context.getHandler(), context.getClass()],
        );

        const message = customMessage || this.getDefaultMessage(statusCode);

        return {
          statusCode,
          message,
          data,
        } as StandardResponse;
      }),
    );
  }

  private isAlreadyFormatted(data: any): data is StandardResponse {
    // Já tem o formato padrão com statusCode e message
    if (
      data &&
      typeof data === 'object' &&
      'statusCode' in data &&
      'message' in data
    ) {
      return true;
    }

    // É uma resposta paginada (não deve ser envelopada)
    if (
      data &&
      typeof data === 'object' &&
      'data' in data &&
      'total' in data
    ) {
      return true;
    }

    return false;
  }

  private getDefaultMessage(statusCode: number): string {
    const messages: Record<number, string> = {
      [HttpStatus.OK]: 'Operação realizada com sucesso',
      [HttpStatus.CREATED]: 'Recurso criado com sucesso',
      [HttpStatus.NO_CONTENT]: 'Operação realizada com sucesso',
      [HttpStatus.ACCEPTED]: 'Requisição aceita para processamento',
      [HttpStatus.BAD_REQUEST]: 'Requisição inválida',
      [HttpStatus.UNAUTHORIZED]: 'Acesso não autorizado',
      [HttpStatus.FORBIDDEN]: 'Acesso proibido',
      [HttpStatus.NOT_FOUND]: 'Recurso não encontrado',
      [HttpStatus.CONFLICT]: 'Conflito na operação',
      [HttpStatus.INTERNAL_SERVER_ERROR]: 'Erro interno do servidor',
      [HttpStatus.SERVICE_UNAVAILABLE]: 'Servidor indisponível',
    };

    return messages[statusCode] || 'Operação realizada com sucesso';
  }
}
