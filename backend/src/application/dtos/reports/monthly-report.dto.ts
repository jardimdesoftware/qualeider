import { ApiProperty } from '@nestjs/swagger';

export class MonthlyReportDto {
  @ApiProperty({ description: 'Mês/Ano do relatório', example: '12/2025' })
  month!: string;

  @ApiProperty({ description: 'Total de produção no mês (litros)', example: 45000.5 })
  totalProduction!: number;

  @ApiProperty({ description: 'Número de produtores ativos', example: 30 })
  totalProducers!: number;

  @ApiProperty({ description: 'Média de produção por produtor (litros)', example: 1500.5 })
  averagePerProducer!: number;

  @ApiProperty({ description: 'Total de animais no período', example: 750 })
  totalAnimals!: number;

  @ApiProperty({ description: 'Número de coletas realizadas', example: 900 })
  totalCollections!: number;

  @ApiProperty({ description: 'Média de produção por animal (litros)', example: 60.5 })
  avgPerAnimal!: number;
}
