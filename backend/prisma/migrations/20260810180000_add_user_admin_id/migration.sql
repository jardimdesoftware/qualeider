-- Vincula funcionarios (Vaqueiro) ao Admin (dono da fazenda) que os cadastrou,
-- para que ambos compartilhem o mesmo rebanho sem depender de uma Association
-- (cooperativa) formal.
ALTER TABLE "User" ADD COLUMN     "adminId" INTEGER;

CREATE INDEX "User_adminId_idx" ON "User"("adminId");

ALTER TABLE "User" ADD CONSTRAINT "User_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
