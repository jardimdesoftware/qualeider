import { Destination as PrismaDestination } from '@prisma/client';
import { DestinationEntity } from '@/domain/entities/destination.entity';

export class DestinationMapper {
  static toDomain(raw: PrismaDestination): DestinationEntity {
    return new DestinationEntity({
      id: raw.id,
      name: raw.name,
      description: raw.description,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }
}
