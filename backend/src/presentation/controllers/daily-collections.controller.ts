import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  HttpException,
  HttpStatus,
  NotFoundException,
  ValidationPipe,
  UsePipes,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { DailyCollectionsService } from '../../daily-collections/daily-collections.service';
import { CreateDailyCollectionDto } from '../../daily-collections/dto/create-daily-collection.dto';
import { UpdateDailyCollectionDto } from '../../daily-collections/dto/update-daily-collection.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

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
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createDailyCollectionDto: CreateDailyCollectionDto) {
    try {
      const result = await this.dailyCollectionsService.create(
        createDailyCollectionDto,
      );
      return {
        statusCode: HttpStatus.CREATED,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          { status: HttpStatus.NOT_FOUND, error: error.message },
          HttpStatus.NOT_FOUND,
        );
      } else if (error instanceof PrismaClientKnownRequestError) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Dados inválidos.',
            details: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Ocorreu um erro ao responder o formulário.',
            details: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @ApiOperation({ summary: 'Listar todos os formulários cadastrados' })
  @ApiResponse({ status: 200, description: 'Formulários listados com sucesso' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @Get()
  async findAll() {
    try {
      const result = await this.dailyCollectionsService.findAll();
      return result;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao listar os formulários.',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Verificar se o usuário já enviou um formulário' })
  @ApiQuery({ name: 'userId', description: 'ID do usuário', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Verificação realizada com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @Get('check')
  async checkIfUserAlreadySubmitted(@Query('userId') userId: string) {
    try {
      const userIdNumber = parseInt(userId, 10);
      if (isNaN(userIdNumber)) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'O ID do usuário deve ser um número válido.',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const result =
        await this.dailyCollectionsService.checkIfUserAlreadySubmitted(
          userIdNumber,
        );
      return {
        statusCode: HttpStatus.OK,
        message: 'Verificação realizada com sucesso.',
        data: result,
      };
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao verificar a submissão.',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @ApiOperation({ summary: 'Buscar um formulário pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do formulário', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Formulário encontrado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @Get(':id')
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    try {
      const result = await this.dailyCollectionsService.findOne(id);
      return result;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          { status: HttpStatus.NOT_FOUND, error: error.message },
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Ocorreu um erro ao buscar o formulário.',
            details: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
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
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true }))
  async update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() updateDailyCollectionDto: UpdateDailyCollectionDto,
  ) {
    try {
      const result = await this.dailyCollectionsService.update(
        id,
        updateDailyCollectionDto,
      );
      return {
        statusCode: HttpStatus.OK,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          { status: HttpStatus.NOT_FOUND, error: error.message },
          HttpStatus.NOT_FOUND,
        );
      } else if (error instanceof PrismaClientKnownRequestError) {
        throw new HttpException(
          {
            status: HttpStatus.BAD_REQUEST,
            error: 'Dados inválidos.',
            details: error.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Ocorreu um erro ao atualizar o formulário.',
            details: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @ApiOperation({ summary: 'Excluir formularios pelo ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do formulario', type: Number })
  @ApiResponse({ status: 200, description: 'Formulário excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Formulário não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @Delete(':id')
  async remove(@Param('id', new ParseIntPipe()) id: number) {
    try {
      const result = await this.dailyCollectionsService.remove(id);
      return {
        statusCode: HttpStatus.OK,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          { status: HttpStatus.NOT_FOUND, error: error.message },
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Ocorreu um erro ao excluir o formulário.',
            details: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  @ApiOperation({
    summary: 'Buscar todos os formulários de um usuário pelo ID',
  })
  @ApiQuery({ name: 'userId', description: 'ID do usuário', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Formulários encontrados com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Nenhum formulário encontrado para o usuário',
  })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @Get('user/:userId')
  async findAllByUserId(@Param('userId', new ParseIntPipe()) userId: number) {
    try {
      const result = await this.dailyCollectionsService.findAllByUserId(userId);
      return result.data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          { status: HttpStatus.NOT_FOUND, error: error.message },
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Ocorreu um erro ao buscar os formulários.',
            details: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
