import { IUserRepository } from '@/domain/repositories/user.repository';
import { IHashService } from '@/application/ports/hash.service';
import { ITokenService } from '@/application/ports/token.service';
import { LoginDto, LoginResultDto } from '@/application/dtos/auth.dto';

export class LoginUseCase {
  constructor(
    private readonly users: IUserRepository,
    private readonly hash: IHashService,
    private readonly token: ITokenService,
  ) {}

  async execute({ email, password }: LoginDto): Promise<LoginResultDto> {
    const user = await this.users.findByEmail(email);
    if (!user) {
      throw new Error('Credenciais inválidas.');
    }

    const ok = await this.hash.compare(password, user.password);
    if (!ok) {
      throw new Error('Credenciais inválidas.');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.token.sign(payload, { expiresIn: '1d' });
    return { accessToken };
  }
}
