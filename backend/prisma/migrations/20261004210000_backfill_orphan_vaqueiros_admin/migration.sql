-- Funcionarios (VAQUEIRO) criados antes de "User.adminId" existir ficaram sem
-- vinculo e, por isso, so enxergam o que eles mesmos cadastraram (nao veem os
-- animais/coletas do admin). Vincula esses funcionarios ao admin SOMENTE quando
-- nao ha ambiguidade: exatamente um ADMIN ativo no sistema. Com mais de um admin
-- nao da para saber a qual cada funcionario pertence, entao nada e alterado.
UPDATE "User"
SET "adminId" = (
  SELECT a."id" FROM "User" a WHERE a."role" = 'ADMIN' AND a."status" = 'Active'
)
WHERE "role" = 'VAQUEIRO'
  AND "adminId" IS NULL
  AND "associationId" IS NULL
  AND (SELECT count(*) FROM "User" a WHERE a."role" = 'ADMIN' AND a."status" = 'Active') = 1;
