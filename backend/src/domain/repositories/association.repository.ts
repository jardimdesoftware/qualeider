import { AssociationEntity } from '@/domain/entities/association.entity';

export const IAssociationRepository = Symbol('IAssociationRepository');

export interface IAssociationRepository {
  create(
    data: Omit<AssociationEntity, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<AssociationEntity>;
  findByEmail(email: string): Promise<AssociationEntity | null>;
  findByCnpj(cnpj: string): Promise<AssociationEntity | null>;
  findById(id: number): Promise<AssociationEntity | null>;
  findAssociates(associationId: number, options: { page: number; limit: number }): Promise<{ data: any[]; total: number }>; // Returns { data: AssociateSummaryDto[], total: number }
  getHerdStats(associationId: number): Promise<any>; // Returns RegionalHerdStatsDto
  findAvailableProducers(): Promise<any[]>;
  linkProducer(userId: number, associationId: number): Promise<void>;
  update(id: number, data: Partial<AssociationEntity>): Promise<AssociationEntity>;
}
