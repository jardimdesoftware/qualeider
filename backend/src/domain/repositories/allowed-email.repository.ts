import { ID } from '@/domain/enums/enums';
import { AllowedEmailEntity } from '@/domain/entities/allowed-email.entity';

export const IAllowedEmailRepository = Symbol('IAllowedEmailRepository');

export interface IAllowedEmailRepository {
  create(email: string, adminId?: ID | null): Promise<AllowedEmailEntity>;
  /**
   * Com `adminId`, devolve só as liberações daquele admin mais as antigas sem
   * dono (adminId nulo); sem ele, devolve todas.
   */
  findAll(adminId?: ID): Promise<AllowedEmailEntity[]>;
  findById(id: ID): Promise<AllowedEmailEntity | null>;
  findByEmail(email: string): Promise<AllowedEmailEntity | null>;
  delete(id: ID): Promise<void>;
}
