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
  async create(@Body() createAnimalDto: CreateAnimalDto) {
    return this.animalsService.create(createAnimalDto);
  }

  @ApiOperation({ summary: 'Listar todos os animais' })
  @ApiResponse({ status: 200, description: 'Animais listados com sucesso' })
  @Get()
  async findAll(@Query() query: FindAnimalsDto) {
    const criteria: AnimalCriteria = {
      associationId: query.associationId,
      userId: query.userId,
      status: query.status,
      animalType: query.animalType,
      animalSpeciesId: query.animalSpeciesId,
      tagNumber: query.tagNumber,
    };
    return this.animalsService.findAll(criteria);
  }

  @Get(':id')
  @ResponseMessage('Animal encontrado')
  @ApiOperation({ summary: 'Buscar um animal pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Animal encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Animal nao encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.findOne(id);
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
  ) {
    return this.animalsService.update(id, updateAnimalDto);
  }

  @ApiOperation({ summary: 'Excluir (desativar) um animal' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Animal excluido com sucesso' })
  @ApiResponse({ status: 404, description: 'Animal nao encontrado' })
  @Delete(':id')
  @ResponseMessage('Animal excluido com sucesso')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.remove(id);
  }

  @ApiOperation({ summary: 'Inativar um animal (preserva historico de coletas)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Animal inativado com sucesso' })
  @ApiResponse({ status: 404, description: 'Animal nao encontrado' })
  @Patch(':id/inativar')
  @ResponseMessage('Animal inativado com sucesso')
  async inativar(@Param('id', ParseIntPipe) id: number) {
    return this.animalsService.inativar(id);
  }

  @ApiOperation({ summary: 'Buscar animais de um usuario especifico' })
  @ApiParam({ name: 'userId', description: 'ID do usuario', type: Number })
  @ApiResponse({ status: 200, description: 'Lista de animais do usuario' })
  @Get('user/:userId')
  @ResponseMessage('Animais do usuario listados com sucesso')
  async findAllByUserId(@Param('userId', ParseIntPipe) userId: number) {
    return this.animalsService.findAll({ userId });
  }
}
