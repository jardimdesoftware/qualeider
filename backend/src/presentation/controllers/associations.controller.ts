import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AssociationsService } from '@/application/services/associations/associations.service';
import { CreateAssociationDto } from '@/application/dtos/associations/create-association.dto';

@ApiTags('associations')
@Controller('associations')
export class AssociationsController {
  constructor(private readonly associationsService: AssociationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar uma nova associação' })
  @ApiResponse({
    status: 201,
    description: 'Associação criada com sucesso.',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'Email ou CNPJ já cadastrado.' })
  async create(@Body() createAssociationDto: CreateAssociationDto) {
    return this.associationsService.create(createAssociationDto);
  }

  @Get('check-email')
  @ApiOperation({ summary: 'Verificar se o email já está cadastrado' })
  @ApiResponse({ status: 200, description: 'Retorna se o email existe.' })
  @ApiResponse({ status: 400, description: 'Email não fornecido.' })
  async checkEmail(@Query('email') email: string) {
    if (!email) {
      throw new BadRequestException('Email é obrigatório');
    }
    const association = await this.associationsService.findByEmail(email);
    return { exists: !!association };
  }

  @Get('check-cnpj')
  @ApiOperation({ summary: 'Verificar se o CNPJ já está cadastrado' })
  @ApiResponse({ status: 200, description: 'Retorna se o CNPJ existe.' })
  @ApiResponse({ status: 400, description: 'CNPJ não fornecido.' })
  async checkCnpj(@Query('cnpj') cnpj: string) {
    if (!cnpj) {
      throw new BadRequestException('CNPJ é obrigatório');
    }
    const association = await this.associationsService.findByCnpj(cnpj);
    return { exists: !!association };
  }
}
