-- Limpeza única dos dados de produção.
-- Apaga todas as contas, animais, coletas, destinos, convites liberados,
-- histórico de atividades e e-mails com falha. Mantém apenas os catálogos
-- (Breed e animal_species) e o controle de tarefas únicas.
-- O admin inicial é recriado na subida da API pelo DefaultAccountsService,
-- com o e-mail e a senha definidos em DEFAULT_ADMIN_*.
TRUNCATE TABLE
  "DailyCollectionItem",
  "DailyCollection",
  "Destination",
  "Animal",
  "ActivityLog",
  "allowed_emails",
  "failed_emails",
  "User"
RESTART IDENTITY CASCADE;
