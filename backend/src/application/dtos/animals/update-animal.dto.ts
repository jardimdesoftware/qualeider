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
} from 'class-validator';
import { AnimalType } from '@/domain/enums/enums';

export class UpdateAnimalDto extends PartialType(CreateAnimalDto) {
  @ApiProperty({ description: 'Nome do animal', example: 'Vaquinha mimosa', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ description: 'Tipo do animal', enum: AnimalType, required: false })
  @IsOptional()
  @IsEnum(AnimalType)
  animalType?: AnimalType;

  @ApiProperty({ description: 'Raça do animal (texto legado)', example: 'Holandês', required: false })
  @IsOptional()
  @IsString()
  breed?: string;

  @ApiProperty({ description: 'Id da raça (relação com tabela Breed)', example: 1, required: false })
  @IsOptional()
  @IsInt({ message: 'breedId deve ser um número inteiro' })
  @IsPositive({ message: 'breedId deve ser positivo' })
  breedId?: number;

  @ApiProperty({ description: 'Idade do animal em anos', example: 3, required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(30)
  age?: number;
}
