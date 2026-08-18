-- Ajuste: mantem apenas "Vaca" como especie padrao em animal_species.
-- As demais especies (Cabra, Ovelha, Bufala, Outro) sao removidas; o usuario
-- cadastra seus proprios tipos pela tela "Tipos de Animal".
-- Animais que estavam vinculados a essas especies removidas voltam a ter
-- animalSpeciesId = NULL automaticamente (ON DELETE SET NULL), mantendo o
-- valor antigo em animalType.
DELETE FROM "animal_species" WHERE "name" IN ('Cabra', 'Ovelha', 'Bufala', 'Outro');

-- Remove o texto de migracao automatica da especie "Vaca"
UPDATE "animal_species" SET "description" = NULL WHERE "name" = 'Vaca';

-- Seed: adiciona "Leiteira" como raca padrao disponivel
INSERT INTO "Breed" ("name", "description", "createdAt", "updatedAt")
VALUES ('Leiteira', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
