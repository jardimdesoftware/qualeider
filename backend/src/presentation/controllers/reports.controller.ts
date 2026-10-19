import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ReportsService } from '@/application/services/reports/reports.service';
import { GetMonthlyReportDto } from '@/application/dtos/reports/get-monthly-report.dto';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { ReadPrincipal, resolveReadScope } from '@/domain/utils/read-scope.util';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Relatório mensal do rebanho do usuário logado' })
  @ApiResponse({ status: 200, description: 'Relatório mensal retornado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos ou faltando.' })
  async getMonthlyReport(@Query() dto: GetMonthlyReportDto, @GetUser() requester: ReadPrincipal) {
    return this.reportsService.getMonthlyReport(resolveReadScope(requester), dto.year, dto.month);
  }
}
