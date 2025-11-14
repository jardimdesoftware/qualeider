import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsNotEmpty, IsString, IsEmail, IsEnum } from 'class-validator';
import { UserType, UserCategory } from '@/domain/enums/enums';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePartialUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ description: 'Nome do usuário', example: 'Silva Santos' })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'silva.santos@example.com',
  })
  @IsNotEmpty()
  @IsEmail()
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
  @IsString()
  state!: string;

  @ApiProperty({ description: 'Cidade do usuário', example: 'Belo Jardim' })
  @IsNotEmpty()
  @IsString()
  city!: string;
}
