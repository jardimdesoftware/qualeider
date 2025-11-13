# QualeiDer - Backend API

Sistema de gestão para associações de produtores de leite, desenvolvido com NestJS, Prisma e PostgreSQL.

## Descrição

Desenvolvido como parte do projeto QualeiDer do Instituto Federal de Pernambuco.

## Tecnologias

![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white) ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white) ![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)

## Estrutura do Projeto

```plaintext
backend/
├── src/
│   ├── application/              # Camada de aplicação
│   │   ├── dtos/                # Data Transfer Objects
│   │   │   ├── animals/         # DTOs de animais
│   │   │   ├── associations/    # DTOs de associações
│   │   │   ├── auth/            # DTOs de autenticação
│   │   │   ├── daily-collections/  # DTOs de coletas
│   │   │   ├── invites/         # DTOs de convites
│   │   │   ├── notifications/   # DTOs de notificações
│   │   │   └── users/           # DTOs de usuários
│   │   ├── enums/               # Enumerações
│   │   │   └── invite-status.enum.ts
│   │   ├── ports/               # Interfaces de serviços (DIP)
│   │   │   ├── hash.service.ts  # Interface para hash (bcrypt)
│   │   │   └── token.service.ts # Interface para tokens (JWT)
│   │   └── services/            # Serviços de aplicação
│   │       ├── animals/
│   │       │   ├── animals.service.ts
│   │       │   └── animals.module.ts
│   │       ├── associations/
│   │       │   ├── associations.service.ts
│   │       │   └── associations.module.ts
│   │       ├── daily-collections/
│   │       │   ├── daily-collections.service.ts
│   │       │   └── daily-collections.module.ts
│   │       ├── invites/
│   │       │   ├── invites.service.ts
│   │       │   ├── invites-cleanup.service.ts  # Cron job
│   │       │   └── invites.module.ts
│   │       ├── notifications/
│   │       │   ├── notifications.service.ts
│   │       │   └── notifications.module.ts
│   │       └── users/
│   │           ├── users.service.ts
│   │           └── users.module.ts
│   │
│   ├── presentation/            # Camada de apresentação
│   │   ├── controllers/         # Controllers REST
│   │   │   ├── animals.controller.ts
│   │   │   ├── associations/
│   │   │   │   └── associations.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── daily-collections.controller.ts
│   │   │   ├── invites.controller.ts
│   │   │   ├── notifications.controller.ts
│   │   │   └── users.controller.ts
│   │   ├── modules/            # Módulos de apresentação
│   │   │   ├── animals.module.ts
│   │   │   ├── associations.module.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── daily-collections.module.ts
│   │   │   ├── invites.module.ts
│   │   │   ├── notifications.module.ts
│   │   │   └── users.module.ts
│   │   ├── app.module.ts       # Módulo raiz
│   │   └── main.ts             # Entry point da aplicação
│   │
│   ├── domain/                  # Camada de domínio
│   │   ├── entities/           # Entidades de domínio
│   │   │   ├── animal.entity.ts
│   │   │   ├── daily-collection.entity.ts
│   │   │   └── user.entity.ts
│   │   └── enums/              # Enums de domínio
│   │       └── enums.ts        # Role, Status, AnimalType, etc.
│   │
│   ├── infrastructure/          # Camada de infraestrutura
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── services/           # Implementações de ports
│   │   │   ├── bcrypt-hash.service.ts    # Implementa IHashService
│   │   │   └── jwt-token.service.ts      # Implementa ITokenService
│   │   └── infrastructure.module.ts
│   │
│   ├── common/                  # Recursos compartilhados
│   │   └── filters/
│   │       └── prisma-exception.filter.ts  # Filtro global de erros Prisma
│   │
│   ├── auth/                    # Módulo de autenticação
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   └── jwt.strategy.ts     # Estratégia Passport JWT
│   │
│   ├── mail/                    # Serviço de email
│   │   ├── mail.module.ts
│   │   └── mail.service.ts     # Nodemailer + Handlebars
│   │
│   ├── events/                  # Sistema de eventos
│   │   ├── invite-accepted.event.ts
│   │   ├── invite-created.event.ts
│   │   ├── invite-declined.event.ts
│   │   ├── notification.events.ts
│   │   └── notification-payload.interface.ts
│   │
│   ├── listener/                # Event listeners
│   │   ├── email.listener.ts         # Escuta eventos de notificação
│   │   └── invite-email.listener.ts  # Escuta eventos de convite
│   │
│   ├── templates/               # Templates de email (Handlebars)
│   │   ├── invite.hbs
│   │   ├── invite-accepted.hbs
│   │   ├── invite-declined.hbs
│   │   ├── notification.hbs
│   │   └── reset-password.hbs
│   │
│   └── prisma/                  # Configuração do Prisma
│       ├── schema.prisma
│       └── migrations/
│
├── test/                        # Testes E2E
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## Arquitetura

### Path Aliases

O projeto utiliza path aliases para imports mais limpos:

- `@/application/*` → `src/application/*`
- `@/presentation/*` → `src/presentation/*`
- `@/domain/*` → `src/domain/*`
- `@/infrastructure/*` → `src/infrastructure/*`
- `@/common/*` → `src/common/*`
- `@/auth/*` → `src/auth/*`
- `@/mail/*` → `src/mail/*`
- `@/events/*` → `src/events/*`
- `@/listener/*` → `src/listener/*`

### Padrões Implementados

- **Clean Architecture**: Separação em camadas (Domain, Application, Infrastructure, Presentation)
- **Dependency Inversion**: Uso de ports/adapters para desacoplamento
- **Event-Driven**: Sistema de eventos com `@nestjs/event-emitter`
- **CRON Jobs**: Limpeza automática de convites expirados (`@nestjs/schedule`)
- **Global Exception Filter**: `PrismaExceptionFilter` para tratamento centralizado de erros
- **Logging**: NestJS Logger em todos os serviços

## Documentação da API

A documentação interativa está disponível em:

- **Swagger UI**: `http://localhost:8080/api`
