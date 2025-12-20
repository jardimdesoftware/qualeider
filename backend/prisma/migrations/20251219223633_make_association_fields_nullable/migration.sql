-- AlterTable
ALTER TABLE "Association" ALTER COLUMN "neighborhood" DROP NOT NULL,
ALTER COLUMN "number" DROP NOT NULL,
ALTER COLUMN "presidentCpf" DROP NOT NULL,
ALTER COLUMN "presidentEmail" DROP NOT NULL,
ALTER COLUMN "presidentName" DROP NOT NULL,
ALTER COLUMN "presidentPhone" DROP NOT NULL,
ALTER COLUMN "street" DROP NOT NULL,
ALTER COLUMN "zipCode" DROP NOT NULL;

-- CreateTable
CREATE TABLE "DailyCollectionItem" (
    "id" SERIAL NOT NULL,
    "dailyCollectionId" INTEGER NOT NULL,
    "animalId" INTEGER NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyCollectionItem_dailyCollectionId_idx" ON "DailyCollectionItem"("dailyCollectionId");

-- CreateIndex
CREATE INDEX "DailyCollectionItem_animalId_idx" ON "DailyCollectionItem"("animalId");

-- AddForeignKey
ALTER TABLE "DailyCollectionItem" ADD CONSTRAINT "DailyCollectionItem_dailyCollectionId_fkey" FOREIGN KEY ("dailyCollectionId") REFERENCES "DailyCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCollectionItem" ADD CONSTRAINT "DailyCollectionItem_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
