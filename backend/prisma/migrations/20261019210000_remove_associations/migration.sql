-- Remove por completo o recurso de Associacao (login de cooperativa, convites e
-- notificacoes). O sistema passa a ser de um unico banco/rebanho (IFPE).
-- DESTRUTIVO: apaga as tabelas Association, Invite, Notification e
-- NotificationRecipient e a coluna User.associationId, com os dados delas.

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_associationId_fkey";

-- DropForeignKey
ALTER TABLE "Invite" DROP CONSTRAINT "Invite_associationId_fkey";

-- DropForeignKey
ALTER TABLE "Invite" DROP CONSTRAINT "Invite_userId_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_associationId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationRecipient" DROP CONSTRAINT "NotificationRecipient_notificationId_fkey";

-- DropForeignKey
ALTER TABLE "NotificationRecipient" DROP CONSTRAINT "NotificationRecipient_userId_fkey";

-- DropIndex
DROP INDEX "User_associationId_status_idx";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "associationId";

-- DropTable
DROP TABLE "Association";

-- DropTable
DROP TABLE "Invite";

-- DropTable
DROP TABLE "Notification";

-- DropTable
DROP TABLE "NotificationRecipient";

-- DropEnum
DROP TYPE "CoverageArea";

-- DropEnum
DROP TYPE "InviteStatus";

