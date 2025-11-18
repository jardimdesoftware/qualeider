import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpStatus,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
  Query,
} from '@nestjs/common';
import { AnimalsService } from '@/application/services/animals/animals.service';
import { CreateAnimalDto } from '@/application/dtos/animals/create-animal.dto';
import { UpdateAnimalDto } from '@/application/dtos/animals/update-animal.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('Animais')
@Controller('animals')
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @ApiOperation({ summary: 'Cadastrar um Animal' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Animal cadastrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createAnimalDto: CreateAnimalDto) {
    const result = await this.animalsService.create(createAnimalDto);
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Animal criado com sucesso',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Listar todos os animais' })
  @ApiQuery({ name: 'associationId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Animais listados com sucesso' })
  @Get()
  async findAll(@Query('associationId') associationId?: string) {
    const assocId = associationId ? Number(associationId) : undefined;
    
    return this.animalsService.findAll(assocId);
  }

  @ApiOperation({ summary: 'Buscar um animal pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Animal encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Animal não encontrado' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.findOne(id);
  }

  @ApiOperation({ summary: 'Atualizar dados de um animal' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Animal atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Animal não encontrado' })
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAnimalDto: UpdateAnimalDto,
  ) {
    const result = await this.animalsService.update(id, updateAnimalDto);
    return {
      statusCode: HttpStatus.OK,
      message: 'Animal atualizado com sucesso',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Excluir (desativar) um animal' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Animal excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Animal não encontrado' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.remove(id);
  }

  @ApiOperation({ summary: 'Buscar animais de um usuário específico' })
  @ApiParam({ name: 'userId', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de animais do usuário' })
  @Get('user/:userId')
  async findAllByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.animalsService.findAllByUserId(userId);
  }
}