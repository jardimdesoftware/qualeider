-- Um unico rebanho (IFPE): toda conta passa a pertencer ao grupo do admin raiz, o
-- Admin ativo mais antigo sem adminId (o mesmo que o login pelo Google usa). Antes
-- cada admin tinha um grupo isolado, com os proprios funcionarios; agora todos
-- (admins e vaqueiros) enxergam os mesmos animais e coletas.
-- Idempotente. Sem nenhum admin ativo, nao altera nada.
WITH root AS (
  SELECT "id"
  FROM "User"
  WHERE "role" = 'ADMIN' AND "status" = 'Active' AND "adminId" IS NULL
  ORDER BY "createdAt" ASC, "id" ASC
  LIMIT 1
)
UPDATE "User" AS u
SET "adminId" = root."id"
FROM root
WHERE u."id" <> root."id"
  AND u."adminId" IS DISTINCT FROM root."id";
