import { ID } from '@/domain/enums/enums';
import { AllowedEmailEntity } from '@/domain/entities/allowed-email.entity';

export const IAllowedEmailRepository = Symbol('IAllowedEmailRepository');

export interface IAllowedEmailRepository {
  create(email: string): Promise<AllowedEmailEntity>;
  findAll(): Promise<AllowedEmailEntity[]>;
  findByEmail(email: string): Promise<AllowedEmailEntity | null>;
  delete(id: ID): Promise<void>;
}
