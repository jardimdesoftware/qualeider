# QuaLeiDer - Backend API

> Sistema de gestão para produtores de leite, coletas diárias e associações rurais.

[![Build Status](https://github.com/marcelo-ifpe/qualeider/actions/workflows/tests.yml/badge.svg)](https://github.com/marcelo-ifpe/qualeider/actions/workflows/tests.yml)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)](https://jwt.io/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

## Índice

- [Sobre](#-sobre)
- [Arquitetura](#-arquitetura)
- [Começo Rápido](#-começo-rápido)
- [Funcionalidades](#-funcionalidades)
- [API Endpoints](#-api-endpoints)
- [Banco de Dados](#-banco-de-dados)
- [Instalação Detalhada](#-instalação-detalhada)
- [Resolução de Problemas](#%EF%B8%8F-resolução-de-problemas)
- [Testes](#-testes)

## 📌 Sobre

QuaLeiDer é uma plataforma desenvolvida para o **Instituto Federal de Pernambuco (IFPE)** para modernizar a gestão da produção leiteira. O sistema conecta pequenos produtores a associações, permitindo registro digital de coletas, controle de rebanho e transparência na produção.

## 🏗️ Arquitetura

O backend segue **Clean Architecture** com separação estrita de responsabilidades.

```mermaid
graph TD
    subgraph "Presentation Layer"
        Controllers[Controllers]
        Modules[Modules]
        Controllers -->|Chama| Services
    end

    subgraph "Application Layer"
        Services[Services]
        DTOs[DTOs]
        Ports[Ports Interfaces]
        Services -->|Usa| DTOs
        Services -->|Define| Ports
    end

    subgraph "Domain Layer"
        Entities[Entities]
        Enums[Enums]
        Services -->|Manipula| Entities
    end

    subgraph "Infrastructure Layer"
        PrismaService[Prisma Service]
        AuthService[Auth / Bcrypt]
        MailService[Mail Service]
        PrismaService -->|Implementa| Ports
        AuthService -->|Implementa| Ports
    end
```

### Stack & Tecnologias
- **Core**: Node.js 20, NestJS 10, TypeScript 5
- **Dados**: PostgreSQL 14, Prisma 6 (ORM)
- **Segurança**: JWT, Bcrypt, Helmet, Class-Validator
- **Infra**: Docker, Github Actions (CI)

## 🚀 Começo Rápido

Para rodar todo o ambiente (Banco + API) com um único comando (requer Docker):

```bash
# Na raiz do workspace (onde está o docker-compose.yml)
docker-compose up --build
```

A API estará disponível em: `http://localhost:8080`

Para parar:
```bash
docker-compose down
```

## ✨ Funcionalidades

| Funcionalidade | Status | Descrição |
| :--- | :---: | :--- |
| **Gestão de Coletas** | ✅ | Registro diário de litragem, gordura e itens do tanque |
| **Controle de Rebanho** | ✅ | Cadastro de vacas, cabras, ovelhas com dados genealógicos |
| **Associações** | ✅ | Gestão de múltiplos produtores e áreas de cobertura |
| **Convites** | ✅ | Sistema de tokens por email para novos membros |
| **Notificações** | ✅ | Avisos internos para produtores |
| **Relatórios** | 🚧 | Geração de PDFs e exportação de dados (Em progresso) |
| **Dashboard** | 📅 | Gráficos analíticos avançados (Planejado) |

## 📡 API Endpoints

Documentação interativa completa disponível via Swagger em: `http://localhost:8080/api`

### Exemplo de Uso: Registrar Coleta

<details>
<summary><b>POST /daily-collections</b> (Clique para expandir)</summary>

**Payload:**

```json
{
  "quantity": 150.5,
  "collectionDate": "2023-10-27T08:00:00Z",
  "numAnimals": 10,
  "numOrdens": 2,
  "rationProvided": true,
  "numLactation": 5,
  "milkingPlace": "Curral",
  "technicalAssistance": false,
  "items": [
    {
       "animalId": 1,
       "quantity": 15.5
    }
  ]
}
```

**Response (201 Created):**

```json
{
  "id": 123,
  "quantity": 150.5,
  "userId": 45,
  "createdAt": "2023-10-27T08:00:01Z",
  "items": [
    { "id": 1, "quantity": 15.5, "animalId": 1 }
  ]
}
```

</details>

## 🗄️ Banco de Dados

Diagrama Entidade-Relacionamento do sistema:

```mermaid
erDiagram
    Association ||--o{ User : "possui membros"
    Association ||--o{ Invite : "envia"
    Association ||--o{ Notification : "gera"
    User ||--o{ Animal : "possui"
    User ||--o{ DailyCollection : "registra"
    User ||--o{ Invite : "recebe"
    User ||--o{ NotificationRecipient : "recebe"
    DailyCollection ||--o{ DailyCollectionItem : "contém"
    Animal ||--o{ DailyCollectionItem : "produz"
    Notification ||--o{ NotificationRecipient : "destina-se"

    Association {
        int id
        string name
        string cnpj
        string email
    }
    User {
        int id
        string name
        string email
        enum type
    }
    Animal {
        int id
        string name
        enum type
        string breed
    }
    DailyCollection {
        int id
        float quantity
        date date
    }
    Invite {
        string token
        enum status
        date expiresAt
    }
```

## 🔧 Instalação Detalhada

Se preferir rodar localmente sem Docker (apenas para o banco):

1. **Clone e Instale:**
   ```bash
   git clone https://github.com/marcelo-ifpe/qualeider.git
   cd qualeider/backend
   npm install
   ```

2. **Configure o `.env`:**
   ```bash
   cp .env.example .env
   # Edite as variáveis DATABASE_URL, JWT_SECRET, etc.
   ```

3. **Banco de Dados:**
   ```bash
   # Inicie seu Postgres local ou use docker só para o banco
   docker-compose up -d postgres
   
   # Rode as migrations
   npx prisma migrate dev
   ```

4. **Execute:**
   ```bash
   npm run start:dev
   ```

## ⚠️ Resolução de Problemas

**Erro: Porta 5432 já em uso**
Se você tiver um Postgres local rodando, o Docker falhará.
Pare o serviço local: `sudo service postgresql stop` ou altere a porta no `docker-compose.yml`.

**Erro: Prisma Client not initialized**
Se o container subir antes das migrations ou após mudanças no schema:
```bash
npx prisma generate
```

**Erro: Conexão recusada no Docker**
Certifique-se de que a `DATABASE_URL` no `.env` aponta para `host.docker.internal` ou o nome do serviço (`postgres`) dependendo de onde você está rodando (host vs container).

## 🧪 Testes

O projeto possui cobertura de testes unitários e E2E.

```bash
# Unitários
npm run test

# Cobertura (>80%)
npm run test:cov

# End-to-End
npm run test:e2e
```

---
**Desenvolvido como parte do IFPE.**
⭐ Se este projeto foi útil, considere dar uma estrela!
