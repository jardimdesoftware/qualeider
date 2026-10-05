import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  Param,
  NotFoundException,
  ForbiddenException,
  ParseIntPipe,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_TTL } from '@/common/throttler/throttler.config';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AssociationsService } from '@/application/services/associations/associations.service';
import { CreateAssociationDto } from '@/application/dtos/associations/create-association.dto';
import { GetMonthlyReportDto } from '@/application/dtos/associations/get-monthly-report.dto';
import { UpdateAssociationDto } from '@/application/dtos/associations/update-association.dto';
import { BusinessException } from '@/common/exceptions/business.exception';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { AssociationOnlyGuard } from '@/application/guards/association-only.guard';
import { UserRole } from '@/domain/enums/enums';
import { HerdScope, resolveHerdScope } from '@/domain/utils/herd-scope.util';

@ApiTags('associations')
@Controller('associations')
export class AssociationsController {
  constructor(private readonly associationsService: AssociationsService) {}

  @Throttle({ default: { limit: 5, ttl: THROTTLE_TTL.LONG } })
  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar uma nova associação' })
  @ApiResponse({
    status: 201,
    description: 'Associação criada com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'Email ou CNPJ já cadastrado.' })
  @ResponseMessage('Associação criada com sucesso')
  async create(@Body() createAssociationDto: CreateAssociationDto) {
    return this.associationsService.create(createAssociationDto);
  }

  @Get('check-email')
  @Public()
  @ApiOperation({ summary: 'Verificar se o email já está cadastrado' })
  @ApiQuery({ name: 'email', required: true })
  @ApiResponse({ status: 200, description: 'Retorna se o email existe.' })
  @ApiResponse({ status: 400, description: 'Email não fornecido.' })
  async checkEmail(@Query('email') email: string) {
    if (!email) {
      throw new BusinessException('Email é obrigatório');
    }
    const association = await this.associationsService.findByEmail(email);
    return { exists: !!association };
  }

  @Get('check-cnpj')
  @Public()
  @ApiOperation({ summary: 'Verificar se o CNPJ já está cadastrado' })
  @ApiQuery({ name: 'cnpj', required: true })
  @ApiResponse({ status: 200, description: 'Retorna se o CNPJ existe.' })
  @ApiResponse({ status: 400, description: 'CNPJ não fornecido.' })
  async checkCnpj(@Query('cnpj') cnpj: string) {
    if (!cnpj) {
      throw new BusinessException('CNPJ é obrigatório');
    }
    const association = await this.associationsService.findByCnpj(cnpj);
    return { exists: !!association };
  }


  @Get('metrics/associates')
  @UseGuards(AssociationOnlyGuard)
  @ApiOperation({ summary: 'Obter lista resumida de associados paginada' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de associados retornada com sucesso.' })
  async getAssociates(
    @GetUser('id') associationId: number,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.associationsService.findAssociates(associationId, {
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get('available-producers')
  @UseGuards(AssociationOnlyGuard)
  @ApiOperation({ summary: 'Listar produtores sem associação' })
  @ApiResponse({ status: 200, description: 'Lista de produtores retornada.' })
  async getAvailableProducers() {
    return this.associationsService.getAvailableProducers();
  }

  @Post('invite')
  @UseGuards(AssociationOnlyGuard)
  @ApiOperation({ summary: 'Convidar/Vincular produtor à associação' })
  @ApiResponse({ status: 200, description: 'Produtor vinculado com sucesso.' })
  @ResponseMessage('Produtor vinculado com sucesso')
  async inviteProducer(@Body() body: { userId: number }, @GetUser('id') associationId: number) {
    await this.associationsService.linkProducer(body.userId, associationId);
  }

  @Get('metrics/herd')
  @UseGuards(AssociationOnlyGuard)
  @ApiOperation({ summary: 'Obter estatísticas do rebanho regional' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso.' })
  async getHerdStats(@GetUser('id') associationId: number) {
    return this.associationsService.getHerdStats(associationId);
  }

  @Get('reports/producer-ranking')
  @UseGuards(AssociationOnlyGuard)
  @ApiOperation({ summary: 'Obter ranking de produtores por produção' })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Data de início (ISO)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Data de fim (ISO)' })
  @ApiResponse({ status: 200, description: 'Ranking retornado com sucesso.' })
  async getProducerRanking(@GetUser('id') associationId: number, @Query('startDate') startDate?: string, @Query('endDate') endDate?: string) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.associationsService.getProducerRanking(associationId, start, end);
  }

  @Get('reports/monthly')
  @ApiOperation({ summary: 'Obter relatório mensal agregado' })
  @ApiResponse({ status: 200, description: 'Relatório mensal retornado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos ou faltando.' })
  async getMonthlyReport(
    @GetUser('id') requesterId: number,
    @GetUser('role') requesterRole: UserRole,
    @GetUser('associationId') requesterAssociationId: number | null,
    @GetUser('adminId') requesterAdminId: number | null,
    @GetUser('userType') requesterType: 'user' | 'association' | undefined,
    @Query() dto: GetMonthlyReportDto,
  ) {
    // Login como Associacao: o `id` do token e o da propria associacao (nao ha
    // role/associationId no request.user), entao ele nao pode passar por
    // resolveHerdScope - cairia em { userId } e colidiria com ids de usuarios.
    const scope: HerdScope =
      requesterType === 'association'
        ? { associationId: requesterId }
        : resolveHerdScope({
            id: requesterId,
            role: requesterRole,
            associationId: requesterAssociationId,
            adminId: requesterAdminId,
          });
    return this.associationsService.getMonthlyReport(scope, dto.year, dto.month);
  }

  @Get(':id')
  @ResponseMessage('Associação encontrada')
  @ApiOperation({ summary: 'Buscar associação por ID' })
  @ApiResponse({ status: 200, description: 'Associação encontrada.' })
  @ApiResponse({ status: 404, description: 'Associação não encontrada.' })
  @ApiResponse({ status: 403, description: 'Só a própria associação ou um de seus membros.' })
  async findById(
    @Param('id', ParseIntPipe) id: number,
    @GetUser('id') requesterId: number,
    @GetUser('userType') requesterType: string,
    @GetUser('associationId') requesterAssociationId: number | null,
  ) {
    const isSelf = requesterType === 'association' && requesterId === id;
    const isMember = requesterType !== 'association' && requesterAssociationId === id;
    if (!isSelf && !isMember) {
      throw new ForbiddenException('Você não tem acesso a esta associação.');
    }

    const association = await this.associationsService.findById(id);
    if (!association) {
      throw new NotFoundException('Associação não encontrada');
    }
    return association;
  }

  // Só a própria associação altera os seus dados. Sem isso, qualquer usuário
  // autenticado trocava e-mail e senha de uma associação e assumia a conta.
  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar dados da associação' })
  @ApiResponse({ status: 200, description: 'Associação atualizada com sucesso.' })
  @ApiResponse({ status: 403, description: 'Só a própria associação pode alterar seus dados.' })
  @ResponseMessage('Associação atualizada com sucesso')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAssociationDto: UpdateAssociationDto,
    @GetUser('id') requesterId: number,
    @GetUser('userType') requesterType: string,
  ) {
    if (requesterType !== 'association' || requesterId !== id) {
      throw new ForbiddenException('Você não pode alterar os dados desta associação.');
    }
    return this.associationsService.update(id, updateAssociationDto);
  }
}