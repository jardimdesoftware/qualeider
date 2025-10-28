/*
  Warnings:

  - You are about to drop the column `address` on the `Association` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Association` table. All the data in the column will be lost.
  - Added the required column `coverageArea` to the `Association` table without a default value. This is not possible if the table is not empty.
  - Added the required column `landlinePhone` to the `Association` table without a default value. This is not possible if the table is not empty.
  - Added the required column `neighborhood` to the `Association` table without a default value. This is not possible if the table is not empty.
  - Added the required column `number` to the `Association` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `Association` table without a default value. This is not possible if the table is not empty.
  - Added the required column `presidentCpf` to the `Association` table without a default value. This is not possible if the table is not empty.
  - Added the required column `presidentEmail` to the `Association` table without a default value. This is not possible if the table is not empty.
  - Added the required column `presidentName` to the `Association` table without a default value. This is not possible if the table is not empty.
  - Added the required column `presidentPhone` to the `Association` table without a default value. This is not possible if the table is not empty.
  - Added the required column `street` to the `Association` table without a default value. This is not possible if the table is not empty.
  - Added the required column `zipCode` to the `Association` table without a default value. This is not possible if the table is not empty.
  - Made the column `cnpj` on table `Association` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `Association` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Association" DROP COLUMN "address",
DROP COLUMN "phone",
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "coverageArea" TEXT NOT NULL,
ADD COLUMN     "foundationDate" TIMESTAMP(3),
ADD COLUMN     "landlinePhone" TEXT NOT NULL,
ADD COLUMN     "mobilePhone" TEXT,
ADD COLUMN     "neighborhood" TEXT NOT NULL,
ADD COLUMN     "number" TEXT NOT NULL,
ADD COLUMN     "numberOfMembers" INTEGER,
ADD COLUMN     "password" TEXT NOT NULL,
ADD COLUMN     "presidentCpf" TEXT NOT NULL,
ADD COLUMN     "presidentEmail" TEXT NOT NULL,
ADD COLUMN     "presidentName" TEXT NOT NULL,
ADD COLUMN     "presidentPhone" TEXT NOT NULL,
ADD COLUMN     "stateRegistration" TEXT,
ADD COLUMN     "street" TEXT NOT NULL,
ADD COLUMN     "tradeName" TEXT,
ADD COLUMN     "website" TEXT,
ADD COLUMN     "zipCode" TEXT NOT NULL,
ALTER COLUMN "cnpj" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Association_cnpj_idx" ON "Association"("cnpj");
