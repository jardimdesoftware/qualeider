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
  UseGuards,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_TTL } from '@/common/throttler/throttler.config';
import { JwtAuthGuard } from '@/application/guards/jwt-auth.guard';
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

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Throttle({ default: { limit: 5, ttl: THROTTLE_TTL.LONG } }) 
  @ApiOperation({ summary: 'Criar um usuário' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email já cadastrado' })
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const result = await this.usersService.create(createUserDto);
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Usuário criado com sucesso',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Verificar se email já está cadastrado' })
  @ApiQuery({ name: 'email', required: true })
  @ApiResponse({ status: 200, description: 'Retorna se o email existe' })
  @Get('check-email')
  async checkEmail(@Query('email') email: string) {
    if (!email) {
      throw new BusinessException('Email é obrigatório');
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
  async findAll(@Query() query: FindUsersDto) {
    const criteria: UserCriteria = {
      associationId: query.associationId,
      status: query.status,
      emailContains: query.emailContains,
    };
    
    return this.usersService.findAll(criteria);
  }

  @ApiOperation({ summary: 'Buscar um usuário pelo ID' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Atualizar todos os dados de um usuário pelo ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto
  ) {
    const result = await this.usersService.update(id, updateUserDto);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Usuário atualizado com sucesso',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Atualizar alguns dados de um usuário pelo ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Patch(':id')
  async partialUpdate(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePartialUserDto: UpdatePartialUserDto,
  ) {
    const result = await this.usersService.partialUpdate(id, updatePartialUserDto);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Usuário atualizado com sucesso',
      data: result,
    };
  }

  @ApiOperation({ summary: 'Excluir um usuário pelo ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number })
  @ApiResponse({ status: 200, description: 'Usuário excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.usersService.remove(id);
    
    return {
      statusCode: HttpStatus.OK,
      message: 'Usuário excluído com sucesso',
      data: result,
    };
  }
}