-- AlterTable: torna breed e animalType opcionais (DROP NOT NULL) para alinhar com schema.prisma
ALTER TABLE "Animal" ALTER COLUMN "breed" DROP NOT NULL;
ALTER TABLE "Animal" ALTER COLUMN "animalType" DROP NOT NULL;

-- AlterTable: adiciona breedId ao Animal (FK para Breed)
ALTER TABLE "Animal" ADD COLUMN "breedId" INTEGER;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "Breed"("id") ON DELETE SET NULL ON UPDATE CASCADE;
