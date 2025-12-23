import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator personalizado para extrair o usuário autenticado do request.
 */

export const GetUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
