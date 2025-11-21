import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  Query,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_TTL } from '@/common/throttler/throttler.config';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AssociationsService } from '@/application/services/associations/associations.service';
import { CreateAssociationDto } from '@/application/dtos/associations/create-association.dto';
import { BusinessException } from '@/common/exceptions/business.exception';

@ApiTags('associations')
@Controller('associations')
export class AssociationsController {
  constructor(private readonly associationsService: AssociationsService) {}

  @Throttle({ default: { limit: 5, ttl: THROTTLE_TTL.LONG } })
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
    const result = await this.associationsService.create(createAssociationDto);
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Associação criada com sucesso',
      data: result,
    };
  }

  @Get('check-email')
  @ApiOperation({ summary: 'Verificar se o email já está cadastrado' })
  @ApiQuery({ name: 'email', required: true })
  @ApiResponse({ status: 200, description: 'Retorna se o email existe.' })
  @ApiResponse({ status: 400, description: 'Email não fornecido.' })
  async checkEmail(@Query('email') email: string) {
    if (!email) {
      throw new BusinessException('Email é obrigatório');
    }
    const association = await this.associationsService.findByEmail(email);
    return { exists: !!association };
  }

  @Get('check-cnpj')
  @ApiOperation({ summary: 'Verificar se o CNPJ já está cadastrado' })
  @ApiQuery({ name: 'cnpj', required: true })
  @ApiResponse({ status: 200, description: 'Retorna se o CNPJ existe.' })
  @ApiResponse({ status: 400, description: 'CNPJ não fornecido.' })
  async checkCnpj(@Query('cnpj') cnpj: string) {
    if (!cnpj) {
      throw new BusinessException('CNPJ é obrigatório');
    }
    const association = await this.associationsService.findByCnpj(cnpj);
    return { exists: !!association };
  }
}