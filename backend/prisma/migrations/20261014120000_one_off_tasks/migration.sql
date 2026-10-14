-- CreateTable
CREATE TABLE "one_off_tasks" (
    "name" TEXT NOT NULL,
    "ranAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "one_off_tasks_pkey" PRIMARY KEY ("name")
);
