-- AlterTable
ALTER TABLE "allowed_emails" ADD COLUMN     "adminId" INTEGER;

-- CreateIndex
CREATE INDEX "allowed_emails_adminId_idx" ON "allowed_emails"("adminId");

-- AddForeignKey
ALTER TABLE "allowed_emails" ADD CONSTRAINT "allowed_emails_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
