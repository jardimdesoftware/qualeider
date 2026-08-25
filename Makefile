# =============================================================================
# Makefile — Qualeider
# =============================================================================
# Ponto de entrada unico para os fluxos operacionais mais comuns do projeto.
# Requer: docker + docker compose, node/npm no host.
# Windows: execute via Git Bash ou WSL (ou instale make via choco/scoop).
# =============================================================================

DEV_COMPOSE   ?= docker-compose.dev.yml
LOCAL_COMPOSE ?= docker-compose.local.yml
PROD_COMPOSE  ?= docker-compose.prod.yml
BUILD_COMPOSE ?= docker-compose.yml
ENV_FILE      ?= .env

.PHONY: help setup db-up dev backend frontend docker-down \
        backend-migrate backend-seed \
        local-up local-down prod-pull prod-up prod-down build-up build-down \
        lint test

help:
	@echo "Alvos disponiveis:"
	@echo "  make setup          - cria .env / backend/.env / frontend/.env.local a partir dos .example"
	@echo "  make dev            - sobe o postgres de desenvolvimento e roda o seed"
	@echo "  make backend        - roda o backend em modo watch (host)"
	@echo "  make frontend       - roda o frontend em modo dev (host)"
	@echo "  make backend-migrate - aplica as migrations do Prisma"
	@echo "  make backend-seed   - roda o seed do Prisma"
	@echo "  make docker-down    - derruba os containers de dev (postgres)"
	@echo "  make local-up       - stack completa local com nginx (docker-compose.local.yml)"
	@echo "  make local-down     - derruba a stack local"
	@echo "  make prod-pull      - baixa as imagens publicadas no GHCR"
	@echo "  make prod-up        - stack de producao via imagens GHCR (docker-compose.prod.yml)"
	@echo "  make prod-down      - derruba a stack de producao"
	@echo "  make build-up       - stack completa com build local das imagens (docker-compose.yml)"
	@echo "  make build-down     - derruba a stack de build local"
	@echo "  make lint           - roda lint no backend e no frontend"
	@echo "  make test           - roda a suite de testes do backend (unit + e2e)"

# ---------------------------------------------------------------------------
# Setup e ambiente de desenvolvimento
# ---------------------------------------------------------------------------
setup:
	[ -f $(ENV_FILE) ] || cp .env.example $(ENV_FILE)
	[ -f backend/.env ] || cp backend/.env.example backend/.env
	[ -f frontend/.env.local ] || cp frontend/.env.example frontend/.env.local
	@echo "Arquivos .env criados. Edite os valores antes de continuar."

# Sobe o postgres e so retorna quando o healthcheck do compose reportar "healthy"
db-up:
	docker compose -f $(DEV_COMPOSE) up -d --wait postgres

backend-migrate:
	cd backend && npx prisma migrate dev

backend-seed:
	cd backend && npx prisma db seed

dev: db-up backend-seed
	@echo "Infra pronta. Rode 'make backend' e 'make frontend' em terminais separados."

backend:
	cd backend && npm run start:dev

frontend:
	cd frontend && npm run dev

docker-down:
	docker compose -f $(DEV_COMPOSE) down

# ---------------------------------------------------------------------------
# Stacks completas (local com nginx / producao via GHCR / build local)
# ---------------------------------------------------------------------------
local-up:
	docker compose -f $(LOCAL_COMPOSE) up -d --build

local-down:
	docker compose -f $(LOCAL_COMPOSE) down

prod-pull:
	docker compose -f $(PROD_COMPOSE) pull

prod-up:
	docker compose -f $(PROD_COMPOSE) up -d --pull always

prod-down:
	docker compose -f $(PROD_COMPOSE) down

build-up:
	docker compose -f $(BUILD_COMPOSE) up --build -d

build-down:
	docker compose -f $(BUILD_COMPOSE) down

# ---------------------------------------------------------------------------
# Qualidade
# ---------------------------------------------------------------------------
lint:
	cd backend && npm run lint
	cd frontend && npm run lint

test:
	cd backend && npm run test:all
