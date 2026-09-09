import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AllowedEmailsService } from '@/application/services/allowed-emails/allowed-emails.service';
import { CreateAllowedEmailDto } from '@/application/dtos/allowed-emails/create-allowed-email.dto';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { GetUser } from '@/common/decorators/get-user.decorator';
import { UserRole } from '@/domain/enums/enums';

/**
 * Lista de emails de fora do domínio ifpe.edu.br liberados para logar via
 * Google (ver AuthService.loginWithGoogle) — gerenciada por qualquer Admin
 * logado, na tela de Funcionários do frontend.
 */
@ApiTags('Emails Liberados (Admin)')
@ApiBearerAuth()
@Controller('allowed-emails')
export class AllowedEmailsController {
  constructor(private readonly allowedEmailsService: AllowedEmailsService) {}

  private assertAdmin(role?: UserRole): void {
    if (role !== UserRole.ADMIN) {
      throw new ForbiddenException(
        'Você não tem permissão para gerenciar emails liberados.',
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Listar emails externos liberados para login via Google' })
  @ApiResponse({ status: 200, description: 'Emails listados com sucesso' })
  @ResponseMessage('Emails listados com sucesso')
  async findAll(@GetUser('role') role?: UserRole) {
    this.assertAdmin(role);
    return this.allowedEmailsService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Liberar um email externo para login via Google' })
  @ApiResponse({ status: 201, description: 'Email liberado com sucesso' })
  @ResponseMessage('Email liberado com sucesso')
  async create(@Body() dto: CreateAllowedEmailDto, @GetUser('role') role?: UserRole) {
    this.assertAdmin(role);
    return this.allowedEmailsService.create(dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover a liberação de um email externo' })
  @ApiResponse({ status: 200, description: 'Liberação removida com sucesso' })
  @ResponseMessage('Liberação removida com sucesso')
  async remove(@Param('id', ParseIntPipe) id: number, @GetUser('role') role?: UserRole) {
    this.assertAdmin(role);
    await this.allowedEmailsService.remove(id);
    return null;
  }
}
