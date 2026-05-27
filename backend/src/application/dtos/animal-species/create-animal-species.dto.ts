import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnimalSpeciesDto {
  @ApiProperty({ description: 'Nome do tipo de animal', example: 'Vaca' })
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @IsString()
  @MaxLength(100, { message: 'Nome não pode exceder 100 caracteres' })
  name!: string;

  @ApiProperty({ description: 'Descrição do tipo', example: 'Bovino leiteiro', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Descrição não pode exceder 500 caracteres' })
  description?: string;
}
