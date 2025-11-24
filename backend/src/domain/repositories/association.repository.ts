import { AssociationEntity } from '@/domain/entities/association.entity';

export const IAssociationRepository = Symbol('IAssociationRepository');

export interface IAssociationRepository {
  create(
    data: Omit<AssociationEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<AssociationEntity>;
  findByEmail(email: string): Promise<AssociationEntity | null>;
  findByCnpj(cnpj: string): Promise<AssociationEntity | null>;
  findById(id: number): Promise<AssociationEntity | null>;
}
