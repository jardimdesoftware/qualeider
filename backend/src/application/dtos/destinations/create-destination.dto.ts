import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDestinationDto {
  @ApiProperty({ description: 'Nome do destino do leite', example: 'Laticínio' })
  @IsNotEmpty({ message: 'Nome do destino é obrigatório' })
  @IsString()
  @MaxLength(100, { message: 'Nome não pode exceder 100 caracteres' })
  name!: string;

  @ApiProperty({
    description: 'Descrição do destino',
    example: 'Leite entregue ao laticínio da região',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Descrição não pode exceder 500 caracteres' })
  description?: string;
}
