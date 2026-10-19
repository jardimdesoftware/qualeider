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
  UseGuards,
} from '@nestjs/common';
import { DestinationsService } from '@/application/services/destinations/destinations.service';
import { CreateDestinationDto } from '@/application/dtos/destinations/create-destination.dto';
import { UpdateDestinationDto } from '@/application/dtos/destinations/update-destination.dto';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminOnlyGuard } from '@/application/guards/admin-only.guard';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

/**
 * Destinos do leite (laticínio, consumo, bezerros...). Qualquer usuário logado
 * lista (o vaqueiro escolhe o destino na coleta); só o ADMIN cria, edita e exclui.
 */
@ApiTags('Destinos')
@ApiBearerAuth()
@Controller('destinations')
export class DestinationsController {
  constructor(private readonly destinationsService: DestinationsService) {}

  @ApiOperation({ summary: 'Cadastrar um destino do leite' })
  @ApiResponse({ status: 201, description: 'Destino cadastrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou destino já existe' })
  @Post()
  @UseGuards(AdminOnlyGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ResponseMessage('Destino criado com sucesso')
  async create(@Body() createDestinationDto: CreateDestinationDto) {
    return this.destinationsService.create(createDestinationDto);
  }

  @ApiOperation({ summary: 'Listar todos os destinos' })
  @ApiResponse({ status: 200, description: 'Destinos listados com sucesso' })
  @Get()
  @ResponseMessage('Destinos listados com sucesso')
  async findAll() {
    return this.destinationsService.findAll();
  }

  @ApiOperation({ summary: 'Buscar um destino pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do destino', type: Number })
  @ApiResponse({ status: 200, description: 'Destino encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Destino não encontrado' })
  @Get(':id')
  @ResponseMessage('Destino encontrado')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.findOne(id);
  }

  @ApiOperation({ summary: 'Atualizar dados de um destino' })
  @ApiParam({ name: 'id', description: 'ID do destino', type: Number })
  @ApiResponse({ status: 200, description: 'Destino atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Destino não encontrado' })
  @Put(':id')
  @UseGuards(AdminOnlyGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ResponseMessage('Destino atualizado com sucesso')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDestinationDto: UpdateDestinationDto,
  ) {
    return this.destinationsService.update(id, updateDestinationDto);
  }

  @ApiOperation({ summary: 'Excluir um destino' })
  @ApiParam({ name: 'id', description: 'ID do destino', type: Number })
  @ApiResponse({ status: 200, description: 'Destino excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Destino não encontrado' })
  @Delete(':id')
  @UseGuards(AdminOnlyGuard)
  @ResponseMessage('Destino excluído com sucesso')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.destinationsService.remove(id);
  }
}
