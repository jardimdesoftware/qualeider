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
  async create(@Body() createDailyCollectionDto: CreateDailyCollectionDto) {
    return this.dailyCollectionsService.create(createDailyCollectionDto);
  }

  @ApiOperation({ summary: 'Listar todos os formulários cadastrados' })
  @ApiResponse({ status: 200, description: 'Formulários listados com sucesso' })
  @Get()
  async findAll(@Query() query: FindDailyCollectionsDto) {
    const criteria: DailyCollectionCriteria = {
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

  @ApiOperation({ summary: 'Buscar um formulário pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do formulário', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Formulário encontrado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dailyCollectionsService.findOne(id);
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
  ) {
    return this.dailyCollectionsService.update(id, updateDailyCollectionDto);
  }

  @ApiOperation({ summary: 'Excluir formulário pelo ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do formulário', type: Number })
  @ApiResponse({ status: 200, description: 'Formulário excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  @Delete(':id')
  @ResponseMessage('Coleta excluída com sucesso')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.dailyCollectionsService.remove(id);
  }

  @ApiOperation({
    summary: 'Buscar todos os formulários de um usuário pelo ID',
  })
  @ApiParam({ name: 'userId', description: 'ID do usuário', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Formulários encontrados com sucesso',
  })
  @Get('user/:userId')
  async findAllByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.dailyCollectionsService.findAll({ userId });
  }
}