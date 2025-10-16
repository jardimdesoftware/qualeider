import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
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
  @IsString()
  breed!: string;

  @ApiProperty({ description: 'Idade do animal', example: 10 })
  @IsInt()
  @Min(1)
  age!: number;

  @ApiProperty({ description: 'Id do usuário dono do animal', example: 2 })
  @IsInt()
  userId!: number;
}
