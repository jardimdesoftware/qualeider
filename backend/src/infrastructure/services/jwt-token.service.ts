import { Injectable } from '@nestjs/common';
import { ITokenService, TokenPayload } from '@/application/ports/token.service';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly jwt: JwtService) {}

  async sign(
    payload: TokenPayload,
    options?: { expiresIn?: string | number },
  ): Promise<string> {
    const expiresIn = (options?.expiresIn ?? '1d') as JwtSignOptions['expiresIn'];

    return this.jwt.signAsync(payload, {
      expiresIn,
    });
  }
}
