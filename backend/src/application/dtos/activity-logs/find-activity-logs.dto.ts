import { IsNotEmpty, IsOptional, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FindActivityLogsDto {
  @ApiProperty({ description: 'ID do usuário cujo histórico será listado' })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  userId!: number;

  @ApiPropertyOptional({ description: 'Número da página (padrão: 1)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Registros por página (padrão: 50)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
