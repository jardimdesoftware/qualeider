import { IsOptional, IsNumber, IsEnum, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindUsersDto {
  @ApiPropertyOptional({ description: 'ID da associação para filtro' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  associationId?: number;

  @ApiPropertyOptional({ 
    description: 'Status do usuário',
    enum: ['Active', 'Inactive']
  })
  @IsOptional()
  @IsEnum(['Active', 'Inactive'])
  status?: 'Active' | 'Inactive';

  @ApiPropertyOptional({ description: 'Buscar por email contendo este texto' })
  @IsOptional()
  @IsString()
  emailContains?: string;
}
