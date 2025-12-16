import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
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
  @IsInt()
  userId!: number;

  @ApiProperty({ description: 'Número de animais ordenados', example: 5 })
  @IsInt()
  numAnimals!: number;

  @ApiProperty({ description: 'Número de ordenhas realizadas', example: 2 })
  @IsInt()
  numOrdens!: number;

  @ApiProperty({ description: 'Utilizou ração', example: true })
  @IsBoolean()
  rationProvided!: boolean;

  @ApiProperty({ description: 'Número de lactações por animal', example: 2 })
  @IsInt()
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
  @ValidateNested({ each: true })
  @Type(() => CreateDailyCollectionItemDto)
  items?: CreateDailyCollectionItemDto[];
}

export class CreateDailyCollectionItemDto {
  @ApiProperty({ description: 'ID do animal', example: 10 })
  @IsInt()
  animalId!: number;

  @ApiProperty({ description: 'Quantidade de leite produzida', example: 12.5 })
  @IsNumber()
  @Min(0)
  quantity!: number;
}
