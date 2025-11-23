import { IsOptional, IsNumber, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindDailyCollectionsDto {
  @ApiPropertyOptional({ description: 'ID da associação para filtro' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  associationId?: number;

  @ApiPropertyOptional({ description: 'ID do usuário para filtro' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({ description: 'Data inicial (ISO-8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final (ISO-8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
