import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { AssociationsService } from '@/application/services/associations/associations.service';

/**
 * Validador customizado para verificar se um e-mail de associação é único (não está cadastrado).
 * Este é separado da validação de e-mail de usuário pois associações têm sua própria tabela.
 */
@ValidatorConstraint({ name: 'isAssociationEmailUnique', async: true })
@Injectable()
export class IsAssociationEmailUniqueConstraint
  implements ValidatorConstraintInterface
{
  constructor(private readonly associationsService: AssociationsService) {}

  /**
   * Valida se o e-mail da associação é único no sistema
   * @param email - E-mail a ser validado
   * @param args - Argumentos de validação (pode conter associationId para operações de atualização)
   * @returns true se o e-mail está disponível, false se já está em uso
   */
  async validate(email: string, args?: ValidationArguments): Promise<boolean> {
    if (!email) {
      return true; 
    }

    const normalizedEmail = email.toLowerCase().trim();
    const association =
      await this.associationsService.findByEmail(normalizedEmail);

    if (!association) {
      return true;
    }

    // Para operações de atualização, permite o e-mail da própria associação
    const currentAssociationId = (args?.object as any)?.associationId;
    if (currentAssociationId && association.id === currentAssociationId) {
      return true;
    }

    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    return `O e-mail ${args.value} já está cadastrado no sistema.`;
  }
}

/**
 * Decorator para validar unicidade de e-mail de associação
 * @param validationOptions - Opções customizadas de validação
 * 
 * @example
 * ```typescript
 * export class CreateAssociationDto {
 *   @IsEmail()
 *   @IsAssociationEmailUnique({ message: 'Este e-mail já está em uso.' })
 *   email: string;
 * }
 * ```
 */
export function IsAssociationEmailUnique(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsAssociationEmailUniqueConstraint,
    });
  };
}
