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
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/application/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from '@/application/services/users/users.service';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';

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

  @ApiOperation({ summary: 'Verificar se email já está cadastrado' })
  @ApiResponse({ status: 200, description: 'Retorna se o email existe' })
  @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Email inválido');
    }
    const user = await this.usersService.findByEmail(email);
    return { exists: !!user };
  }

  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários obtida com sucesso',
  })
  @Get()
  async findAll(@Query('associationId') associationId?: string) {
    const assocId = associationId ? +associationId : undefined;
    if (associationId && isNaN(assocId)) {
      throw new BadRequestException('associationId inválido');
    }
    return this.usersService.findAll(assocId);
  }

  @ApiOperation({ summary: 'Buscar um usuário pelo ID' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Delete(':id')
  async remove(@Param('id') id: string) {
    if (isNaN(+id)) throw new BadRequestException('ID inválido');
    return this.usersService.remove(+id);
  }
}
