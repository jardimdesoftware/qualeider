import { ApiProperty } from '@nestjs/swagger';

export class ProducerRankingDto {
  @ApiProperty({ description: 'ID do produtor', example: 1 })
  id: number;

  @ApiProperty({ description: 'Nome do produtor', example: 'João Silva' })
  name: string;

  @ApiProperty({ description: 'Cidade', example: 'Garanhuns' })
  city?: string;

  @ApiProperty({ description: 'Estado', example: 'PE' })
  state?: string;

  @ApiProperty({ description: 'Total de produção no período (litros)', example: 1500.5 })
  totalProduction: number;

  @ApiProperty({ description: 'Quantidade de animais', example: 25 })
  animalsCount: number;

  @ApiProperty({ description: 'Média de produção por dia (litros)', example: 50.5 })
  avgProductionPerDay: number;

  @ApiProperty({ description: 'Posição no ranking', example: 1 })
  rank: number;
}
