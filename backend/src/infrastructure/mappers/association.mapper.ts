import { Association as PrismaAssociation } from "@prisma/client";
import { AssociationEntity } from "@/domain/entities/association.entity";
import { CoverageArea, Status } from "@/domain/enums/enums";

export class AssociationMapper {
    static toDomain(raw: PrismaAssociation): AssociationEntity {
        return new AssociationEntity({
            id: raw.id,
            name: raw.name,
            tradeName: raw.tradeName,
            cnpj: raw.cnpj,
            stateRegistration: raw.stateRegistration,
            email: raw.email,
            password: raw.password,
            landlinePhone: raw.landlinePhone,
            mobilePhone: raw.mobilePhone,
            website: raw.website,
            zipCode: raw.zipCode,
            state: raw.state,
            city: raw.city,
            street: raw.street,
            number: raw.number,
            complement: raw.complement,
            neighborhood: raw.neighborhood,
            foundationDate: raw.foundationDate,
            numberOfMembers: raw.numberOfMembers,
            coverageArea: raw.coverageArea as CoverageArea,
            presidentName: raw.presidentName,
            presidentCpf: raw.presidentCpf,
            presidentEmail: raw.presidentEmail,
            presidentPhone: raw.presidentPhone,
            status: raw.status as Status,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }

    static toPrisma(association: AssociationEntity): PrismaAssociation {
        return {
            id: association.id,
            name: association.name,
            tradeName: association.tradeName ?? null,
            cnpj: association.cnpj,
            stateRegistration: association.stateRegistration ?? null,
            email: association.email,
            password: association.password,
            landlinePhone: association.landlinePhone,
            mobilePhone: association.mobilePhone ?? null,
            website: association.website ?? null,
            zipCode: association.zipCode,
            state: association.state,
            city: association.city,
            street: association.street,
            number: association.number,
            complement: association.complement ?? null,
            neighborhood: association.neighborhood,
            foundationDate: association.foundationDate ?? null,
            numberOfMembers: association.numberOfMembers ?? null,
            coverageArea: association.coverageArea,
            presidentName: association.presidentName,
            presidentCpf: association.presidentCpf,
            presidentEmail: association.presidentEmail,
            presidentPhone: association.presidentPhone,
            status: association.status,
            createdAt: association.createdAt,
            updatedAt: association.updatedAt,
        } as PrismaAssociation;
    }
}
