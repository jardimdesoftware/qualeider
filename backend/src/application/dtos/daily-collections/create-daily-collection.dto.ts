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
import { MilkingPlace, CmtResult } from '@/domain/enums/enums';

export class CreateDailyCollectionDto {
  @ApiProperty({
    description: 'Total de leite coletados em litros',
    example: 25,
  })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiProperty({ description: 'Id do usuario', example: 2 })
  @IsInt({ message: 'userId deve ser um numero inteiro' })
  @IsPositive({ message: 'userId deve ser positivo' })
  userId!: number;

  @ApiProperty({ description: 'Numero de animais ordenados', example: 5 })
  @IsInt({ message: 'numAnimals deve ser um numero inteiro' })
  @Min(1, { message: 'Deve ordenar pelo menos 1 animal' })
  @Max(9999, { message: 'Numero de animais invalido' })
  numAnimals!: number;

  @ApiProperty({ description: 'Numero de ordenhas realizadas', example: 2 })
  @IsInt({ message: 'numOrdens deve ser um numero inteiro' })
  @Min(1, { message: 'Deve ter pelo menos 1 ordenha' })
  @Max(10, { message: 'Numero de ordenhas nao pode exceder 10' })
  numOrdens!: number;

  @ApiProperty({ description: 'Utilizou racao', example: true })
  @IsBoolean()
  rationProvided!: boolean;

  @ApiProperty({ description: 'Numero de lactacoes por animal', example: 2 })
  @IsInt({ message: 'numLactation deve ser um numero inteiro' })
  @Min(0, { message: 'numLactation nao pode ser negativo' })
  @Max(15, { message: 'Numero de lactacoes invalido' })
  numLactation!: number;

  @ApiProperty({
    description: 'Local de ordenha',
    enum: MilkingPlace,
    example: MilkingPlace.Curral,
  })
  @IsEnum(MilkingPlace)
  milkingPlace!: MilkingPlace;

  @ApiProperty({ description: 'Utilizou assistencia tecnica', example: true })
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
  @IsInt({ message: 'animalId deve ser um numero inteiro' })
  @IsPositive({ message: 'animalId deve ser positivo' })
  animalId!: number;

  @ApiProperty({ description: 'Quantidade de leite produzida', example: 12.5 })
  @IsNumber({}, { message: 'quantity deve ser um numero' })
  @Min(0.01, { message: 'Quantidade deve ser maior que zero' })
  @Max(1000, { message: 'Quantidade nao pode exceder 1000 litros por animal' })
  quantity!: number;

  @ApiProperty({ description: 'Resultado do teste da caneca (CMT)', enum: CmtResult, required: false })
  @IsOptional()
  @IsEnum(CmtResult)
  cmtResult?: CmtResult | null;
}
