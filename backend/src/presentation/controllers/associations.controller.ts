import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  UseGuards,
  Param,
  NotFoundException,
  Patch,
} from '@nestjs/common';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { JwtAuthGuard } from '@/application/guards/jwt-auth.guard';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_TTL } from '@/common/throttler/throttler.config';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AssociationsService } from '@/application/services/associations/associations.service';
import { CreateAssociationDto } from '@/application/dtos/associations/create-association.dto';
import { GetMonthlyReportDto } from '@/application/dtos/associations/get-monthly-report.dto';
import { BusinessException } from '@/common/exceptions/business.exception';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@ApiTags('associations')
@Controller('associations')
export class AssociationsController {
  constructor(private readonly associationsService: AssociationsService) {}

  @Throttle({ default: { limit: 5, ttl: THROTTLE_TTL.LONG } })
  @Post()
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Listar produtores sem associação' })
  @ApiResponse({ status: 200, description: 'Lista de produtores retornada.' })
  async getAvailableProducers() {
    return this.associationsService.getAvailableProducers();
  }

  @Post('invite')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Convidar/Vincular produtor à associação' })
  @ApiResponse({ status: 200, description: 'Produtor vinculado com sucesso.' })
  async inviteProducer(@Body() body: { userId: number }, @GetUser('id') associationId: number) {
    await this.associationsService.linkProducer(body.userId, associationId);
    return { message: 'Produtor vinculado com sucesso.' };
  }

  @Get('metrics/herd')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obter estatísticas do rebanho regional' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso.' })
  async getHerdStats(@GetUser('id') associationId: number) {
    return this.associationsService.getHerdStats(associationId);
  }

  @Get('reports/producer-ranking')
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obter relatório mensal agregado' })
  @ApiResponse({ status: 200, description: 'Relatório mensal retornado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Parâmetros inválidos ou faltando.' })
  async getMonthlyReport(@GetUser('id') associationId: number, @Query() dto: GetMonthlyReportDto) {
    return this.associationsService.getMonthlyReport(associationId, dto.year, dto.month);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar associação por ID' })
  @ApiResponse({ status: 200, description: 'Associação encontrada.' })
  @ApiResponse({ status: 404, description: 'Associação não encontrada.' })
  async findById(@Param('id') id: string) {
    const association = await this.associationsService.findById(Number(id));
    if (!association) {
      throw new NotFoundException('Associação não encontrada');
    }
    return association;
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualizar dados da associação' })
  @ApiResponse({ status: 200, description: 'Associação atualizada com sucesso.' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.associationsService.update(Number(id), body);
  }
}