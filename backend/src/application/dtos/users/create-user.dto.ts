import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Length,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserCategory, UserType } from '@/domain/enums/enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmailUnique } from '@/common/decorators/is-email-unique.decorator';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome do usuário', example: 'Silva Santos' })
  @IsNotEmpty({ message: 'O nome não pode ser vazio.' })
  @IsString({ message: 'O nome deve ser uma string.' })
  @Length(3, 255, { message: 'O nome deve ter entre 3 e 255 caracteres.' })
  name!: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'silva.santos@example.com',
  })
  @IsNotEmpty({ message: 'O email não pode ser vazio.' })
  @IsEmail(
    { allow_display_name: false, require_tld: true },
    { message: 'O email fornecido não é válido.' },
  )
  @MaxLength(254, { message: 'O email deve ter no máximo 254 caracteres.' }) // RFC 5321
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmailUnique({ message: 'Este e-mail já está cadastrado no sistema.' })
  email!: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'Leite@123' })
  @IsNotEmpty({ message: 'A senha não pode ser vazia.' })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  // [BR-003] Validação de Senha
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&).',
    },
  )
  password!: string;

  @ApiProperty({
    description: 'Tipo de usuário',
    enum: UserType,
    example: UserType.Pecuarista,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserType, {
    message: 'O tipo de usuário (userType) fornecido não é válido.',
  })
  userType?: UserType;

  @ApiProperty({
    description: 'Pessoa física ou jurídica',
    enum: UserCategory,
    example: UserCategory.Fisica,
  })
  @IsNotEmpty({ message: 'A categoria do usuário é obrigatória.' })
  @IsEnum(UserCategory, {
    message: 'A categoria de usuário fornecida não é válida.',
  })
  userCategory!: UserCategory;

  @ApiProperty({
    description: 'CPF ou CNPJ do usuário',
    example: '12345678000190',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O documento deve ser uma string.' })
  document?: string;

  @ApiProperty({ description: 'Estado do usuário (UF)', example: 'PE' })
  @IsNotEmpty({ message: 'O estado não pode ser vazio.' })
  @Length(2, 2, {
    message: 'O estado deve ser uma sigla de 2 caracteres (UF).',
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  state!: string;

  @ApiProperty({ description: 'Cidade do usuário', example: 'Belo Jardim' })
  @IsNotEmpty({ message: 'A cidade não pode ser vazia.' })
  @IsString()
  city!: string;

  @ApiProperty({
    description: 'ID da organização (associação) do usuário',
    example: 1,
    required: false,
  })
  @IsOptional()
  associationId?: number;
}
