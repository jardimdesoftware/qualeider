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
import { BreedsService } from '@/application/services/breeds/breeds.service';
import { CreateBreedDto } from '@/application/dtos/breeds/create-breed.dto';
import { UpdateBreedDto } from '@/application/dtos/breeds/update-breed.dto';
import {
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { AdminOnlyGuard } from '@/application/guards/admin-only.guard';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@ApiTags('Raças')
@Controller('breeds')
export class BreedsController {
  constructor(private readonly breedsService: BreedsService) {}

  @ApiOperation({ summary: 'Cadastrar uma Raça' })
  @ApiResponse({ status: 201, description: 'Raça cadastrada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou raça já existe' })
  @Post()
  @UseGuards(AdminOnlyGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ResponseMessage('Raça criada com sucesso')
  async create(@Body() createBreedDto: CreateBreedDto) {
    return this.breedsService.create(createBreedDto);
  }

  @ApiOperation({ summary: 'Listar todas as raças' })
  @ApiResponse({ status: 200, description: 'Raças listadas com sucesso' })
  @Get()
  @Public()
  @ResponseMessage('Raças listadas com sucesso')
  async findAll() {
    return this.breedsService.findAll();
  }

  @ApiOperation({ summary: 'Buscar uma raça pelo ID' })
  @ApiParam({ name: 'id', description: 'ID da raça', type: Number })
  @ApiResponse({ status: 200, description: 'Raça encontrada com sucesso' })
  @ApiResponse({ status: 404, description: 'Raça não encontrada' })
  @Get(':id')
  @Public()
  @ResponseMessage('Raça encontrada')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.breedsService.findOne(id);
  }

  @ApiOperation({ summary: 'Atualizar dados de uma raça' })
  @ApiParam({ name: 'id', description: 'ID da raça', type: Number })
  @ApiResponse({ status: 200, description: 'Raça atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Raça não encontrada' })
  @Put(':id')
  @UseGuards(AdminOnlyGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ResponseMessage('Raça atualizada com sucesso')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBreedDto: UpdateBreedDto,
  ) {
    return this.breedsService.update(id, updateBreedDto);
  }

  @ApiOperation({ summary: 'Excluir uma raça' })
  @ApiParam({ name: 'id', description: 'ID da raça', type: Number })
  @ApiResponse({ status: 200, description: 'Raça excluída com sucesso' })
  @ApiResponse({ status: 404, description: 'Raça não encontrada' })
  @Delete(':id')
  @UseGuards(AdminOnlyGuard)
  @ResponseMessage('Raça excluída com sucesso')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.breedsService.remove(id);
  }
}
