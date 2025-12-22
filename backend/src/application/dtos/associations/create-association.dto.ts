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
  phone!: string; // Frontend envia 'phone'

  @IsOptional()
  landlinePhone?: string; // Trocado para opcional pois vem como 'phone'

  @ApiProperty({
    description: 'Telefone Celular/WhatsApp',
    example: '87999999999',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O telefone celular deve ser uma string.' })
  mobilePhone?: string;

  @IsOptional()
  website?: string;

  @IsOptional()
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
  city!: string;

  @IsOptional()
  street?: string;

  @IsOptional()
  number?: string;

  @IsOptional()
  complement?: string;

  @IsOptional()
  neighborhood?: string;

  @IsOptional()
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
  presidentName?: string;

  @IsOptional()
  presidentCpf?: string;

  @IsOptional()
  presidentEmail?: string;

  @IsOptional()
  presidentPhone?: string;
}
