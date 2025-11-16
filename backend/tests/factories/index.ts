/**
 * Exportações centralizadas de todas as factories
 * Para uso nos testes: import { createUser, createAnimal } from 'tests/factories';
 */

export * from './user.factory';
export * from './animal.factory';
export * from './daily-collection.factory';
export * from './invite.factory';

// Re-exports de funções comuns para conveniência
import { UserFactory } from './user.factory';
import { AnimalFactory } from './animal.factory';
import { DailyCollectionFactory } from './daily-collection.factory';
import { InviteFactory } from './invite.factory';

export const createUser = UserFactory.create.bind(UserFactory);
export const createUserWithAssociation = UserFactory.createWithAssociation.bind(UserFactory);
export const createManyUsers = UserFactory.createMany.bind(UserFactory);

export const createAnimal = AnimalFactory.create.bind(AnimalFactory);
export const createAnimalForAssociation = AnimalFactory.createWithAssociation.bind(AnimalFactory);
export const createManyAnimals = AnimalFactory.createMany.bind(AnimalFactory);

export const createDailyCollection = DailyCollectionFactory.create.bind(DailyCollectionFactory);
export const createDailyCollectionForAssociation = DailyCollectionFactory.createWithAssociation.bind(DailyCollectionFactory);
export const createManyDailyCollections = DailyCollectionFactory.createMany.bind(DailyCollectionFactory);

export const createInvite = InviteFactory.create.bind(InviteFactory);
export const createAcceptedInvite = InviteFactory.createAccepted.bind(InviteFactory);
export const createExpiredInvite = InviteFactory.createExpired.bind(InviteFactory);
export const createManyInvites = InviteFactory.createMany.bind(InviteFactory);
