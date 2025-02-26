import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { UserCategory, UserType, Role } from '../interfaces/user.interface';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Nome do usuário', example: 'Silva Santos' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Email do usuário', example: 'silva.santos@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Senha do usuário', example: 'password' })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'Nível de Acesso',
    enum: Role,
    example: Role.Common,
  })
  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;

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
  userCategory: UserCategory;

  @ApiProperty({ description: 'Estado do usuário', example: 'PE' })
  @IsNotEmpty()
  @IsString()
  state: string;

  @ApiProperty({ description: 'Cidade do usuário', example: 'Belo Jardim' })
  @IsNotEmpty()
  @IsString()
  city: string;
}