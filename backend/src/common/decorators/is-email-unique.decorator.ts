import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { UsersService } from '@/application/services/users/users.service';

/**
 * Validador customizado para verificar se um e-mail é único (não está cadastrado).
 * Este é um validador assíncrono que consulta o banco de dados.
 */
@ValidatorConstraint({ name: 'isEmailUnique', async: true })
@Injectable()
export class IsEmailUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Valida se o e-mail é único no sistema
   * @param email - E-mail a ser validado
   * @param args - Argumentos de validação (pode conter userId para operações de atualização)
   * @returns true se o e-mail está disponível, false se já está em uso
   */
  async validate(email: string, args?: ValidationArguments): Promise<boolean> {
    if (!email) {
      return true;
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      return true;
    }

    const currentUserId = (args?.object as any)?.userId;
    if (currentUserId && user.id === currentUserId) {
      return true;
    }

    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    return `O e-mail ${args.value} já está cadastrado no sistema.`;
  }
}

/**
 * Decorator para validar unicidade de e-mail
 * @param validationOptions - Opções customizadas de validação
 */

export function IsEmailUnique(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsEmailUniqueConstraint,
    });
  };
}
