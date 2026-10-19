-- Admin que entrou numa associacao passa a ver o rebanho da associacao (onde
-- User.associationId = X), mas os funcionarios (VAQUEIRO) dele ficaram com
-- associationId nulo e sumiram da tela de Funcionarios e do rebanho dele.
-- Alinha os funcionarios existentes com a associacao do respectivo admin
-- (o codigo novo ja faz isso ao aceitar o convite e ao cadastrar funcionario).
UPDATE "User" AS v
SET "associationId" = a."associationId"
FROM "User" AS a
WHERE v."role" = 'VAQUEIRO'
  AND v."adminId" = a."id"
  AND a."associationId" IS NOT NULL
  AND v."associationId" IS DISTINCT FROM a."associationId";
