import { IsOptional, IsEnum, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FindUsersDto {
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
