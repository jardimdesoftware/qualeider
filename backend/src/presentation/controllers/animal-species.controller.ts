import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import { AnimalSpeciesService } from '@/application/services/animal-species/animal-species.service';
import { CreateAnimalSpeciesDto } from '@/application/dtos/animal-species/create-animal-species.dto';
import { UpdateAnimalSpeciesDto } from '@/application/dtos/animal-species/update-animal-species.dto';
import { Public } from '@/common/decorators/public.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@ApiTags('Tipos de Animal')
@Public()
@Controller('animal-species')
export class AnimalSpeciesController {
  constructor(private readonly service: AnimalSpeciesService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  @ResponseMessage('Tipo criado com sucesso')
  async create(@Body() dto: CreateAnimalSpeciesDto) {
    return this.service.create(dto);
  }

  @Get()
  @ResponseMessage('Tipos listados com sucesso')
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: Number })
  @ResponseMessage('Tipo encontrado')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Put(':id')
  @ApiParam({ name: 'id', type: Number })
  @UsePipes(new ValidationPipe({ transform: true }))
  @ResponseMessage('Tipo atualizado com sucesso')
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateAnimalSpeciesDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', type: Number })
  @ResponseMessage('Tipo excluído com sucesso')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
