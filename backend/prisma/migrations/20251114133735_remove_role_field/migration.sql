-- Migra enum "Role" (Admin/Common) para "UserRole" (ADMIN/VAQUEIRO) para alinhar com o codigo
-- 1. Remover coluna role antiga
ALTER TABLE "User" DROP COLUMN IF EXISTS "role";

-- 2. Remover enum antigo
DROP TYPE IF EXISTS "Role";

-- 3. Criar enum novo com valores que o codigo espera
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VAQUEIRO');

-- 4. Adicionar coluna role nova com tipo e default corretos
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'ADMIN';
