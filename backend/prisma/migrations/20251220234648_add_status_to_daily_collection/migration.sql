-- AlterTable
ALTER TABLE "DailyCollection" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'Active';

-- CreateIndex
CREATE INDEX "DailyCollection_userId_status_idx" ON "DailyCollection"("userId", "status");

-- CreateIndex
CREATE INDEX "DailyCollection_collectionDate_idx" ON "DailyCollection"("collectionDate");

-- CreateIndex
CREATE INDEX "DailyCollectionItem_dailyCollectionId_animalId_idx" ON "DailyCollectionItem"("dailyCollectionId", "animalId");

-- CreateIndex
CREATE INDEX "NotificationRecipient_userId_read_createdAt_idx" ON "NotificationRecipient"("userId", "read", "createdAt");

-- CreateIndex
CREATE INDEX "User_city_state_status_idx" ON "User"("city", "state", "status");

-- CreateIndex
CREATE INDEX "User_associationId_status_idx" ON "User"("associationId", "status");
