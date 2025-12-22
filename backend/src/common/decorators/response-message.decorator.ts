import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'responseMessage';

/**
 * Decorator para customizar a mensagem de sucesso de uma rota.
 * Quando não especificado, o interceptor gerará uma mensagem padrão baseada no status HTTP.
 */

export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE_KEY, message);
