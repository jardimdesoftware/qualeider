export const IHashService = Symbol('IHashService');

export interface IHashService {
  hash(plain: string, rounds?: number): Promise<string>;
  compare(plain: string, hashed: string): Promise<boolean>;
}
