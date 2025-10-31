/*
  Warnings:

  - Changed the type of `coverageArea` on the `Association` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "CoverageArea" AS ENUM ('Municipal', 'Regional', 'Estadual');

-- AlterTable
ALTER TABLE "Association" DROP COLUMN "coverageArea",
ADD COLUMN     "coverageArea" "CoverageArea" NOT NULL;
