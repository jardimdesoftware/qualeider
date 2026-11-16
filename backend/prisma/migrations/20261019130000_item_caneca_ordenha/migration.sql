-- CreateEnum
CREATE TYPE "MugTestResult" AS ENUM ('Negativo', 'Positivo');

-- AlterTable
ALTER TABLE "DailyCollectionItem" ADD COLUMN     "milking" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "mugTestResult" "MugTestResult";
