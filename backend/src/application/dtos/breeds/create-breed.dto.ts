import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBreedDto {
  @ApiProperty({ description: 'Nome da raça', example: 'Holandês' })
  @IsNotEmpty({ message: 'Nome da raça é obrigatório' })
  @IsString()
  @MaxLength(100, { message: 'Nome não pode exceder 100 caracteres' })
  name!: string;

  @ApiProperty({
    description: 'Descrição da raça',
    example: 'Raça de alta produção leiteira',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Descrição não pode exceder 500 caracteres' })
  description?: string;
}
