import { IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GetMonthlyReportDto {
  @ApiProperty({
    description: 'Ano do relatório',
    example: 2025,
    minimum: 1900,
    maximum: 2100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1900)
  @Max(2100)
  year!: number;

  @ApiProperty({
    description: 'Mês do relatório (1-12)',
    example: 12,
    minimum: 1,
    maximum: 12,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month!: number;
}
