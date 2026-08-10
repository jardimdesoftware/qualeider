import { PartialType, OmitType } from '@nestjs/mapped-types';
import { IsEmail, IsEnum, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { Status } from '@/domain/enums/enums';

/**
 * O campo `email` e reescrito aqui sem o validador `@IsEmailUnique`: esse
 * validador nao tem como saber qual usuario esta sendo editado (a rota
 * so recebe o `id` via `@Param`, nao no corpo), entao ele sempre tratava o
 * proprio registro como conflito. A checagem de unicidade real continua
 * garantida pela constraint unica do banco (ver PrismaUserRepository),
 * que naturalmente exclui a propria linha sendo atualizada.
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email'] as const),
) {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'silva.santos@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail(
    { allow_display_name: false, require_tld: true },
    { message: 'O email fornecido não é válido.' },
  )
  @MaxLength(254, { message: 'O email deve ter no máximo 254 caracteres.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email?: string;

  @ApiProperty({
    description: 'Status da conta (Active/Inactive)',
    enum: Status,
    example: Status.Active,
    required: false,
  })
  @IsOptional()
  @IsEnum(Status, { message: 'O status fornecido não é válido.' })
  status?: Status;
}
