-- AlterTable: adiciona tagNumber, campos de parentesco (mae e pai) ao model Animal
ALTER TABLE "Animal" ADD COLUMN "tagNumber" TEXT;
ALTER TABLE "Animal" ADD COLUMN "motherId" INTEGER;
ALTER TABLE "Animal" ADD COLUMN "motherCode" TEXT;
ALTER TABLE "Animal" ADD COLUMN "fatherId" INTEGER;
ALTER TABLE "Animal" ADD COLUMN "fatherCode" TEXT;

-- AddForeignKey: mae
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: pai
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: tagNumber unico por usuario (ignora NULLs automaticamente no PostgreSQL)
CREATE UNIQUE INDEX "Animal_userId_tagNumber_key" ON "Animal"("userId", "tagNumber");

-- CreateIndex: indices de performance
CREATE INDEX "Animal_userId_tagNumber_idx" ON "Animal"("userId", "tagNumber");
CREATE INDEX "Animal_motherId_idx" ON "Animal"("motherId");
CREATE INDEX "Animal_fatherId_idx" ON "Animal"("fatherId");
