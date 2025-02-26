import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseGuards,
  Req,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  ParseIntPipe,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AnimalsService } from './animals.service';
import { CreateAnimalDto } from './dto/create-animal.dto';
import { UpdateAnimalDto } from './dto/update-animal.dto';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@ApiTags('Animais') 
@Controller('animals')
// @UseGuards(AuthGuard('jwt')) // Protege todas as rotas de animais
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @ApiOperation({ summary: 'Cadastrar um Animal' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Animal cadastrado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createAnimalDto: CreateAnimalDto) {
    try {
      const result = await this.animalsService.create(createAnimalDto);
      return {
        statusCode: HttpStatus.CREATED,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: error.message,
          },
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
            error: 'Ocorreu um erro ao criar o animal.',
            details: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }


  @ApiOperation({ summary: 'Listar todos os animais' })
  @ApiResponse({ status: 200, description: 'Animais listados com sucesso' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @Get()
  async findAll() {
    try {
      const result = await this.animalsService.findAll();
      return result;
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'Ocorreu um erro ao listar os animais.',
          details: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }


  @ApiOperation({ summary: 'Buscar um animal pelo ID' })
  @ApiParam({ name: 'id', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Animal encontrado com sucesso' })
  @ApiResponse({ status: 404, description: 'Animal não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @Get(':id')
  async findOne(@Param('id', new ParseIntPipe()) id: number) {
    try {
      const result = await this.animalsService.findOne(id);
      return result.data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Ocorreu um erro ao buscar o animal.',
            details: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }


  @ApiOperation({ summary: 'Atualizar todos os dados de um animal pelo ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Animal atualizado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Animal não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true })) 
  async update(
    @Param('id', new ParseIntPipe()) id: number,
    @Body() updateAnimalDto: UpdateAnimalDto,
  ) {
    try {
      const result = await this.animalsService.update(id, updateAnimalDto);
      return {
        statusCode: HttpStatus.OK,
        message: result.message,
        data: result.data,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: error.message,
          },
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
            error: 'Ocorreu um erro ao atualizar o animal.',
            details: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }


  @ApiOperation({ summary: 'Excluir um animal pelo ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'ID do animal', type: Number })
  @ApiResponse({ status: 200, description: 'Animal excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Animal não encontrado' })
  @ApiResponse({ status: 500, description: 'Erro interno do servidor' })
  @Delete(':id')
  async remove(@Param('id', new ParseIntPipe()) id: number) {
    try {
      const result = await this.animalsService.remove(id);
      return result; 
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Ocorreu um erro ao desativar o animal.',
            details: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }


  @ApiOperation({ summary: 'Buscar animais do usuário pelo ID do usuário' })
  @ApiParam({ name: 'id', description: 'ID do usuário', type: Number }) 
  @ApiResponse({ status: 200, description: 'Animais do usuário encontrado' })
  @ApiResponse({ status: 404, description: 'Animais do usuário não encontrado' })
  @Get('user/:userId') // Rota: GET /animals/user/:userId
  async findAllByUserId(@Param('userId', new ParseIntPipe()) userId: number) {
    try {
      const animals = await this.animalsService.findAllByUserId(Number(userId));
      return animals; 

    } catch (error) {

      if (error instanceof NotFoundException) {
        throw new HttpException(
          {
            status: HttpStatus.NOT_FOUND,
            error: error.message,
          },
          HttpStatus.NOT_FOUND,
        );
      } else {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: 'Ocorreu um erro ao buscar os animais.',
            details: error.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}