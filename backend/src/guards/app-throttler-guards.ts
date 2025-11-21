import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async handleRequest(
    requestProps: ThrottlerRequest
  ): Promise<boolean> {
    const { context } = requestProps;
    const req = context.switchToHttp().getRequest();

    // Essa lógica SÓ roda se a variável de ambiente confirmar que é TESTE.
    // Em produção, (isTestEnv) será falso e o código pula direto para o super.handleRequest
    const isTestEnv = process.env.NODE_ENV === 'test' || process.env.IS_E2E_TEST === 'true';
    const hasVipPass = req.headers['x-e2e-bypass'] === 'true';

    if (isTestEnv && hasVipPass) {
      return true; 
    }

    return super.handleRequest(requestProps);
  }
}