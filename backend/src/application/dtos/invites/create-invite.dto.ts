import {
  IsInt,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO para criar um convite
 * Associação envia convite para um produtor
 */
export class CreateInviteDto {
  @ApiProperty({
    description: 'ID do usuário (produtor) a ser convidado',
    example: 5,
  })
  @IsInt()
  userId!: number;

  @ApiPropertyOptional({
    description: 'Mensagem personalizada da associação (opcional)',
    example: 'Estamos felizes em convidá-lo para nossa associação!',
    minLength: 10,
    maxLength: 500,
  })
  @IsString()
  @IsOptional()
  @MinLength(10, { message: 'Mensagem deve ter no mínimo 10 caracteres' })
  @MaxLength(500, { message: 'Mensagem deve ter no máximo 500 caracteres' })
  message?: string;
}
