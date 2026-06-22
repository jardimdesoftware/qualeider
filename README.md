# QuaLeiDer

Plataforma para gestão de produtores, animais e coletas diárias de leite.

Este repositório é um monorepo com:

- **Backend**: API REST em NestJS + Prisma + PostgreSQL
- **Frontend**: Web App em Next.js (App Router) + Tailwind CSS

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white) ![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## Stack principal

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 20, NestJS 10, Prisma 6 |
| Banco de dados | PostgreSQL 14 |
| Cache | Redis 7 (produção) / in-memory (dev) |
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Auth | JWT (Bearer), bcrypt |
| Email | Nodemailer (SMTP) |
| Docs | Swagger em `/api-docs` |
| CI/CD | GitHub Actions + GHCR (imagens multi-arch AMD64 + ARM64) |

---

## Arquitetura (backend)

O backend segue Clean Architecture por camadas:

```
backend/src/
  domain/          # Entidades, enums e interfaces de repositório
  application/     # DTOs, casos de uso e portas (interfaces de serviço)
  infrastructure/  # Prisma (repositórios), serviços JWT/bcrypt, email
  presentation/    # Controllers NestJS, main.ts (bootstrap)
  common/          # Filtros globais, cache config, guards reutilizáveis
```

---

## Ambientes Docker

O projeto possui **quatro arquivos de compose**, cada um com um propósito específico:

| Arquivo | Ambiente | Quando usar |
|---|---|---|
| `docker-compose.dev.yml` | Desenvolvimento local | Dia a dia — backend/frontend rodam no host |
| `docker-compose.local.yml` | Simulação de produção local | Testar nginx + stack completa antes de fazer deploy |
| `docker-compose.yml` | Produção (build local) | Deploy sem CI/CD configurado, build das imagens na hora |
| `docker-compose.prod.yml` | Produção (imagens GHCR) | Deploy via pipeline — usa imagens pré-publicadas multi-arch |

---

## 🖥️ Desenvolvimento local (recomendado)

O modo de desenvolvimento usa **apenas a infra em container** (banco + redis).  
O backend e o frontend rodam no host para ter hot-reload e acesso ao debugger.

### 1. Pré-requisitos

- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ou Docker + Docker Compose

### 2. Configuração inicial

```bash
# Clone o repositório
git clone https://github.com/ifpebj-ti/qualeider.git
cd qualeider

# Configure as variáveis de ambiente
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 3. Suba a infra (banco + redis)

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Rode o backend

```bash
cd backend
npm install
npx prisma migrate dev   # Aplica migrations e gera o Prisma Client
npm run start:dev        # Hot-reload em http://localhost:3000
```

> API Docs (Swagger): [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### 5. Rode o frontend

```bash
cd frontend
npm install
npm run dev              # Hot-reload em http://localhost:3001
```

---

## 🔬 Simulação local de produção

Sobe **todos os serviços em container** com nginx como reverse proxy.  
Útil para validar roteamento, proxy e integração antes do deploy real.

```bash
# Configure o .env
cp .env.example .env
# Edite o NEXT_PUBLIC_API_URL para /api (nginx faz o proxy)

docker compose -f docker-compose.local.yml up --build -d
```

| URL | Serviço |
|---|---|
| `http://localhost:8080` | Frontend |
| `http://localhost:8080/api` | API REST |
| `http://localhost:8080/api-docs` | Swagger |

---

## 🚀 Deploy em produção

### Opção 1 — Build local (sem CI/CD)

```bash
# No servidor:
cp .env.example .env
# Preencha os valores reais no .env

docker compose up --build -d

# Frontend: http://<ip-servidor>:3001
# API:      http://<ip-servidor>:3000/api
```

### Opção 2 — Imagens GHCR (recomendado, via CI/CD)

As imagens são publicadas automaticamente via GitHub Actions no GHCR  
com suporte a **AMD64 e ARM64** (servidores OCI Free Tier, ARM, etc.).

```bash
# No servidor, faça login no GHCR:
echo $CR_PAT | docker login ghcr.io -u <SEU_USUARIO_GITHUB> --password-stdin

# Configure o .env com o owner e tags das imagens:
cp .env.example .env
# GHCR_OWNER=ifpebj-ti
# BACKEND_TAG=latest   (ou ex: 1.2.0)
# FRONTEND_TAG=latest

docker compose -f docker-compose.prod.yml up -d
```

#### Atualizar para nova versão

```bash
# Puxar as novas imagens:
docker compose -f docker-compose.prod.yml pull

# Recriar os containers:
docker compose -f docker-compose.prod.yml up -d
```

#### Verificar arquiteturas disponíveis

```bash
docker manifest inspect ghcr.io/ifpebj-ti/qualeider-backend:latest
```

---

## 🧪 Testes (backend)

```bash
cd backend

npm run test:unit         # Testes unitários
npm run test:integration  # Testes de integração (requer PostgreSQL)
npm run test:e2e          # Testes E2E (requer PostgreSQL)
npm run test:all          # Unit + E2E
```

---

## Estrutura de pastas

```
qualeider/
├── backend/               # API NestJS + Prisma
│   ├── src/
│   │   ├── domain/        # Entidades e interfaces
│   │   ├── application/   # Casos de uso e DTOs
│   │   ├── infrastructure/# Prisma, JWT, bcrypt
│   │   ├── presentation/  # Controllers, main.ts
│   │   └── common/        # Filtros, cache, guards
│   ├── prisma/            # schema.prisma e migrations
│   └── Dockerfile
│
├── frontend/              # App Next.js
│   ├── src/
│   │   ├── app/           # Rotas (App Router)
│   │   ├── components/    # Componentes UI
│   │   └── services/      # Integração com API
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf         # Config do reverse proxy
│
├── .github/workflows/
│   ├── backend-ci.yml     # CI/CD do backend (multi-arch)
│   └── frontend-cicd.yml  # CI/CD do frontend (multi-arch)
│
├── docker-compose.dev.yml    # 🖥️ Desenvolvimento (só infra)
├── docker-compose.local.yml  # 🔬 Simulação local (stack completa)
├── docker-compose.yml        # 🚀 Produção (build local)
└── docker-compose.prod.yml   # 🚀 Produção (imagens GHCR)
```

---

## Variáveis de ambiente

Consulte o [`.env.example`](.env.example) para a lista completa com descrições.  
Para variáveis exclusivas do backend em desenvolvimento, veja [`backend/.env.example`](backend/.env.example).

### Variáveis obrigatórias em produção

| Variável | Descrição |
|---|---|
| `POSTGRES_PASSWORD` | Senha do PostgreSQL |
| `JWT_SECRET` | Chave para assinar tokens JWT (mínimo 32 chars) |
| `REDIS_PASSWORD` | Senha do Redis |
| `SMTP_USER` / `SMTP_PASSWORD` | Credenciais de email |

---

## Contribuição

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes de contribuição.
