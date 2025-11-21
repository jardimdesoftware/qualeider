# QuaLeiDer - Backend API

> Sistema de gestão para produtores de leite, coletas diárias e associações rurais.

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

## Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades](#-funcionalidades)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Uso](#-uso)
- [API Endpoints](#-api-endpoints)
- [Testes](#-testes)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Módulos](#-módulos)
- [Licença](#-licença)

## Sobre o Projeto

QuaLeiDer é uma plataforma desenvolvida para o **Instituto Federal de Pernambuco (IFPE)** que facilita a gestão de produtores de leite, animais, coletas diárias de leite e associações rurais. O sistema permite:

- Produtores registrarem suas coletas diárias de leite com dados técnicos
- Gestão completa de animais (vacas, cabras, ovelhas, búfalas)
- Associações gerenciarem múltiplos produtores
- Sistema de convites para vincular produtores a associações
- Relatórios e análises agregadas de produção
- Notificações por email automatizadas

## Stack Tecnológica

### Core
- **Node.js** 20.x
- **NestJS** 10.x - Framework backend
- **TypeScript** 5.x - Linguagem

### Database & ORM
- **PostgreSQL** 14+ - Banco de dados
- **Prisma** 6.x - ORM com migrations automáticas

### Autenticação & Segurança
- **JWT** (`@nestjs/jwt`) - Tokens stateless
- **bcrypt** - Hash de senhas (10-12 rounds)
- **Passport** - Estratégias de autenticação
- **Helmet** - Headers HTTP de segurança
- **class-validator** + **class-transformer** - Validação de DTOs

### Email & Templates
- **Nodemailer** - Envio de emails
- **Handlebars** - Templates de email

### Logging & Monitoring
- **Winston** (`nest-winston`) - Logging estruturado
- **NestJS Logger** - Logs nativos

### Infraestrutura
- **Docker** + **Docker Compose** - Containerização
- **EventEmitter** (`@nestjs/event-emitter`) - Sistema de eventos
- **Schedule** (`@nestjs/schedule`) - CRON jobs
- **Swagger** (`@nestjs/swagger`) - Documentação API

### Testes
- **Jest** - Framework de testes
- **Supertest** - Testes E2E
- **Husky** - Git hooks para CI/CD

## Arquitetura

O projeto segue **Clean Architecture** com separação em 4 camadas:

```
┌─────────────────────────────────────────┐
│          Presentation Layer             │  ← Controllers, Modules
├─────────────────────────────────────────┤
│          Application Layer              │  ← Services, DTOs, Ports
├─────────────────────────────────────────┤
│            Domain Layer                 │  ← Entities, Business Rules
├─────────────────────────────────────────┤
│        Infrastructure Layer             │  ← Prisma, Bcrypt, JWT
└─────────────────────────────────────────┘
```

### Princípios Aplicados

- ✅ **Dependency Inversion Principle (DIP)** - Ports & Adapters
- ✅ **Single Responsibility Principle** - Cada service com uma responsabilidade
- ✅ **Event-Driven Architecture** - Comunicação assíncrona via eventos
- ✅ **Repository Pattern** - Prisma como repositório de dados
- ✅ **DTO Pattern** - Validação e transformação de dados

## Instalação

### Pré-requisitos

- **Node.js** 20.x ou superior
- **npm** ou **yarn**
- **PostgreSQL** 14+ (ou Docker)
- **Git**

### 1. Clone o Repositório

```bash
git clone https://github.com/seu-usuario/qualeider.git
cd qualeider/backend
```

### 2. Instale as Dependências

```bash
npm install
```

### 3. Configure o Ambiente

Crie um arquivo `.env` na raiz do backend:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/qualeider_db?schema=public"

# JWT
JWT_SECRET="sua-chave-secreta-super-segura-mude-em-producao"
JWT_EXPIRATION="24h"

# Server
PORT=8080
NODE_ENV=development

# Email (SMTP)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-app
MAIL_FROM="QuaLeiDer <noreply@qualeider.com>"
```

### 4. Inicialize o Banco de Dados

```bash
# Com Docker (recomendado para desenvolvimento)
docker-compose up -d postgres

# Ou inicie seu PostgreSQL local
# postgres -D /usr/local/var/postgres
```

### 5. Execute as Migrations

```bash
npx prisma migrate dev
```

### 6. (Opcional) Seed do Banco

```bash
npx prisma db seed
```

## Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão | Obrigatória |
|----------|-----------|--------|-------------|
| `DATABASE_URL` | Connection string do PostgreSQL | - | ✅ |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT | - | ✅ |
| `JWT_EXPIRATION` | Tempo de expiração do token | `24h` | ❌ |
| `PORT` | Porta da aplicação | `8080` | ❌ |
| `NODE_ENV` | Ambiente de execução | `development` | ❌ |
| `MAIL_HOST` | Host do servidor SMTP | - | ✅ |
| `MAIL_PORT` | Porta do servidor SMTP | `587` | ❌ |
| `MAIL_USER` | Usuário SMTP | - | ✅ |
| `MAIL_PASSWORD` | Senha SMTP | - | ✅ |
| `MAIL_FROM` | Email remetente | - | ✅ |

### Configuração de Email (Gmail)

Para usar Gmail como SMTP:

1. Ative a autenticação de dois fatores
2. Gere uma **senha de app** em: https://myaccount.google.com/apppasswords
3. Use a senha de app no `.env` como `MAIL_PASSWORD`

## Uso

### Desenvolvimento

```bash
# Modo desenvolvimento (watch mode)
npm run start:dev
```

Acesse:
- **API**: http://localhost:8080
- **Swagger**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/health

### Produção

```bash
# Build
npm run build

# Start
npm run start:prod
```

### Docker

```bash
# Build e start completo (backend + postgres)
docker-compose up -d

# Logs
docker-compose logs -f backend

# Stop
docker-compose down
```

## API Endpoints

### Autenticação

```http
POST   /auth/login             # Login com email/senha
POST   /auth/register          # Registro de novo usuário
POST   /auth/forgot-password   # Solicitar reset de senha
POST   /auth/reset-password    # Resetar senha com token
```

### Usuários

```http
GET    /users                  # Listar usuários (admin)
GET    /users/:id              # Buscar usuário por ID
POST   /users                  # Criar usuário
PATCH  /users/:id              # Atualizar usuário
DELETE /users/:id              # Deletar usuário
```

### Animais

```http
GET    /animals                # Listar animais do usuário logado
GET    /animals/:id            # Buscar animal por ID
POST   /animals                # Cadastrar novo animal
PATCH  /animals/:id            # Atualizar animal
DELETE /animals/:id            # Deletar animal
```

### Coletas Diárias

```http
GET    /daily-collections      # Listar coletas do usuário
GET    /daily-collections/:id  # Buscar coleta por ID
POST   /daily-collections      # Registrar nova coleta
PATCH  /daily-collections/:id  # Atualizar coleta
DELETE /daily-collections/:id  # Deletar coleta
GET    /daily-collections/reports/summary  # Relatório agregado
```

### Associações

```http
GET    /associations           # Listar associações
GET    /associations/:id       # Buscar associação por ID
POST   /associations           # Criar associação
PATCH  /associations/:id       # Atualizar associação
DELETE /associations/:id       # Deletar associação
GET    /associations/:id/producers  # Listar produtores da associação
```

### Convites

```http
GET    /invites                # Listar convites (enviados/recebidos)
GET    /invites/:id            # Buscar convite por ID
POST   /invites                # Criar novo convite
POST   /invites/:token/accept  # Aceitar convite
POST   /invites/:token/decline # Recusar convite
DELETE /invites/:id            # Cancelar convite
```

### Notificações

```http
GET    /notifications          # Listar notificações
GET    /notifications/:id      # Buscar notificação por ID
POST   /notifications          # Criar notificação
DELETE /notifications/:id      # Deletar notificação
```

**Autenticação**: Todos os endpoints (exceto `/auth/login` e `/auth/register`) requerem header:
```
Authorization: Bearer {seu-token-jwt}
```

**Documentação Completa**: Acesse http://localhost:8080/api para Swagger UI interativo.

## Testes

### Testes Unitários

```bash
# Executar testes unitários
npm run test

# Com coverage
npm run test:cov

# Watch mode
npm run test:watch

# Arquivo específico
npm run test -- users.service.spec.ts
```

### Testes E2E

```bash
# Executar testes E2E
npm run test:e2e

# Com coverage
npm run test:e2e:cov
```

### Cobertura de Testes

Meta: **>80% de cobertura**

```bash
npm run test:cov
```

Relatório gerado em: `coverage/lcov-report/index.html`

## Estrutura do Projeto

<details>
<summary>Clique para expandir estrutura completa</summary>

```plaintext
backend/
├── src/
│   ├── application/              # Camada de aplicação
│   │   ├── dtos/                # Data Transfer Objects
│   │   │   ├── animals/
│   │   │   ├── associations/
│   │   │   ├── auth/
│   │   │   ├── daily-collections/
│   │   │   ├── invites/
│   │   │   ├── notifications/
│   │   │   └── users/
│   │   ├── enums/
│   │   │   └── invite-status.enum.ts
│   │   ├── ports/               # Interfaces (DIP)
│   │   │   ├── hash.service.ts
│   │   │   └── token.service.ts
│   │   └── services/            # Business logic
│   │       ├── animals/
│   │       ├── associations/
│   │       ├── daily-collections/
│   │       ├── invites/
│   │       ├── notifications/
│   │       └── users/
│   │
│   ├── presentation/            # Camada de apresentação
│   │   ├── controllers/         # REST Controllers
│   │   │   ├── animals.controller.ts
│   │   │   ├── associations/
│   │   │   ├── auth.controller.ts
│   │   │   ├── daily-collections.controller.ts
│   │   │   ├── invites.controller.ts
│   │   │   ├── notifications.controller.ts
│   │   │   └── users.controller.ts
│   │   ├── modules/
│   │   │   ├── animals.module.ts
│   │   │   ├── associations.module.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── daily-collections.module.ts
│   │   │   ├── invites.module.ts
│   │   │   ├── notifications.module.ts
│   │   │   └── users.module.ts
│   │   ├── app.module.ts        # Root module
│   │   └── main.ts              # Entry point
│   │
│   ├── domain/                  # Camada de domínio
│   │   ├── entities/
│   │   │   ├── animal.entity.ts
│   │   │   ├── daily-collection.entity.ts
│   │   │   └── user.entity.ts
│   │   └── enums/
│   │       └── enums.ts
│   │
│   ├── infrastructure/          # Camada de infraestrutura
│   │   ├── prisma/
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── services/
│   │   │   ├── bcrypt-hash.service.ts
│   │   │   └── jwt-token.service.ts
│   │   └── infrastructure.module.ts
│   │
│   ├── common/                  # Recursos compartilhados
│   │   └── filters/
│   │       └── prisma-exception.filter.ts
│   │
│   ├── auth/                    # Módulo de autenticação
│   │   ├── auth.module.ts
│   │   ├── auth.service.ts
│   │   ├── jwt.strategy.ts
│   │   └── guards/
│   │       └── jwt-auth.guard.ts
│   │
│   ├── mail/                    # Sistema de email
│   │   ├── mail.module.ts
│   │   └── mail.service.ts
│   │
│   ├── events/                  # Event definitions
│   │   ├── invite-accepted.event.ts
│   │   ├── invite-created.event.ts
│   │   ├── invite-declined.event.ts
│   │   ├── notification.events.ts
│   │   └── notification-payload.interface.ts
│   │
│   ├── listener/                # Event listeners
│   │   ├── email.listener.ts
│   │   └── invite-email.listener.ts
│   │
│   └── templates/               # Email templates (Handlebars)
│       ├── invite.hbs
│       ├── invite-accepted.hbs
│       ├── invite-declined.hbs
│       ├── notification.hbs
│       └── reset-password.hbs
│
├── prisma/
│   ├── schema.prisma            # Prisma schema
│   ├── migrations/              # Database migrations
│   └── seed.ts                  # Seed data
│
├── test/
│   ├── *.e2e-spec.ts           # E2E tests
│   └── jest-e2e.json
│
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── docker-compose.yml
├── Dockerfile
├── jest.config.ts
├── nest-cli.json
├── package.json
├── tsconfig.json
└── README.md
```

</details>

## Módulos

### Core Modules

| Módulo | Responsabilidade |
|--------|------------------|
| `UsersPresentationModule` | Gestão de usuários, CRUD completo |
| `AnimalsPresentationModule` | Gestão de animais por usuário |
| `DailyCollectionsPresentationModule` | Registro de coletas diárias |
| `AssociationsPresentationModule` | Gestão de associações |
| `InvitesPresentationModule` | Sistema de convites + CRON job |
| `NotificationsPresentationModule` | Notificações para associações |
| `AuthPresentationModule` | Login, registro, reset de senha |

### Infrastructure Modules

| Módulo | Responsabilidade |
|--------|------------------|
| `PrismaModule` | Conexão com PostgreSQL via Prisma |
| `MailModule` | Envio de emails via Nodemailer |
| `InfrastructureModule` | Implementações de Ports (Bcrypt, JWT) |
| `WinstonModule` | Logging estruturado |
| `EventEmitterModule` | Sistema de eventos assíncronos |
| `ScheduleModule` | CRON jobs (cleanup de tokens) |

### Path Aliases

```typescript
// tsconfig.json
{
  "paths": {
    "@/application/*": ["src/application/*"],
    "@/presentation/*": ["src/presentation/*"],
    "@/domain/*": ["src/domain/*"],
    "@/infrastructure/*": ["src/infrastructure/*"],
    "@/common/*": ["src/common/*"],
    "@/auth/*": ["src/auth/*"],
    "@/mail/*": ["src/mail/*"],
    "@/events/*": ["src/events/*"],
    "@/listener/*": ["src/listener/*"]
  }
}
```

## Segurança

### Autenticação

- **JWT stateless** com HS256, expiração de 24h
- Payload contém: `userId`, `email`, `associationId`
- Impossível revogar antes da expiração (trade-off aceito)

### Senhas

- **bcrypt** com 10-12 rounds
- Salt único gerado automaticamente
- Comparação em tempo constante (previne timing attacks)
- Senhas nunca são retornadas em responses

### Reset de Senha

- Token único com 15 minutos de validade
- Enviado apenas por email
- Invalidado após uso ou expiração

### Headers de Segurança

- Helmet middleware ativado
- CORS restrito (configurável)
- Rate limiting recomendado em produção

### LGPD

- Logs sanitizados (sem dados pessoais)
- Senhas hasheadas
- Emails enviados apenas quando necessário

## CRON Jobs

### Limpeza de Convites Expirados

**Frequência**: Diariamente às 02:00 AM

```typescript
@Cron('0 2 * * *') // 02:00 todos os dias
async cleanupExpiredInvites() {
  const now = new Date();
  await this.prisma.invite.updateMany({
    where: {
      status: InviteStatus.PENDING,
      expiresAt: { lt: now }
    },
    data: { status: InviteStatus.EXPIRED }
  });
}
```

## Banco de Dados

### Schema Prisma

Ver arquivo completo: [`prisma/schema.prisma`](./prisma/schema.prisma)

**Entidades principais**:
- `User` - Usuários/Produtores
- `Association` - Associações rurais
- `Animal` - Animais (vacas, cabras, etc)
- `DailyCollection` - Coletas diárias de leite
- `Invite` - Sistema de convites
- `Notification` - Notificações

**Enums**:
- `UserType`: Pecuarista, Cooperativa, Associacao, Outro
- `UserCategory`: Fisica, Juridica
- `AnimalType`: Vaca, Cabra, Ovelha, Bufala, Outro
- `InviteStatus`: PENDING, ACCEPTED, DECLINED, EXPIRED, CANCELED
- `MilkingPlace`: Aberto, Curral, Ambos
- `CoverageArea`: Municipal, Regional, Estadual

### Migrações

```bash
# Criar nova migration
npx prisma migrate dev --name descricao-da-mudanca

# Aplicar migrations em produção
npx prisma migrate deploy

# Reset completo (CUIDADO: apaga dados)
npx prisma migrate reset
```

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Padrões de Código

- **Linting**: `npm run lint`
- **Formatação**: `npm run format`
- **Commits**: Usar Conventional Commits
- **Testes**: Manter cobertura >80%

### Git Hooks (Husky)

- **pre-commit**: Lint + format check
- **pre-push**: Tests

## Licença

Este projeto é desenvolvido como parte do **Instituto Federal de Pernambuco (IFPE)**.

## Autores

Desenvolvido por estudantes e professores do IFPE.

## Suporte

Para questões e suporte:
- Crie uma issue no repositório
- Contate a equipe do IFPE

---

**⭐ Se este projeto foi útil, considere dar uma estrela!**
