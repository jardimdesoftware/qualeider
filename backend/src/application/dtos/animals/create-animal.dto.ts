import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { AnimalType } from '@/domain/enums/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnimalDto {
  @ApiProperty({ description: 'Numero de identificacao do animal (brinco)', example: '013', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tagNumber?: string;

  @ApiProperty({ description: 'Nome do animal', example: 'Mimosa', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Tipo de animal (legado)', enum: AnimalType, required: false })
  @IsOptional()
  @IsEnum(AnimalType)
  animalType?: AnimalType;

  @ApiProperty({ description: 'Id do tipo de animal (tabela AnimalSpecies)', example: 1, required: false })
  @IsOptional()
  @IsInt({ message: 'animalSpeciesId deve ser um numero inteiro' })
  @IsPositive({ message: 'animalSpeciesId deve ser positivo' })
  animalSpeciesId?: number;

  @ApiProperty({ description: 'Raca do animal', example: 'Holandes', required: false })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiProperty({ description: 'Id da raca (relacao com tabela Breed)', example: 1, required: false })
  @IsOptional()
  @IsInt({ message: 'breedId deve ser um numero inteiro' })
  @IsPositive({ message: 'breedId deve ser positivo' })
  breedId?: number;

  @ApiProperty({ description: 'Idade do animal', example: 10 })
  @IsInt({ message: 'Idade deve ser um numero inteiro' })
  @Min(0, { message: 'Idade nao pode ser negativa' })
  @Max(30, { message: 'Idade nao pode exceder 30 anos' })
  age!: number;

  @ApiProperty({ description: 'Id do usuario dono do animal', example: 2 })
  @IsInt({ message: 'userId deve ser um numero inteiro' })
  @IsPositive({ message: 'userId deve ser positivo' })
  userId!: number;

  @ApiProperty({ description: 'ID da mae (animal cadastrado no sistema)', example: 7, required: false })
  @IsOptional()
  @IsInt({ message: 'motherId deve ser um numero inteiro' })
  @IsPositive({ message: 'motherId deve ser positivo' })
  motherId?: number;

  @ApiProperty({ description: 'Numero da mae quando ela nao esta cadastrada no sistema', example: '07', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  motherCode?: string;

  @ApiProperty({ description: 'ID do pai/reprodutor (animal cadastrado no sistema)', example: 3, required: false })
  @IsOptional()
  @IsInt({ message: 'fatherId deve ser um numero inteiro' })
  @IsPositive({ message: 'fatherId deve ser positivo' })
  fatherId?: number;

  @ApiProperty({ description: 'Numero ou codigo do pai/reprodutor quando nao cadastrado', example: 'Reprodutor Nelore 23', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  fatherCode?: string;
}
