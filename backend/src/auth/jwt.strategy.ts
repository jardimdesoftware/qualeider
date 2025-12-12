import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '@/application/services/users/users.service';
import { AssociationsService } from '@/application/services/associations/associations.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private usersService: UsersService,
    private associationsService: AssociationsService,
    private configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    let entity;

    if (payload.userType === 'association') {
      entity = await this.associationsService.findById(payload.sub);
    } else {
      entity = await this.usersService.findOne(payload.sub);
    }

    if (!entity) {
      throw new UnauthorizedException('Usuário ou Associação não encontrada.');
    }

    // Attach userType to the entity object so we can check it in Guards/Controllers if needed
    return { ...entity, userType: payload.userType };
  }
}
