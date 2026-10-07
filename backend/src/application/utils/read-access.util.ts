import { ForbiddenException } from '@nestjs/common';
import { EntityNotFoundException } from '@/common/exceptions/entity-not-found.exception';
import { IUserRepository } from '@/domain/repositories/user.repository';
import { ReadPrincipal, canReadOwner, isAssociationPrincipal } from '@/domain/utils/read-scope.util';

/**
 * Garante que o dono (usuário) de um registro está no escopo de quem lê.
 * Usa findByIdAny: o dono pode estar inativo e ainda assim ter histórico legível.
 */
export async function assertCanReadOwner(
  userRepository: IUserRepository,
  ownerId: number,
  reader: ReadPrincipal,
): Promise<void> {
  if (!isAssociationPrincipal(reader) && reader.id === ownerId) return;

  const owner = await userRepository.findByIdAny(ownerId);
  if (!owner || !canReadOwner(reader, owner)) {
    throw new ForbiddenException('Você não tem acesso a dados de outro produtor.');
  }
}

/**
 * Rotas "/user/:userId": o id do caminho precisa estar no escopo de quem lê.
 * Para login de associação o id do caminho não tem significado, vale o escopo.
 */
export async function assertCanReadUserData(
  userRepository: IUserRepository,
  userId: number,
  reader: ReadPrincipal,
): Promise<void> {
  if (isAssociationPrincipal(reader)) return;
  if (reader.id === userId) return;

  const owner = await userRepository.findByIdAny(userId);
  if (!owner) {
    throw new EntityNotFoundException(`Usuário com ID ${userId} não encontrado.`);
  }
  await assertCanReadOwner(userRepository, userId, reader);
}
