/**
 * Exportações centralizadas de todas as factories
 * Para uso nos testes: import { createUser, createAnimal } from 'tests/factories';
 */

export * from './user.factory';
export * from './animal.factory';
export * from './daily-collection.factory';

// Re-exports de funções comuns para conveniência
import { UserFactory } from './user.factory';
import { AnimalFactory } from './animal.factory';
import { DailyCollectionFactory } from './daily-collection.factory';

export const createUser = UserFactory.create.bind(UserFactory);
export const createManyUsers = UserFactory.createMany.bind(UserFactory);

export const createAnimal = AnimalFactory.create.bind(AnimalFactory);
export const createManyAnimals = AnimalFactory.createMany.bind(AnimalFactory);

export const createDailyCollection = DailyCollectionFactory.create.bind(DailyCollectionFactory);
export const createManyDailyCollections = DailyCollectionFactory.createMany.bind(DailyCollectionFactory);
