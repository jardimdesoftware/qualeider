-- CreateTable
CREATE TABLE "failed_emails" (
    "id" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "errorReason" TEXT NOT NULL,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "failed_emails_pkey" PRIMARY KEY ("id")
);
