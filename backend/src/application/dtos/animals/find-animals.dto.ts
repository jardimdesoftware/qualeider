import { IsOptional, IsNumber, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindAnimalsDto {
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

  @ApiPropertyOptional({ 
    description: 'Status do animal',
    enum: ['Active', 'Inactive']
  })
  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';
}
