import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { InviteAction } from '@/domain/enums/enums';

/**
 * DTO para responder a um convite
 * Usuário aceita ou recusa
 */
export class RespondInviteDto {
  @ApiProperty({
    description: 'Resposta ao convite: aceitar ou recusar',
    enum: InviteAction,
    example: InviteAction.ACCEPT,
  })
  @IsEnum(InviteAction, {
    message: 'Resposta deve ser "Accept" ou "Decline"',
  })
  response: InviteAction;
}
