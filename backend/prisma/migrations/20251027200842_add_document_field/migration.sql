/*
  Warnings:

  - A unique constraint covering the columns `[document]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "document" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_document_key" ON "User"("document");
