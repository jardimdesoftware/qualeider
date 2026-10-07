import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  Query,
} from '@nestjs/common';
import { AnimalsService } from '@/application/services/animals/animals.service';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { UpdateAnimalDto } from '@/application/dtos/animals/update-animal.dto';
import { FindAnimalsDto } from '@/application/dtos/animals/find-animals.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AnimalCriteria } from '@/domain/criteria/animal.criteria';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { UserRole } from '@/domain/enums/enums';
import { MAX_LIMIT } from '@/domain/common/pagination.interface';
import { ReadPrincipal, resolveReadScope } from '@/domain/utils/read-scope.util';

@ApiTags('Animais')
@Controller('animals')
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @ApiOperation({ summary: 'Cadastrar um Animal' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Animal cadastrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados invalidos' })
  @ApiResponse({ status: 404, description: 'Usuario nao encontrado' })
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ResponseMessage('Animal criado com sucesso')
  async create(
    @Body() createAnimalDto: CreateAnimalDto,
    @GetUser('id') requesterId: number,
    @GetUser('role') requesterRole?: UserRole,
    @GetUser('associationId') requesterAssociationId?: number | null,
    @GetUser('adminId') requesterAdminId?: number | null,
  ) {
    return this.animalsService.create(createAnimalDto, {
      id: requesterId,
      role: requesterRole,
      associationId: requesterAssociationId,
      adminId: requesterAdminId,
    });
  }

  @ApiOperation({ summary: 'Listar todos os animais' })
  @ApiResponse({ status: 200, description: 'Animais listados com sucesso' })
  @Get()
  async findAll(@Query() query: FindAnimalsDto, @GetUser() requester: ReadPrincipal) {
    const criteria: AnimalCriteria = {
      scope: resolveReadScope(requester),
      associationId: query.associationId,
      userId: query.userId,
      status: query.status,
      animalType: query.animalType,
      animalSpeciesId: query.animalSpeciesId,
      tagNumber: query.tagNumber,
    };
    return this.animalsService.findAll(criteria);
  }

  @ApiOperation({
    summary:
      'Producao total por animal (relatorio geral): todos os animais ativos do rebanho do solicitante, com litros/coletas no periodo informado',
  })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Resumo de producao por animal' })
  @Get('production-summary')
  @ResponseMessage('Resumo de produção por animal listado com sucesso')
  async getProductionSummary(
    @GetUser('id') requesterId: number,
    @GetUser('role') requesterRole?: UserRole,
    @GetUser('associationId') requesterAssociationId?: number | null,
    @GetUser('adminId') requesterAdminId?: number | null,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.animalsService.getProductionSummary(
      {
        id: requesterId,
        role: requesterRole,
        associationId: requesterAssociationId,
        adminId: requesterAdminId,
      },
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id')
  @ResponseMessage('Animal encontrado')
  @ApiOperation({ summary: 'Buscar um animal pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Animal encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Animal nao encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number, @GetUser() requester: ReadPrincipal) {
    return this.animalsService.findOne(id, requester);
  }

  @ApiOperation({ summary: 'Atualizar dados de um animal' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Animal atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Animal nao encontrado' })
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  @ResponseMessage('Animal atualizado com sucesso')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnimalDto: UpdateAnimalDto,
    @GetUser('id') requesterId: number,
    @GetUser('role') requesterRole?: UserRole,
    @GetUser('associationId') requesterAssociationId?: number | null,
    @GetUser('adminId') requesterAdminId?: number | null,
  ) {
    return this.animalsService.update(id, updateAnimalDto, {
      id: requesterId,
      role: requesterRole,
      associationId: requesterAssociationId,
      adminId: requesterAdminId,
    });
  }

  @ApiOperation({ summary: 'Excluir (desativar) um animal' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Animal excluido com sucesso' })
  @ApiResponse({ status: 404, description: 'Animal nao encontrado' })
  @Delete(':id')
  @ResponseMessage('Animal excluido com sucesso')
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') requesterId: number,
    @GetUser('role') requesterRole?: UserRole,
    @GetUser('associationId') requesterAssociationId?: number | null,
    @GetUser('adminId') requesterAdminId?: number | null,
  ) {
    return this.animalsService.remove(id, {
      id: requesterId,
      role: requesterRole,
      associationId: requesterAssociationId,
      adminId: requesterAdminId,
    });
  }

  @ApiOperation({ summary: 'Inativar um animal (preserva historico de coletas)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Animal inativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Animal nao encontrado' })
  @Patch(':id/inativar')
  @ResponseMessage('Animal inativado com sucesso')
  async inativar(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') requesterId: number,
    @GetUser('role') requesterRole?: UserRole,
    @GetUser('associationId') requesterAssociationId?: number | null,
    @GetUser('adminId') requesterAdminId?: number | null,
  ) {
    return this.animalsService.inativar(id, {
      id: requesterId,
      role: requesterRole,
      associationId: requesterAssociationId,
      adminId: requesterAdminId,
    });
  }

  @ApiOperation({
    summary:
      'Buscar animais de um usuario especifico (ou de toda a associacao, se o solicitante for ADMIN)',
  })
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', description: 'ID do usuario', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de animais do usuario' })
  @Get('user/:userId')
  @ResponseMessage('Animais do usuario listados com sucesso')
  async findAllByUserId(
    @Param('userId', ParseIntPipe) userId: number,
    @GetUser() requester: ReadPrincipal,
  ) {
    // O id do caminho precisa estar no escopo de quem pede; a lista é sempre a do
    // escopo dele (associacao > grupo Admin + funcionarios > ele mesmo), nunca a
    // de outro dono. includeInactive: esta listagem alimenta a tela de gestao do
    // rebanho ("Meus Animais"), que decide ativos/inativos no client via o toggle
    // "Mostrar inativos".
    await this.animalsService.assertCanReadUserData(userId, requester);
    return this.animalsService.findAll({
      scope: resolveReadScope(requester),
      limit: MAX_LIMIT,
      includeInactive: true,
    });
  }
}
