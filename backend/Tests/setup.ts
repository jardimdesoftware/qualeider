// Global Jest teardown to ensure Prisma connections are closed after test runs
import { PrismaClient } from '@prisma/client';

afterAll(async () => {
  try {
    const prisma = new PrismaClient();
    await prisma.$disconnect();
  } catch (e) {
  }
});
