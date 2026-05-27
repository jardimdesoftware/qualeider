-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "animalSpeciesId" INTEGER,
ALTER COLUMN "animalType" DROP NOT NULL;

-- CreateTable
CREATE TABLE "animal_species" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animal_species_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "animal_species_name_key" ON "animal_species"("name");

-- CreateIndex
CREATE INDEX "animal_species_name_idx" ON "animal_species"("name");

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_animalSpeciesId_fkey" FOREIGN KEY ("animalSpeciesId") REFERENCES "animal_species"("id") ON DELETE SET NULL ON UPDATE CASCADE;
