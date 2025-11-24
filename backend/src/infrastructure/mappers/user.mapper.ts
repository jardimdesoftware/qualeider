import { User as PrismaUser } from "@prisma/client";
import { UserEntity } from "@/domain/entities/user.entity";
import { UserCategory, UserType, Status } from "@/domain/enums/enums";

export class UserMapper {
    static toDomain(raw: PrismaUser): UserEntity {
        return new UserEntity({
            id: raw.id,
            name: raw.name,
            email: raw.email,
            password: raw.password,
            city: raw.city,
            state: raw.state,
            userCategory: raw.userCategory as UserCategory,
            userType: raw.userType ? (raw.userType as UserType) : undefined,
            status: raw.status as Status,
            resetToken: raw.resetToken,
            resetTokenExpiry: raw.resetTokenExpiry,
            createdAt: raw.createdAt,
            updatedAt: raw.updatedAt,
        });
    }

    static toPrisma(user: UserEntity): PrismaUser {
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            city: user.city,
            state: user.state,
            userCategory: user.userCategory,
            userType: user.userType,
            status: user.status,
            resetToken: user.resetToken,
            resetTokenExpiry: user.resetTokenExpiry,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        } as PrismaUser;
    }
}