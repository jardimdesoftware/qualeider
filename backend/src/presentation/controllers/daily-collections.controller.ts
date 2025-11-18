import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpStatus,
  ValidationPipe,
  UsePipes,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { DailyCollectionsService } from '@/application/services/daily-collections/daily-collections.service';
import { CreateDailyCollectionDto } from '@/application/dtos/daily-collections/create-daily-collection.dto';
import { UpdateDailyCollectionDto } from '@/application/dtos/daily-collections/update-daily-collection.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { BusinessException } from '@/common/exceptions/business.exception';

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
  async create(@Body() createDailyCollectionDto: CreateDailyCollectionDto) {
    const result = await this.dailyCollectionsService.create(
      createDailyCollectionDto,
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Coleta criada com sucesso',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Listar todos os formulários cadastrados' })
  @ApiResponse({ status: 200, description: 'Formulários listados com sucesso' })
  @Get()
  async findAll(@Query('associationId') associationId?: string) {
    const assocId = associationId ? Number(associationId) : undefined;
    return this.dailyCollectionsService.findAll(assocId);
  }

  @ApiOperation({ summary: 'Verificar se o usuário já enviou um formulário' })
  @ApiQuery({ name: 'userId', description: 'ID do usuário', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Verificação realizada com sucesso',
  })
  @Get('check')
  async checkIfUserAlreadySubmitted(@Query('userId') userId: string) {
    const userIdNumber = Number(userId);
    
    if (isNaN(userIdNumber)) {
      throw new BusinessException('O ID do usuário deve ser um número válido.');
    }
   
    return {
      statusCode: HttpStatus.OK,
      message: 'Verificação realizada com sucesso.',
    };
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
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDailyCollectionDto: UpdateDailyCollectionDto,
  ) {
    const result = await this.dailyCollectionsService.update(
      id,
      updateDailyCollectionDto,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Coleta atualizada com sucesso',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Excluir formulário pelo ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do formulário', type: Number })
  @ApiResponse({ status: 200, description: 'Formulário excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.dailyCollectionsService.remove(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Coleta excluída com sucesso',
      data: result,
    };
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
    return this.dailyCollectionsService.findAllByUserId(userId);
  }
}