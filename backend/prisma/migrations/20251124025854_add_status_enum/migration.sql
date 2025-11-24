/*
  Warnings:

  - The `status` column on the `Animal` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Association` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Active', 'Inactive');

-- AlterTable
ALTER TABLE "Animal" DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'Active';

-- AlterTable
ALTER TABLE "Association" DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'Active';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "status",
ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'Active';

-- CreateIndex
CREATE INDEX "Association_status_idx" ON "Association"("status");
