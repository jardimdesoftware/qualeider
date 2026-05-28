-- CreateEnum: resultado do teste da caneca de fundo preto
CREATE TYPE "CmtResult" AS ENUM ('Normal', 'Suspeito', 'Positivo');

-- AlterTable: adiciona cmtResult opcional em DailyCollectionItem
ALTER TABLE "DailyCollectionItem" ADD COLUMN "cmtResult" "CmtResult";
