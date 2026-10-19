-- AlterTable
ALTER TABLE "DailyCollection" ADD COLUMN     "destinationId" INTEGER;

-- CreateTable
CREATE TABLE "Destination" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Destination_name_key" ON "Destination"("name");

-- CreateIndex
CREATE INDEX "DailyCollection_destinationId_idx" ON "DailyCollection"("destinationId");

-- AddForeignKey
ALTER TABLE "DailyCollection" ADD CONSTRAINT "DailyCollection_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
