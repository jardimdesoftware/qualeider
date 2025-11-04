# QualeiDer - Backend API

Sistema de gestão para associações de produtores de leite, desenvolvido com NestJS, Prisma e PostgreSQL.

## Descrição

Desenvolvido como parte do projeto QualeiDer do Instituto Federal de Pernambuco.

## Tecnologias

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white) ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)

## Estrutura do Projeto

```
backend/
├── src/
│   ├── application/              # Camada de aplicação (casos de uso)
│   │   ├── services/
│   │   │   ├── animals/         # Serviços de animais
│   │   │   ├── associations/    # Serviços de associações
│   │   │   ├── daily-collections/  # Serviços de coletas
│   │   │   ├── invites/         # Serviços de convites
│   │   │   ├── notifications/   # Serviços de notificações
│   │   │   └── users/           # Serviços de usuários
│   │   └── modules/
│   │       ├── animals.module.ts
│   │       ├── associations.module.ts
│   │       ├── daily-collections.module.ts
│   │       ├── invites.module.ts
│   │       ├── notifications.module.ts
│   │       └── users.module.ts
│   │
│   ├── presentation/             # Camada de apresentação (controllers/DTOs)
│   │   ├── controllers/
│   │   │   ├── animals/
│   │   │   ├── associations/
│   │   │   ├── auth/
│   │   │   ├── daily-collections/
│   │   │   ├── invites/
│   │   │   ├── notifications/
│   │   │   └── users/
│   │   ├── dto/                 # Data Transfer Objects
│   │   │   ├── animals/
│   │   │   ├── associations/
│   │   │   ├── auth/
│   │   │   ├── daily-collections/
│   │   │   ├── invites/
│   │   │   ├── notifications/
│   │   │   └── users/
│   │   ├── modules/
│   │   │   ├── animals.module.ts
│   │   │   ├── associations.module.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── daily-collections.module.ts
│   │   │   ├── invites.module.ts
│   │   │   ├── notifications.module.ts
│   │   │   └── users.module.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   │
│   ├── infrastructure/           # Camada de infraestrutura
│   │   ├── database/
│   │   │   └── prisma/
│   │   │       ├── prisma.module.ts
│   │   │       └── prisma.service.ts
│   │   ├── mail/
│   │   │   ├── mail.module.ts
│   │   │   └── mail.service.ts
│   │   └── modules/
│   │       └── infrastructure.module.ts
│   │
│   ├── domain/                   # Camada de domínio (entidades/interfaces)
│   │   ├── entities/
│   │   │   ├── animal.entity.ts
│   │   │   ├── association.entity.ts
│   │   │   ├── daily-collection.entity.ts
│   │   │   ├── invite.entity.ts
│   │   │   ├── notification.entity.ts
│   │   │   └── user.entity.ts
│   │   └── interfaces/
│   │       ├── animal.interface.ts
│   │       ├── association.interface.ts
│   │       ├── daily-collection.interface.ts
│   │       ├── invite.interface.ts
│   │       ├── notification.interface.ts
│   │       └── user.interface.ts
│   │
│   ├── events/                   # Sistema de eventos
│   │   ├── invite.events.ts
│   │   └── notification.events.ts
│   │
│   ├── listener/                 # Event listeners
│   │   ├── email.listener.ts
│   │   └── invite-email.listener.ts
│   │
│   ├── auth/                     # Autenticação e estratégias
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   └── jwt.strategy.ts
│   │
│   ├── templates/                # Templates de email (Handlebars)
│   │   ├── invite.hbs
│   │   ├── invite-accepted.hbs
│   │   ├── invite-declined.hbs
│   │   ├── notification.hbs
│   │   └── reset-password.hbs
│   │
│   └── prisma/                   # Configuração do Prisma
│       ├── schema.prisma
│       └── migrations/
│
├── tests/                        # Testes
│   ├── setup.ts
│   └── jest-e2e.json
│
├── test-invites.http            # Testes HTTP (REST Client)
├── TESTES_BACKEND.md            # Guia de testes
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Documentação da API

A documentação interativa está disponível em:

- **Swagger UI**: `http://localhost:8080/api`
