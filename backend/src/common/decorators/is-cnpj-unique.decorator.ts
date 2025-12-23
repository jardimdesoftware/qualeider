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
 * Validador customizado para verificar se um CNPJ é único (não está cadastrado).
 * Este é um validador assíncrono que consulta o banco de dados.
 */
@ValidatorConstraint({ name: 'isCnpjUnique', async: true })
@Injectable()
export class IsCnpjUniqueConstraint implements ValidatorConstraintInterface {
  constructor(private readonly associationsService: AssociationsService) {}

  /**
   * Valida se o CNPJ é único no sistema
   * @param cnpj - CNPJ a ser validado
   * @param args - Argumentos de validação (pode conter associationId para operações de atualização)
   * @returns true se o CNPJ está disponível, false se já está em uso
   */
  async validate(cnpj: string, args?: ValidationArguments): Promise<boolean> {
    if (!cnpj) {
      return true; 
    }

    const normalizedCnpj = cnpj.replace(/\D/g, '');
    const association = await this.associationsService.findByCnpj(normalizedCnpj);

    if (!association) {
      return true;
    }

    // Para operações de atualização, permite o CNPJ da própria associação
    const currentAssociationId = (args?.object as any)?.associationId;
    if (currentAssociationId && association.id === currentAssociationId) {
      return true;
    }

    return false;
  }

  defaultMessage(args: ValidationArguments): string {
    return `O CNPJ ${args.value} já está cadastrado no sistema.`;
  }
}

/**
 * Decorator para validar unicidade de CNPJ
 * @param validationOptions - Opções customizadas de validação
 * 
 * @example
 * ```typescript
 * export class CreateAssociationDto {
 *   @Length(14, 14)
 *   @IsCnpjUnique({ message: 'Este CNPJ já está em uso.' })
 *   cnpj: string;
 * }
 * ```
 */
export function IsCnpjUnique(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCnpjUniqueConstraint,
    });
  };
}
