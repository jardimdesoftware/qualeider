import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from '../../users/users.service';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UpdateUserDto } from '../../users/dto/update-user.dto';
import { UpdatePartialUserDto } from '../../users/dto/update-partial-user.dto';

@ApiTags('Usuários')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Criar um usuário' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários obtida com sucesso',
  })
  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Buscar um usuário pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    if (isNaN(+id)) throw new BadRequestException('ID inválido');
    return this.usersService.findOne(+id);
  }

  @ApiOperation({ summary: 'Atualizar todos os dados de um usuário pelo ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Put(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    if (isNaN(+id)) throw new BadRequestException('ID inválido');
    return this.usersService.update(+id, updateUserDto);
  }

  @ApiOperation({ summary: 'Atualizar alguns dados de um usuário pelo ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Patch(':id')
  async partialUpdate(
    @Param('id') id: string,
    @Body() updatePartialUserDto: UpdatePartialUserDto,
  ) {
    if (isNaN(+id)) throw new BadRequestException('ID inválido');
    return this.usersService.partialUpdate(+id, updatePartialUserDto);
  }

  @ApiOperation({ summary: 'Excluir um usuário pelo ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    if (isNaN(+id)) throw new BadRequestException('ID inválido');
    return this.usersService.remove(+id);
  }
}
