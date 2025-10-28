import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateAssociationDto } from '@/application/dtos/associations/create-association.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AssociationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createAssociationDto: CreateAssociationDto) {
    const { email, cnpj, password, foundationDate, ...rest } =
      createAssociationDto;

    // Verifica se email já existe
    const emailExists = await this.checkEmailExists(email);
    if (emailExists) {
      throw new ConflictException('Email já cadastrado.');
    }

    // Verifica se CNPJ já existe
    const cnpjExists = await this.checkCnpjExists(cnpj);
    if (cnpjExists) {
      throw new ConflictException('CNPJ já cadastrado.');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const association = await this.prisma.association.create({
        data: {
          email,
          cnpj,
          password: hashedPassword,
          foundationDate: foundationDate ? new Date(foundationDate) : null,
          ...rest,
        },
        select: {
          id: true,
          name: true,
          tradeName: true,
          cnpj: true,
          email: true,
          city: true,
          state: true,
          createdAt: true,
        },
      });

      return {
        message: 'Associação criada com sucesso.',
        association,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Erro ao criar associação. Tente novamente.',
      );
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    const association = await this.prisma.association.findUnique({
      where: { email: email.toLowerCase() },
    });
    return !!association;
  }

  async checkCnpjExists(cnpj: string): Promise<boolean> {
    const association = await this.prisma.association.findUnique({
      where: { cnpj },
    });
    return !!association;
  }
}
