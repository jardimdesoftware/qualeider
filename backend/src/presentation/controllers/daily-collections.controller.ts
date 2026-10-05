import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  Query,
} from '@nestjs/common';
import { DailyCollectionsService } from '@/application/services/daily-collections/daily-collections.service';
import { CreateDailyCollectionDto } from '@/application/dtos/daily-collections/create-daily-collection.dto';
import { UpdateDailyCollectionDto } from '@/application/dtos/daily-collections/update-daily-collection.dto';
import { FindDailyCollectionsDto } from '@/application/dtos/daily-collections/find-daily-collections.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { DailyCollectionCriteria } from '@/domain/criteria/daily-collection.criteria';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { UserRole } from '@/domain/enums/enums';
import { MAX_LIMIT } from '@/domain/common/pagination.interface';
import { ReadPrincipal, resolveReadScope } from '@/domain/utils/read-scope.util';

@ApiTags('Daily Collections')
@Controller('daily-collections')
export class DailyCollectionsController {
  constructor(
    private readonly dailyCollectionsService: DailyCollectionsService,
  ) {}

  @ApiOperation({ summary: 'Responder formulário' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 201,
    description: 'Formulário respondido com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ResponseMessage('Coleta criada com sucesso')
  async create(
    @Body() createDailyCollectionDto: CreateDailyCollectionDto,
    @GetUser('id') requesterId: number,
    @GetUser('role') requesterRole?: UserRole,
    @GetUser('associationId') requesterAssociationId?: number | null,
    @GetUser('adminId') requesterAdminId?: number | null,
  ) {
    return this.dailyCollectionsService.create(createDailyCollectionDto, {
      id: requesterId,
      role: requesterRole,
      associationId: requesterAssociationId,
      adminId: requesterAdminId,
    });
  }

  @ApiOperation({ summary: 'Listar todos os formulários cadastrados' })
  @ApiResponse({ status: 200, description: 'Formulários listados com sucesso' })
  @Get()
  async findAll(@Query() query: FindDailyCollectionsDto, @GetUser() requester: ReadPrincipal) {
    const criteria: DailyCollectionCriteria = {
      scope: resolveReadScope(requester),
      associationId: query.associationId,
      userId: query.userId,
    };

    if (query.startDate && query.endDate) {
      criteria.dateRange = {
        start: new Date(query.startDate),
        end: new Date(query.endDate),
      };
    }

    return this.dailyCollectionsService.findAll(criteria);
  }

  @Get(':id')
  @ResponseMessage('Coleta encontrada')
  @ApiOperation({ summary: 'Buscar um formulário pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do formulário', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Formulário encontrado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number, @GetUser() requester: ReadPrincipal) {
    return this.dailyCollectionsService.findOne(id, requester);
  }

  @ApiOperation({
    summary: 'Atualizar todos os dados de um formulário pelo ID',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do formulário', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Formulário atualizado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ResponseMessage('Coleta atualizada com sucesso')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDailyCollectionDto: UpdateDailyCollectionDto,
    @GetUser('id') requesterId: number,
    @GetUser('role') requesterRole?: UserRole,
    @GetUser('associationId') requesterAssociationId?: number | null,
    @GetUser('adminId') requesterAdminId?: number | null,
  ) {
    return this.dailyCollectionsService.update(id, updateDailyCollectionDto, {
      id: requesterId,
      role: requesterRole,
      associationId: requesterAssociationId,
      adminId: requesterAdminId,
    });
  }

  @ApiOperation({ summary: 'Excluir formulário pelo ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do formulário', type: Number })
  @ApiResponse({ status: 200, description: 'Formulário excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  @Delete(':id')
  @ResponseMessage('Coleta excluída com sucesso')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') requesterId: number,
    @GetUser('role') requesterRole?: UserRole,
    @GetUser('associationId') requesterAssociationId?: number | null,
    @GetUser('adminId') requesterAdminId?: number | null,
  ) {
    return this.dailyCollectionsService.remove(id, {
      id: requesterId,
      role: requesterRole,
      associationId: requesterAssociationId,
      adminId: requesterAdminId,
    });
  }

  @ApiOperation({
    summary: 'Buscar formulários de um usuário pelo ID (ou de toda a associação, se o solicitante for ADMIN)',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', description: 'ID do usuário', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Formulários encontrados com sucesso',
  })
  @Get('user/:userId')
  @ResponseMessage('Formulários do usuário listados com sucesso')
  async findAllByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @GetUser() requester: ReadPrincipal,
  ) {
    // O id do caminho precisa estar no escopo de quem pede; a lista é sempre a do
    // escopo dele (associacao > grupo Admin + funcionarios > ele mesmo).
    await this.dailyCollectionsService.assertCanReadUserData(userId, requester);
    return this.dailyCollectionsService.findAll({
      scope: resolveReadScope(requester),
      limit: MAX_LIMIT,
    });
  }

  @ApiOperation({ summary: 'Buscar historico de coletas de um animal especifico' })
  @ApiParam({ name: 'animalId', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Historico de coletas do animal' })
  @ApiResponse({ status: 404, description: 'Animal nao encontrado' })
  @Get('animal/:animalId')
  @ResponseMessage('Historico de coletas do animal listado com sucesso')
  async findByAnimalId(
    @Param('animalId', ParseIntPipe) animalId: number,
    @GetUser() requester: ReadPrincipal,
  ) {
    return this.dailyCollectionsService.findHistoryByAnimal(animalId, requester);
  }
}
