import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Patch,
  Delete,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_TTL } from '@/common/throttler/throttler.config';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from '@/application/services/users/users.service';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import { FindUsersDto } from '@/application/dtos/users/find-users.dto';
import { BusinessException } from '@/common/exceptions/business.exception';
import { UserCriteria } from '@/domain/criteria/user.criteria';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { UserRole } from '@/domain/enums/enums';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Registro público — sempre cria conta com role ADMIN (dono da fazenda).
   * O campo `role` do body é ignorado por segurança.
   */
  @Throttle({ default: { limit: 5, ttl: THROTTLE_TTL.LONG } })
  @Post()
  @Public()
  @ApiOperation({ summary: 'Registro público: cria conta Admin (dono da fazenda)' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  @ResponseMessage('Usuário criado com sucesso')
  async create(@Body() createUserDto: CreateUserDto) {
    // Garante que o registro público SEMPRE cria um Admin
    return this.usersService.create({ ...createUserDto, role: UserRole.ADMIN });
  }

  /**
   * Criação interna — usado pelo Admin logado para cadastrar funcionários (Vaqueiros).
   * Requer autenticação JWT. Aceita qualquer role (ADMIN ou VAQUEIRO).
   */
  @Throttle({ default: { limit: 20, ttl: THROTTLE_TTL.LONG } })
  @Post('internal')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criação interna: Admin cadastra funcionários (Vaqueiros)' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Não autorizado' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  @ResponseMessage('Usuário criado com sucesso')
  async createInternal(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get('check-email')
  @Public()
  @ApiOperation({ summary: 'Verificar se email já está cadastrado' })
  @ApiQuery({ name: 'email', required: true })
  @ApiResponse({ status: 200, description: 'Retorna se o email existe' })
  async checkEmail(@Query('email') email: string) {
    if (!email) {
      throw new BusinessException('Email é obrigatório');
    }
    const user = await this.usersService.findByEmail(email);
    
    return { exists: !!user };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiBearerAuth()
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários obtida com sucesso',
  })
  async findAll(@Query() query: FindUsersDto) {
    const criteria: UserCriteria = {
      associationId: query.associationId,
      status: query.status,
      emailContains: query.emailContains,
    };
    
    return this.usersService.findAll(criteria);
  }

  @Get(':id')
  @ResponseMessage('Usuário encontrado')
  @ApiOperation({ summary: 'Buscar um usuário pelo ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Atualizar todos os dados de um usuário pelo ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Put(':id')
  @ResponseMessage('Usuário atualizado com sucesso')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Atualizar alguns dados de um usuário pelo ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Patch(':id')
  @ResponseMessage('Usuário atualizado com sucesso')
  async partialUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePartialUserDto: UpdatePartialUserDto,
  ) {
    return this.usersService.partialUpdate(id, updatePartialUserDto);
  }

  @ApiOperation({ summary: 'Excluir um usuário pelo ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Delete(':id')
  @ResponseMessage('Usuário excluído com sucesso')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}