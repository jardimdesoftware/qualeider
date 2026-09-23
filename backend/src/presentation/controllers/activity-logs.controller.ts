import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ActivityLogService } from '@/application/services/activity-logs/activity-logs.service';
import { FindActivityLogsDto } from '@/application/dtos/activity-logs/find-activity-logs.dto';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { UserRole } from '@/domain/enums/enums';

@ApiTags('Activity Logs')
@Controller('activity-logs')
export class ActivityLogsController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @ResponseMessage('Histórico de atividade encontrado')
  @ApiOperation({ summary: 'Listar o histórico de atividade de um usuário (só ADMIN, mesmo rebanho)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Histórico listado com sucesso' })
  @ApiResponse({ status: 403, description: 'Sem permissão para ver este histórico' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findAll(
    @Query() query: FindActivityLogsDto,
    @GetUser('id') requesterId: number,
    @GetUser('role') requesterRole?: UserRole,
    @GetUser('associationId') requesterAssociationId?: number | null,
  ) {
    return this.activityLogService.findAll(
      query.userId,
      {
        id: requesterId,
        role: requesterRole,
        associationId: requesterAssociationId,
      },
      { page: query.page, limit: query.limit },
    );
  }
}
