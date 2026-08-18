import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty, IsString, IsEmail, IsEnum, IsOptional, MaxLength, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserType, UserCategory, Status } from '@/domain/enums/enums';
import { ApiProperty } from '@nestjs/swagger';

/**
 * O campo `email` e reescrito aqui sem o validador `@IsEmailUnique` herdado
 * de CreateUserDto: esse validador nao tem como saber qual usuario esta
 * sendo editado (a rota so recebe o `id` via `@Param`, nao no corpo), entao
 * ele sempre tratava o proprio registro como conflito. A checagem de
 * unicidade real continua garantida pela constraint unica do banco (ver
 * PrismaUserRepository), que naturalmente exclui a propria linha sendo
 * atualizada.
 */
export class UpdatePartialUserDto extends PartialType(
  OmitType(CreateUserDto, ['email'] as const),
) {
  @ApiProperty({ description: 'Nome do usuário', example: 'Silva Santos' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255, { message: 'O nome deve ter no máximo 255 caracteres.' })
  name!: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'silva.santos@example.com',
  })
  @IsNotEmpty()
  @IsEmail(
    { allow_display_name: false, require_tld: true },
    { message: 'O email fornecido não é válido.' },
  )
  @MaxLength(254, { message: 'O email deve ter no máximo 254 caracteres.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  email!: string;

  @ApiProperty({
    description: 'Tipo de usuário para o common',
    enum: UserType,
    example: UserType.Pecuarista,
  })
  @IsEnum(UserType)
  userType?: UserType;

  @ApiProperty({
    description: 'Pessoa física ou jurídica',
    enum: UserCategory,
    example: UserCategory.Fisica,
  })
  @IsNotEmpty()
  @IsEnum(UserCategory)
  userCategory!: UserCategory;

  @ApiProperty({ description: 'Estado do usuário', example: 'PE' })
  @IsNotEmpty()
  @Length(2, 2, { message: 'O estado deve ser uma sigla de 2 caracteres (UF).' })
  state!: string;

  @ApiProperty({ description: 'Cidade do usuário', example: 'Belo Jardim' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(100, { message: 'A cidade deve ter no máximo 100 caracteres.' })
  city!: string;

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
