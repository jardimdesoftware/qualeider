import { Injectable } from '@nestjs/common';
import { IHashService } from '@/application/ports/hash.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class BcryptHashService implements IHashService {
  async hash(plain: string, rounds = 10): Promise<string> {
    return bcrypt.hash(plain, rounds);
  }
  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  }
}
