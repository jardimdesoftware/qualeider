import { IsOptional, IsNumber, IsEnum, IsString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AnimalType } from '@/domain/enums/enums';

export class FindAnimalsDto {
  @ApiPropertyOptional({ description: 'ID da associacao para filtro' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  associationId?: number;

  @ApiPropertyOptional({ description: 'ID do usuario para filtro' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    description: 'Status do animal',
    enum: ['Active', 'Inactive']
  })
  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';

  @ApiPropertyOptional({
    description: 'Tipo de animal',
    enum: AnimalType,
  })
  @IsOptional()
  @IsEnum(AnimalType)
  animalType?: AnimalType;

  @ApiPropertyOptional({ description: 'Numero de identificacao do animal (busca parcial)', example: '01' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  tagNumber?: string;
}
