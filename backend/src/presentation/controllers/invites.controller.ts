import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { THROTTLE_TTL } from '@/common/throttler/throttler.config';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InvitesService } from '@/application/services/invites/invites.service';
import { CreateInviteDto } from '@/application/dtos/invites/create-invite.dto';
import { RespondInviteDto } from '@/application/dtos/invites/respond-invite.dto';
import { InviteStatus } from '@/domain/enums/enums';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';

@Controller('invites')
@ApiTags('Invites')
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Throttle({ default: { limit: 10, ttl: THROTTLE_TTL.LONG } })
  @Post('association/:associationId')
  @ApiOperation({ summary: 'Associação envia convite para um usuário' })
  @ApiParam({ name: 'associationId', description: 'ID da associação' })
  @ApiResponse({
    status: 201,
    description: 'Convite enviado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Usuário ou associação não encontrados' })
  @ApiResponse({ status: 409, description: 'Usuário já vinculado ou convite pendente existe' })
  @ResponseMessage('Convite enviado com sucesso')
  async createInvite(
    @Param('associationId', ParseIntPipe) associationId: number,
    @Body() dto: CreateInviteDto,
  ) {
    return this.invitesService.createInvite(associationId, dto);
  }

  @Get('user/:userId/pending')
  @ApiOperation({ summary: 'Listar convites pendentes do usuário' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Lista de convites pendentes',
  })
  async getUserPendingInvites(@Param('userId', ParseIntPipe) userId: number) {
    return this.invitesService.getUserPendingInvites(userId);
  }

  @Get('association/:associationId')
  @ApiOperation({ summary: 'Listar convites enviados pela associação' })
  @ApiParam({ name: 'associationId', description: 'ID da associação' })
  @ApiQuery({ name: 'status', enum: InviteStatus, required: false })
  @ApiResponse({
    status: 200,
    description: 'Lista de convites',
  })
  async getAssociationInvites(
    @Param('associationId', ParseIntPipe) associationId: number,
    @Query('status') status?: InviteStatus,
  ) {
    return this.invitesService.getAssociationInvites(associationId, status);
  }

  @Delete('association/:associationId/:inviteId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Associação cancela convite pendente' })
  @ApiParam({ name: 'associationId', description: 'ID da associação' })
  @ApiParam({ name: 'inviteId', description: 'ID do convite' })
  @ApiResponse({
    status: 200,
    description: 'Convite cancelado com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Convite não encontrado ou já foi respondido' })
  @ResponseMessage('Convite cancelado com sucesso')
  async cancelInvite(
    @Param('associationId', ParseIntPipe) associationId: number,
    @Param('inviteId', ParseIntPipe) inviteId: number,
  ) {
    return this.invitesService.cancelInvite(associationId, inviteId);
  }

  @Get('token/:token')
  @ApiOperation({ summary: 'Buscar detalhes do convite pelo token' })
  @ApiParam({ name: 'token', description: 'Token único do convite' })
  @ApiResponse({
    status: 200,
    description: 'Dados do convite',
  })
  @ApiResponse({ status: 404, description: 'Convite não encontrado' })
  async getInviteByToken(@Param('token') token: string) {
    return this.invitesService.getInviteByToken(token);
  }

  @Patch('token/:token/respond')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Usuário aceita ou recusa convite' })
  @ApiParam({ name: 'token', description: 'Token único do convite' })
  @ApiResponse({
    status: 200,
    description: 'Convite respondido com sucesso',
  })
  @ApiResponse({ status: 404, description: 'Convite não encontrado' })
  @ApiResponse({ status: 400, description: 'Convite já respondido ou expirado' })
  @ResponseMessage('Resposta registrada com sucesso')
  async respondToInvite(
    @Param('token') token: string,
    @Body() dto: RespondInviteDto,
  ) {
    return this.invitesService.respondToInvite(token, dto.response);
  }
}