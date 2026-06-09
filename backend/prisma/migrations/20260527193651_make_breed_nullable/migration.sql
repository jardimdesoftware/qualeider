-- AlterTable: adiciona breedId ao Animal (FK para Breed)
ALTER TABLE "Animal" ADD COLUMN "breedId" INTEGER;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_breedId_fkey" FOREIGN KEY ("breedId") REFERENCES "Breed"("id") ON DELETE SET NULL ON UPDATE CASCADE;
