import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Length,
  Matches,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CoverageArea } from '@/domain/enums/enums';

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
  @IsEmail({}, { message: 'O email fornecido não é válido.' })
  @Transform(({ value }) => value?.toLowerCase().trim())
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
    description: 'Telefone Fixo da Associação',
    example: '8737211234',
  })
  @IsNotEmpty({ message: 'O telefone fixo não pode ser vazio.' })
  @IsString({ message: 'O telefone fixo deve ser uma string.' })
  @Matches(/^\d{10,11}$/, {
    message: 'O telefone fixo deve ter 10 ou 11 dígitos.',
  })
  landlinePhone!: string;

  @ApiProperty({
    description: 'Telefone Celular/WhatsApp',
    example: '87999999999',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O telefone celular deve ser uma string.' })
  @Matches(/^\d{10,11}$/, {
    message: 'O telefone celular deve ter 10 ou 11 dígitos.',
  })
  mobilePhone?: string;

  @ApiProperty({
    description: 'Website da Associação',
    example: 'https://www.associacao.org.br',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O website deve ser uma string.' })
  website?: string;

  @ApiProperty({
    description: 'CEP do endereço da Associação',
    example: '55155000',
  })
  @IsNotEmpty({ message: 'O CEP não pode ser vazio.' })
  @IsString({ message: 'O CEP deve ser uma string.' })
  @Length(8, 8, { message: 'O CEP deve ter 8 caracteres.' })
  @Matches(/^\d{8}$/, { message: 'O CEP deve conter apenas números.' })
  zipCode!: string;

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

  @ApiProperty({
    description: 'Rua/Avenida da Associação',
    example: 'Rua das Flores',
  })
  @IsNotEmpty({ message: 'A rua não pode ser vazia.' })
  @IsString({ message: 'A rua deve ser uma string.' })
  street!: string;

  @ApiProperty({
    description: 'Número do endereço',
    example: '123',
  })
  @IsNotEmpty({ message: 'O número não pode ser vazio.' })
  @IsString({ message: 'O número deve ser uma string.' })
  number!: string;

  @ApiProperty({
    description: 'Complemento do endereço',
    example: 'Sala 201',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O complemento deve ser uma string.' })
  complement?: string;

  @ApiProperty({
    description: 'Bairro da Associação',
    example: 'Centro',
  })
  @IsNotEmpty({ message: 'O bairro não pode ser vazio.' })
  @IsString({ message: 'O bairro deve ser uma string.' })
  neighborhood!: string;

  @ApiProperty({
    description: 'Data de Fundação da Associação',
    example: '2020-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'A data de fundação deve ser uma data válida.' })
  foundationDate?: string;

  @ApiProperty({
    description: 'Número de Associados',
    example: 50,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'O número de associados deve ser um número inteiro.' })
  @Min(0, { message: 'O número de associados deve ser maior ou igual a 0.' })
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

  @ApiProperty({
    description: 'Nome do Presidente da Associação',
    example: 'João da Silva',
  })
  @IsNotEmpty({ message: 'O nome do presidente não pode ser vazio.' })
  @IsString({ message: 'O nome do presidente deve ser uma string.' })
  @Length(3, 255, {
    message: 'O nome do presidente deve ter entre 3 e 255 caracteres.',
  })
  presidentName!: string;

  @ApiProperty({
    description: 'CPF do Presidente',
    example: '12345678900',
  })
  @IsNotEmpty({ message: 'O CPF do presidente não pode ser vazio.' })
  @IsString({ message: 'O CPF do presidente deve ser uma string.' })
  @Length(11, 11, { message: 'O CPF deve ter 11 caracteres.' })
  @Matches(/^\d{11}$/, { message: 'O CPF deve conter apenas números.' })
  presidentCpf!: string;

  @ApiProperty({
    description: 'Email do Presidente',
    example: 'presidente@email.com',
  })
  @IsNotEmpty({ message: 'O email do presidente não pode ser vazio.' })
  @IsEmail({}, { message: 'O email do presidente não é válido.' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  presidentEmail!: string;

  @ApiProperty({
    description: 'Telefone do Presidente',
    example: '87999999999',
  })
  @IsNotEmpty({ message: 'O telefone do presidente não pode ser vazio.' })
  @IsString({ message: 'O telefone do presidente deve ser uma string.' })
  @Matches(/^\d{10,11}$/, {
    message: 'O telefone do presidente deve ter 10 ou 11 dígitos.',
  })
  presidentPhone!: string;
}
