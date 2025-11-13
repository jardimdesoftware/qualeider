# QuaLeiDer

Plataforma para gestão de produtores, animais e coletas diárias de leite.

Este repositório é um monorepo com:

- Backend: API REST em NestJS + Prisma + PostgreSQL
- Frontend: Web App em Next.js (App Router) + Tailwind CSS

## Stack principal

- Backend: Node.js 20, NestJS 10, Prisma 6, PostgreSQL 14
- Auth: JWT (bearer), bcrypt para hash de senha
- Docs: Swagger em /api
- Frontend: Next 15, React 19, Tailwind
- Infra local: Docker (PostgreSQL via docker-compose)

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white) ![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

## Arquitetura (backend)

O backend segue um estilo de Clean Architecture por camadas:

- domain: entidades e enums de domínio
- application: DTOs, casos de uso e serviços de aplicação
- infrastructure: Prisma (repositórios/serviços), email, etc.
- presentation: controllers NestJS e bootstrap da aplicação

Swagger: <http://localhost:8080/api>

## Estrutura de pastas

```plaintext
backend/           # API NestJS + Prisma
  src/
    domain/
    application/
    infrastructure/
    presentation/  # main.ts, controllers
    interfaces/
    constants/
  prisma/          # schema.prisma e migrations
  docker-compose.yml  # Banco PostgreSQL local

frontend/          # App Next.js
  src/
  public/
```
