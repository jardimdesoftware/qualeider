-- CreateTable: tabela de racas
CREATE TABLE "Breed" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Breed_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Breed_name_key" ON "Breed"("name");
CREATE INDEX "Breed_name_idx" ON "Breed"("name");

-- CreateTable: tabela de especies de animais
CREATE TABLE "animal_species" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animal_species_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "animal_species_name_key" ON "animal_species"("name");
CREATE INDEX "animal_species_name_idx" ON "animal_species"("name");

-- AlterTable: adiciona animalSpeciesId ao Animal
ALTER TABLE "Animal" ADD COLUMN "animalSpeciesId" INTEGER;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_animalSpeciesId_fkey" FOREIGN KEY ("animalSpeciesId") REFERENCES "animal_species"("id") ON DELETE SET NULL ON UPDATE CASCADE;
