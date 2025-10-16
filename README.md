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

## Arquitetura (backend)

O backend segue um estilo de Clean Architecture por camadas:

- domain: entidades e enums de domínio
- application: DTOs, casos de uso e serviços de aplicação
- infrastructure: Prisma (repositórios/serviços), email, etc.
- presentation: controllers NestJS e bootstrap da aplicação

Swagger: http://localhost:8080/api

## Estrutura de pastas (resumo)

```
backend/           # API NestJS + Prisma
	src/
		domain/
		application/
		infrastructure/
		presentation/  # main.ts, controllers
	prisma/          # schema.prisma e migrations
	docker-compose.yml  # Banco PostgreSQL local

frontend/          # App Next.js
	src/
	public/
```