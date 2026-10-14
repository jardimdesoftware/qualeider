-- =============================================================================
-- Recomeca do zero: remove TODAS as contas (usuarios e associacoes), os dados
-- delas e TODOS os e-mails registrados (liberacoes do Google e fila de e-mails
-- que falharam), MENOS as duas contas de teste. Racas e especies (catalogos) e
-- as tabelas do sistema ficam como estao.
--
-- Roda dentro de uma transacao e termina em ROLLBACK: confira os numeros do final
-- e so entao troque ROLLBACK por COMMIT. IRREVERSIVEL depois do COMMIT.
--
-- Uso (no servidor, depois de um backup):
--   pg_dump -U <usuario> -d <banco> -Fc -f backup-antes-da-limpeza.dump
--   psql -U <usuario> -d <banco> \
--        -v keep_admin=admin@qualeider.test \
--        -v keep_vaqueiro=vaqueiro@qualeider.test \
--        -f ops/sql/limpar-contas-exceto-teste.sql
-- =============================================================================
\set ON_ERROR_STOP on
BEGIN;

-- (As variaveis do psql nao expandem dentro de DO $$ ... $$; por isso vao para uma tabela.)
CREATE TEMP TABLE keep_emails ON COMMIT DROP AS
  SELECT lower(:'keep_admin') AS email UNION ALL SELECT lower(:'keep_vaqueiro');

-- Trava de seguranca: as duas contas a manter precisam existir (e ser
-- exatamente duas). Senao a limpeza apagaria todo mundo, inclusive voce.
DO $$
DECLARE kept integer;
BEGIN
  SELECT count(*) INTO kept FROM "User"
   WHERE lower(email) IN (SELECT email FROM keep_emails);
  IF kept <> 2 THEN
    RAISE EXCEPTION 'Abortado: esperava 2 contas a manter, encontrei %. Nada foi apagado.', kept;
  END IF;
END $$;

CREATE TEMP TABLE doomed_users ON COMMIT DROP AS
  SELECT id FROM "User"
   WHERE lower(email) NOT IN (SELECT email FROM keep_emails);

CREATE TEMP TABLE doomed_animals ON COMMIT DROP AS
  SELECT id FROM "Animal" WHERE "userId" IN (SELECT id FROM doomed_users);

CREATE TEMP TABLE doomed_collections ON COMMIT DROP AS
  SELECT id FROM "DailyCollection" WHERE "userId" IN (SELECT id FROM doomed_users);

-- Dependencias primeiro (as chaves estrangeiras nao fazem cascata).
DELETE FROM "NotificationRecipient" WHERE "userId" IN (SELECT id FROM doomed_users);
DELETE FROM "ActivityLog"           WHERE "userId" IN (SELECT id FROM doomed_users);
DELETE FROM "Invite"                WHERE "userId" IN (SELECT id FROM doomed_users);
DELETE FROM "DailyCollectionItem"
 WHERE "dailyCollectionId" IN (SELECT id FROM doomed_collections)
    OR "animalId"          IN (SELECT id FROM doomed_animals);
DELETE FROM "DailyCollection"       WHERE id IN (SELECT id FROM doomed_collections);

-- Animais que sobram (das contas mantidas) podem apontar para pai/mae apagados.
UPDATE "Animal" SET "motherId" = NULL WHERE "motherId" IN (SELECT id FROM doomed_animals);
UPDATE "Animal" SET "fatherId" = NULL WHERE "fatherId" IN (SELECT id FROM doomed_animals);
DELETE FROM "Animal"                WHERE id IN (SELECT id FROM doomed_animals);

-- Todos os e-mails liberados (Google) e a fila de e-mails que falharam.
DELETE FROM allowed_emails;
DELETE FROM failed_emails;

DELETE FROM "User"                  WHERE id IN (SELECT id FROM doomed_users);

-- Contas de associacao (tambem fazem login com e-mail e senha).
DELETE FROM "NotificationRecipient"
 WHERE "notificationId" IN (SELECT id FROM "Notification");
DELETE FROM "Notification";
DELETE FROM "Invite";
UPDATE "User" SET "associationId" = NULL WHERE "associationId" IS NOT NULL;
DELETE FROM "Association";

-- Conferencia: deve sobrar so as duas contas de teste e nenhuma associacao.
SELECT id, email, role, "adminId" FROM "User" ORDER BY id;
SELECT (SELECT count(*) FROM "User")        AS usuarios,
       (SELECT count(*) FROM "Association") AS associacoes,
       (SELECT count(*) FROM allowed_emails) AS emails_liberados,
       (SELECT count(*) FROM failed_emails)  AS emails_na_fila,
       (SELECT count(*) FROM "Animal")      AS animais,
       (SELECT count(*) FROM "DailyCollection") AS coletas;

ROLLBACK;  -- troque por COMMIT; depois de conferir o resultado acima
