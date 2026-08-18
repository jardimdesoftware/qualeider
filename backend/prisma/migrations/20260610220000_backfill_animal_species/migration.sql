-- Seed: garante que as especies do enum legado AnimalType existam em animal_species
INSERT INTO "animal_species" ("name", "description", "createdAt", "updatedAt")
VALUES
  ('Vaca', 'Migrado automaticamente do tipo legado animalType', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Cabra', 'Migrado automaticamente do tipo legado animalType', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Ovelha', 'Migrado automaticamente do tipo legado animalType', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Bufala', 'Migrado automaticamente do tipo legado animalType', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('Outro', 'Migrado automaticamente do tipo legado animalType', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;

-- Backfill: preenche animalSpeciesId para animais antigos com base no animalType,
-- apenas quando ainda nao houver animalSpeciesId definido
UPDATE "Animal" AS a
SET "animalSpeciesId" = s."id"
FROM "animal_species" AS s
WHERE a."animalSpeciesId" IS NULL
  AND a."animalType" IS NOT NULL
  AND s."name" = a."animalType"::text;
