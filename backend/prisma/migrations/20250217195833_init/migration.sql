-- CreateEnum
CREATE TYPE "Role" AS ENUM ('Admin', 'Common');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('Pecuarista', 'Cooperativa', 'Associacao', 'Outro');

-- CreateEnum
CREATE TYPE "UserCategory" AS ENUM ('Fisica', 'Juridica');

-- CreateEnum
CREATE TYPE "AnimalType" AS ENUM ('Vaca', 'Cabra', 'Ovelha', 'Bufala', 'Outro');

-- CreateEnum
CREATE TYPE "MilkingPlace" AS ENUM ('Aberto', 'Curral', 'Ambos');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'Common',
    "userType" "UserType",
    "userCategory" "UserCategory" NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" SERIAL NOT NULL,
    "name" TEXT,
    "animalType" "AnimalType" NOT NULL,
    "breed" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyCollection" (
    "id" SERIAL NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "collectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "numAnimals" INTEGER NOT NULL,
    "numOrdens" INTEGER NOT NULL,
    "rationProvided" BOOLEAN NOT NULL,
    "numLactation" INTEGER NOT NULL,
    "milkingPlace" "MilkingPlace" NOT NULL,
    "technicalAssistance" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyCollection" ADD CONSTRAINT "DailyCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
