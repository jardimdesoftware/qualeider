import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para responder a um convite
 * Usuário aceita ou recusa
 */
export class RespondInviteDto {
  @ApiProperty({
    description: 'Resposta ao convite: aceitar ou recusar',
    enum: ['accept', 'decline'],
    example: 'accept',
  })
  @IsEnum(['accept', 'decline'], {
    message: 'Resposta deve ser "accept" ou "decline"',
  })
  response: 'accept' | 'decline';
}
