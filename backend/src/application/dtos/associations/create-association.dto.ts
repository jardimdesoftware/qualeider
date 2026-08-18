import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Length,
  Matches,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CoverageArea } from '@/domain/enums/enums';
import { IsAssociationEmailUnique } from '@/common/decorators/is-association-email-unique.decorator';
import { IsCnpjUnique } from '@/common/decorators/is-cnpj-unique.decorator';

export class CreateAssociationDto {
  @ApiProperty({
    description: 'Razão Social da Associação',
    example: 'Associação dos Produtores de Leite de Belo Jardim',
  })
  @IsNotEmpty({ message: 'A razão social não pode ser vazia.' })
  @IsString({ message: 'A razão social deve ser uma string.' })
  @Length(3, 255, {
    message: 'A razão social deve ter entre 3 e 255 caracteres.',
  })
  name!: string;

  @ApiProperty({
    description: 'Nome Fantasia da Associação',
    example: 'APLBJ',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O nome fantasia deve ser uma string.' })
  @Length(2, 100, {
    message: 'O nome fantasia deve ter entre 2 e 100 caracteres.',
  })
  tradeName?: string;

  @ApiProperty({
    description: 'CNPJ da Associação',
    example: '12345678000190',
  })
  @IsNotEmpty({ message: 'O CNPJ não pode ser vazio.' })
  @IsString({ message: 'O CNPJ deve ser uma string.' })
  @Length(14, 14, { message: 'O CNPJ deve ter 14 caracteres.' })
  @Matches(/^\d{14}$/, { message: 'O CNPJ deve conter apenas números.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.replace(/\D/g, '') : value,
  ) // Remove non-digits
  @IsCnpjUnique({ message: 'Este CNPJ já está cadastrado no sistema.' })
  cnpj!: string;

  @ApiProperty({
    description: 'Inscrição Estadual',
    example: '123456789',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'A inscrição estadual deve ser uma string.' })
  @MaxLength(20, { message: 'A inscrição estadual deve ter no máximo 20 caracteres.' })
  stateRegistration?: string;

  @ApiProperty({
    description: 'Email institucional da Associação',
    example: 'contato@associacao.org.br',
  })
  @IsNotEmpty({ message: 'O email não pode ser vazio.' })
  @IsEmail(
    { allow_display_name: false, require_tld: true },
    { message: 'O email fornecido não é válido.' },
  )
  @MaxLength(254, { message: 'O email deve ter no máximo 254 caracteres.' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsAssociationEmailUnique({
    message: 'Este e-mail já está cadastrado no sistema.',
  })
  email!: string;

  @ApiProperty({ description: 'Senha da Associação', example: 'Senha@123' })
  @IsNotEmpty({ message: 'A senha não pode ser vazia.' })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  @MaxLength(72, { message: 'A senha deve ter no máximo 72 caracteres.' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&).',
    },
  )
  password!: string;

  @ApiProperty({
    description: 'Telefone Principal',
    example: '8737211234',
  })
  @IsNotEmpty({ message: 'O telefone não pode ser vazio.' })
  @IsString({ message: 'O telefone deve ser uma string.' })
  @MaxLength(20, { message: 'O telefone deve ter no máximo 20 caracteres.' })
  phone!: string; // Frontend envia 'phone'

  @IsOptional()
  @IsString({ message: 'O telefone deve ser uma string.' })
  @MaxLength(20, { message: 'O telefone deve ter no máximo 20 caracteres.' })
  landlinePhone?: string; // Trocado para opcional pois vem como 'phone'

  @ApiProperty({
    description: 'Telefone Celular/WhatsApp',
    example: '87999999999',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O telefone celular deve ser uma string.' })
  @MaxLength(20, { message: 'O telefone celular deve ter no máximo 20 caracteres.' })
  mobilePhone?: string;

  @IsOptional()
  @IsString({ message: 'O site deve ser uma string.' })
  @MaxLength(255, { message: 'O site deve ter no máximo 255 caracteres.' })
  website?: string;

  @IsOptional()
  @IsString({ message: 'O CEP deve ser uma string.' })
  @MaxLength(9, { message: 'O CEP deve ter no máximo 9 caracteres.' })
  zipCode?: string;

  @ApiProperty({
    description: 'Estado (UF) da Associação',
    example: 'PE',
  })
  @IsNotEmpty({ message: 'O estado não pode ser vazio.' })
  @Length(2, 2, {
    message: 'O estado deve ser uma sigla de 2 caracteres (UF).',
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  state!: string;

  @ApiProperty({
    description: 'Cidade da Associação',
    example: 'Belo Jardim',
  })
  @IsNotEmpty({ message: 'A cidade não pode ser vazia.' })
  @IsString()
  @MaxLength(100, { message: 'A cidade deve ter no máximo 100 caracteres.' })
  city!: string;

  @IsOptional()
  @IsString({ message: 'A rua deve ser uma string.' })
  @MaxLength(255, { message: 'A rua deve ter no máximo 255 caracteres.' })
  street?: string;

  @IsOptional()
  @IsString({ message: 'O número deve ser uma string.' })
  @MaxLength(20, { message: 'O número deve ter no máximo 20 caracteres.' })
  number?: string;

  @IsOptional()
  @IsString({ message: 'O complemento deve ser uma string.' })
  @MaxLength(100, { message: 'O complemento deve ter no máximo 100 caracteres.' })
  complement?: string;

  @IsOptional()
  @IsString({ message: 'O bairro deve ser uma string.' })
  @MaxLength(100, { message: 'O bairro deve ter no máximo 100 caracteres.' })
  neighborhood?: string;

  @IsOptional()
  @IsString({ message: 'A data de fundação deve ser uma string.' })
  @MaxLength(20, { message: 'A data de fundação deve ter no máximo 20 caracteres.' })
  foundationDate?: string;

  @IsOptional()
  numberOfMembers?: number;

  @ApiProperty({
    description: 'Área de Atuação da Associação',
    enum: CoverageArea,
    example: CoverageArea.Municipal,
  })
  @IsNotEmpty({ message: 'A área de atuação não pode ser vazia.' })
  @IsEnum(CoverageArea, {
    message: 'A área de atuação deve ser Municipal, Regional ou Estadual.',
  })
  coverageArea!: CoverageArea;

  @IsOptional()
  @IsString({ message: 'O nome do presidente deve ser uma string.' })
  @MaxLength(255, { message: 'O nome do presidente deve ter no máximo 255 caracteres.' })
  presidentName?: string;

  @IsOptional()
  @IsString({ message: 'O CPF do presidente deve ser uma string.' })
  @MaxLength(20, { message: 'O CPF do presidente deve ter no máximo 20 caracteres.' })
  presidentCpf?: string;

  @IsOptional()
  @IsEmail(
    { allow_display_name: false, require_tld: true },
    { message: 'O email do presidente fornecido não é válido.' },
  )
  @MaxLength(254, { message: 'O email do presidente deve ter no máximo 254 caracteres.' })
  presidentEmail?: string;

  @IsOptional()
  @IsString({ message: 'O telefone do presidente deve ser uma string.' })
  @MaxLength(20, { message: 'O telefone do presidente deve ter no máximo 20 caracteres.' })
  presidentPhone?: string;
}
