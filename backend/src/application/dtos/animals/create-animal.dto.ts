import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { AnimalType } from '@/domain/enums/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnimalDto {
  @ApiProperty({ description: 'Nome do animal', example: 'Vaquinha mimosa', required: false })
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

  @ApiProperty({ description: 'Idade do animal', example: 10 })
  @IsInt({ message: 'Idade deve ser um numero inteiro' })
  @Min(0, { message: 'Idade nao pode ser negativa' })
  @Max(30, { message: 'Idade nao pode exceder 30 anos' })
  age!: number;

  @ApiProperty({ description: 'Id do usuario dono do animal', example: 2 })
  @IsInt({ message: 'userId deve ser um numero inteiro' })
  @IsPositive({ message: 'userId deve ser positivo' })
  userId!: number;

  @ApiProperty({ description: 'Id da raca (relacao com tabela Breed)', example: 1, required: false })
  @IsOptional()
  @IsInt({ message: 'breedId deve ser um numero inteiro' })
  @IsPositive({ message: 'breedId deve ser positivo' })
  breedId?: number;
}
