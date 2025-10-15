import { Injectable } from '@nestjs/common';
import { ITokenService, TokenPayload } from '@/application/ports/token.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtTokenService implements ITokenService {
  constructor(private readonly jwt: JwtService) {}

  async sign(
    payload: TokenPayload,
    options?: { expiresIn?: string | number },
  ): Promise<string> {
    return this.jwt.signAsync(payload, {
      expiresIn: options?.expiresIn ?? '1d',
    });
  }
}
