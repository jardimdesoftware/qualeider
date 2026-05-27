import { PartialType } from '@nestjs/mapped-types';
import { CreateAnimalDto } from './create-animal.dto';
import { ApiProperty } from '@nestjs/swagger';
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

export class UpdateAnimalDto extends PartialType(CreateAnimalDto) {
  @ApiProperty({ description: 'Numero de identificacao do animal (brinco)', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tagNumber?: string;

  @ApiProperty({ description: 'Nome do animal', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Tipo do animal (legado)', enum: AnimalType, required: false })
  @IsOptional()
  @IsEnum(AnimalType)
  animalType?: AnimalType;

  @ApiProperty({ description: 'Id do tipo de animal (tabela AnimalSpecies)', example: 1, required: false })
  @IsOptional()
  @IsInt({ message: 'animalSpeciesId deve ser um numero inteiro' })
  @IsPositive({ message: 'animalSpeciesId deve ser positivo' })
  animalSpeciesId?: number;

  @ApiProperty({ description: 'Raca do animal', required: false })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiProperty({ description: 'Id da raca (relacao com tabela Breed)', required: false })
  @IsOptional()
  @IsInt({ message: 'breedId deve ser um numero inteiro' })
  @IsPositive({ message: 'breedId deve ser positivo' })
  breedId?: number;

  @ApiProperty({ description: 'Idade do animal em anos', required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  age?: number;

  @ApiProperty({ description: 'ID da mae (animal cadastrado no sistema)', required: false })
  @IsOptional()
  @IsInt({ message: 'motherId deve ser um numero inteiro' })
  @IsPositive({ message: 'motherId deve ser positivo' })
  motherId?: number;

  @ApiProperty({ description: 'Numero da mae quando nao cadastrada no sistema', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  motherCode?: string;

  @ApiProperty({ description: 'ID do pai/reprodutor (animal cadastrado no sistema)', required: false })
  @IsOptional()
  @IsInt({ message: 'fatherId deve ser um numero inteiro' })
  @IsPositive({ message: 'fatherId deve ser positivo' })
  fatherId?: number;

  @ApiProperty({ description: 'Numero ou codigo do pai quando nao cadastrado', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  fatherCode?: string;
}
