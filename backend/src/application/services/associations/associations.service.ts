import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CreateAssociationDto } from '@/application/dtos/associations/create-association.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AssociationsService {
  private readonly logger = new Logger(AssociationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string) {
    if (!email) {
      return null;
    }
    return await this.prisma.association.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findByCnpj(cnpj: string) {
    if (!cnpj) {
      return null;
    }
    return await this.prisma.association.findUnique({
      where: { cnpj },
    });
  }

  private async checkEmailExists(email: string): Promise<boolean> {
    const association = await this.findByEmail(email);
    return !!association;
  }

  private async checkCnpjExists(cnpj: string): Promise<boolean> {
    const association = await this.findByCnpj(cnpj);
    return !!association;
  }

  async create(createAssociationDto: CreateAssociationDto) {
    const { email, cnpj, password, foundationDate, ...rest } =
      createAssociationDto;

    const emailExists = await this.checkEmailExists(email);
    if (emailExists) {
      throw new ConflictException('Email já cadastrado.');
    }

    const cnpjExists = await this.checkCnpjExists(cnpj);
    if (cnpjExists) {
      throw new ConflictException('CNPJ já cadastrado.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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

    this.logger.log(
      `Associação criada: ${association.name} (ID: ${association.id})`,
    );

    return association;
  }
}
