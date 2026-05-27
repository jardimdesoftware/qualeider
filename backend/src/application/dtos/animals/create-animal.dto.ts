import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { AnimalType } from '@/domain/enums/enums';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnimalDto {
  @ApiProperty({ description: 'Nome do animal', example: 'Vaquinha mimosa' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Animal',
    enum: AnimalType,
    example: AnimalType.Vaca,
  })
  @IsNotEmpty()
  @IsEnum(AnimalType)
  animalType!: AnimalType;

  @ApiProperty({ description: 'Raça do animal', example: 'Holandês' })
  @IsNotEmpty()
  @IsString()
  breed!: string;

  @ApiProperty({ description: 'Idade do animal', example: 10 })
  @IsInt({ message: 'Idade deve ser um número inteiro' })
  @Min(0, { message: 'Idade não pode ser negativa' })
  @Max(30, { message: 'Idade não pode exceder 30 anos' })
  age!: number;

  @ApiProperty({ description: 'Id do usuário dono do animal', example: 2 })
  @IsInt({ message: 'userId deve ser um número inteiro' })
  @IsPositive({ message: 'userId deve ser positivo' })
  userId!: number;

  @ApiProperty({ description: 'Id da raça (relação com tabela Breed)', example: 1, required: false })
  @IsOptional()
  @IsInt({ message: 'breedId deve ser um número inteiro' })
  @IsPositive({ message: 'breedId deve ser positivo' })
  breedId?: number;
}
