import { Injectable, Logger, Inject, ForbiddenException } from '@nestjs/common';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { IHashService } from '@/application/ports/hash.service';
import { CreateUserDto } from '@/application/dtos/users/create-user.dto';
import { UpdateUserDto } from '@/application/dtos/users/update-user.dto';
import { UpdatePartialUserDto } from '@/application/dtos/users/update-partial-user.dto';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { BCRYPT_ROUNDS_USER_CREATION } from '@/common/constants/security.constants';
import { UserCriteria } from '@/domain/criteria/user.criteria';
import { UserRole } from '@/domain/enums/enums';

/**
 * Identidade de quem esta fazendo a requisicao (extraida do JWT), usada para
 * checar se o requisitante e ADMIN antes de gerenciar usuarios.
 */
export interface RequesterContext {
  id: number;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @Inject(IUserRepository) private readonly userRepository: IUserRepository,
    @Inject(IHashService) private readonly hashService: IHashService,
  ) {}

  async create(createUserDto: CreateUserDto & { adminId?: number }) {
    const { password, ...rest } = createUserDto;

    const hashedPassword = await this.hashPasswordIfNeeded(password);

    // Repository lança BusinessException se email duplicar (P2002)
    const user = await this.userRepository.create({
      ...rest,
      role: rest.role ?? UserRole.ADMIN, // garante valor sempre presente
      password: hashedPassword!,
    });

    this.logger.log(`Usuário criado: ${user.email} (ID: ${user.id})`);
    return this.removePassword(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto, requester: RequesterContext) {
    this.assertIsAdmin(requester);
    return this.performUpdate(id, updateUserDto);
  }

  async partialUpdate(
    id: number,
    updatePartialUserDto: UpdatePartialUserDto,
    requester: RequesterContext,
  ) {
    this.assertIsAdmin(requester);
    return this.performUpdate(id, updatePartialUserDto);
  }

  /**
   * Garante que o requisitante e ADMIN. Sistema single-tenant (uso interno
   * do IFPE, sem cooperativas/associacoes distintas isolando "fazendas"
   * diferentes): todo ADMIN gerencia todos os usuarios. Sem essa checagem,
   * qualquer usuario autenticado (inclusive VAQUEIRO) conseguia editar
   * role/associationId de qualquer conta do sistema via PUT/PATCH
   * /users/:id (escalada de privilegio).
   */
  private assertIsAdmin(requester: RequesterContext): void {
    if (requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Você não tem permissão para gerenciar usuários.');
    }
  }

  async remove(id: number, requester: RequesterContext) {
    this.assertIsAdmin(requester);
    const deactivated = await this.userRepository.softDelete(id);
    this.logger.log(`Usuário removido (soft delete): ID ${id}`);
    return this.removePassword(deactivated);
  }

  async findByEmail(email: string) {
    this.logger.debug(`Buscando usuário por email: ${email}`);
    return this.userRepository.findByEmail(email);
  }

  /**
   * Lista usuarios. So ADMIN pode listar (VAQUEIRO nao gerencia ninguem).
   * Sistema single-tenant: todo ADMIN ve todos os usuarios, sem isolamento
   * por "fazenda" - ver assertIsAdmin.
   */
  async findAll(criteria: UserCriteria, requester: RequesterContext) {
    this.assertIsAdmin(requester);

    const result = await this.userRepository.findAll(criteria);
    return {
      ...result,
      data: result.data.map(user => this.removePassword(user))
    };
  }

  /**
   * Busca interna por ID, sem checagem de autorizacao. Usada internamente
   * (ex.: JwtStrategy carregando o proprio usuario autenticado a cada
   * requisicao) - NAO deve ser exposta diretamente por um controller sem
   * antes checar o escopo do requisitante (ver findOneForRequester).
   */
  async findOne(id: number) {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new EntityNotFoundException(
        `Usuário com ID ${id} não encontrado ou está inativo.`,
      );
    }
    return this.removePassword(user);
  }

  /**
   * Busca por ID para uso via API: exige que o requisitante seja ADMIN. Sem
   * isso, qualquer usuario autenticado conseguia ver os dados de qualquer
   * outro usuario do sistema (IDOR).
   */
  async findOneForRequester(id: number, requester: RequesterContext) {
    this.assertIsAdmin(requester);
    return this.findOne(id);
  }

  async exists(id: number): Promise<boolean> {
    const user = await this.userRepository.findById(id);
    return user !== null;
  }

  private async performUpdate(
    id: number,
    data: UpdateUserDto | UpdatePartialUserDto,
  ) {

    const dataToUpdate = await this.prepareUpdateData(data);

    // Repository lança EntityNotFoundException se ID não existir (P2025)
    // Repository lança BusinessException se email duplicar (P2002)
    const updatedUser = await this.userRepository.partialUpdate(id, dataToUpdate);
    
    this.logger.log(`Usuário atualizado: ID ${id}`);
    return this.removePassword(updatedUser);
  }

  private async prepareUpdateData(
    data: UpdateUserDto | UpdatePartialUserDto
  ): Promise<UpdateUserDto | UpdatePartialUserDto> {
    const dataToUpdate = { ...data };

    const hashedPassword = await this.hashPasswordIfNeeded(dataToUpdate.password);
    
    if (hashedPassword) {
      dataToUpdate.password = hashedPassword;
    } else {
      delete dataToUpdate.password;
    }

    return dataToUpdate;
  }

  private async hashPasswordIfNeeded(password?: string): Promise<string | undefined> {
    if (!password || password.trim().length === 0) {
      return undefined;
    }
    
    return this.hashService.hash(password, BCRYPT_ROUNDS_USER_CREATION);
  }

  private removePassword<T>(entity: T): Omit<T, 'password'> {
    if (entity && typeof entity === 'object' && 'password' in entity) {
      const { password, ...rest } = entity as T & { password?: unknown };
      return rest as Omit<T, 'password'>;
    }
    return entity as Omit<T, 'password'>;
  }
}