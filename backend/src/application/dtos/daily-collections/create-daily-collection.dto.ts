import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsArray,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MilkingPlace } from '@/domain/enums/enums';

export class CreateDailyCollectionDto {
  @ApiProperty({
    description: 'Total de leite coletados em litros',
    example: 25,
  })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({ description: 'Id do usuário', example: 2 })
  @IsInt({ message: 'userId deve ser um número inteiro' })
  @IsPositive({ message: 'userId deve ser positivo' })
  userId!: number;

  @ApiProperty({ description: 'Número de animais ordenados', example: 5 })
  @IsInt({ message: 'numAnimals deve ser um número inteiro' })
  @Min(1, { message: 'Deve ordenar pelo menos 1 animal' })
  @Max(9999, { message: 'Número de animais inválido' })
  numAnimals!: number;

  @ApiProperty({ description: 'Número de ordenhas realizadas', example: 2 })
  @IsInt({ message: 'numOrdens deve ser um número inteiro' })
  @Min(1, { message: 'Deve ter pelo menos 1 ordenha' })
  @Max(10, { message: 'Número de ordenhas não pode exceder 10' })
  numOrdens!: number;

  @ApiProperty({ description: 'Utilizou ração', example: true })
  @IsBoolean()
  rationProvided!: boolean;

  @ApiProperty({ description: 'Número de lactações por animal', example: 2 })
  @IsInt({ message: 'numLactation deve ser um número inteiro' })
  @Min(0, { message: 'numLactation não pode ser negativo' })
  @Max(15, { message: 'Número de lactações inválido' })
  numLactation!: number;

  @ApiProperty({
    description: 'Local de ordenha',
    enum: MilkingPlace,
    example: MilkingPlace.Curral,
  })
  @IsEnum(MilkingPlace)
  milkingPlace!: MilkingPlace;

  @ApiProperty({ description: 'Utilizou assistência técnica', example: true })
  @IsBoolean()
  technicalAssistance!: boolean;
  
  @ApiProperty({ description: 'Data da coleta', example: '2025-11-22' })
  @Type(() => Date)
  @IsDate()
  collectionDate!: Date;

  @ApiProperty({
    description: 'Itens da coleta (detalhamento por animal)',
    type: () => [CreateDailyCollectionItemDto],
  })
  @IsOptional()
  @IsArray({ message: 'items deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => CreateDailyCollectionItemDto)
  items?: CreateDailyCollectionItemDto[];
}

export class CreateDailyCollectionItemDto {
  @ApiProperty({ description: 'ID do animal', example: 10 })
  @IsInt({ message: 'animalId deve ser um número inteiro' })
  @IsPositive({ message: 'animalId deve ser positivo' })
  animalId!: number;

  @ApiProperty({ description: 'Quantidade de leite produzida', example: 12.5 })
  @IsNumber({}, { message: 'quantity deve ser um número' })
  @Min(0.01, { message: 'Quantidade deve ser maior que zero' })
  @Max(1000, { message: 'Quantidade não pode exceder 1000 litros por animal' })
  quantity!: number;
}
