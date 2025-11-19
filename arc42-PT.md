#

**Sobre o arc42**

arc42, o template para documentação de software e arquitetura de
sistemas.

Versão do template 8.2 PT. (baseado na versão AsciiDoc), Setembro de
2024

Criado, mantido e © pelo Dr. Peter Hruschka, Dr. Gernot Starke e
colaboradores. Veja <https://arc42.org>.

# 1. Introdução e Objetivos

## Visão Geral dos Requisitos

O **QuaLeiDer** é uma plataforma web para gestão de produtores de leite e suas associações, desenvolvida pelo Instituto Federal de Pernambuco.

### Requisitos Funcionais Principais

1. **Gestão de Usuários e Associações**

   - Cadastro e autenticação de produtores e associações
   - Autenticação via JWT (JSON Web Token)
   - Reset de senha via email
   - Separação de responsabilidades: Usuários (produtores) e Associações (gestores)

2. **Gestão de Animais**

   - Cadastro de animais por produtor
   - Rastreamento de características (tipo, raça, idade)
   - Controle de status (ativo/inativo)
   - Associação de animais a produtores
   - Análise de dados para prevenção de doenças

3. **Coletas Diárias de Leite**

   - Registro de coletas diárias
   - Informações sobre quantidade, número de ordenhas
   - Dados técnicos (ração, assistência técnica, local de ordenha)
   - Histórico de coletas por produtor

4. **Sistema de Convites**

   - Associações podem convidar produtores
   - Convites via email com token único
   - Aceitação/recusa de convites
   - Expiração automática (7 dias)
   - Limpeza automática via CRON job diário

5. **Notificações**

   - Sistema de notificações por email
   - Templates personalizados (Handlebars)
   - Eventos de convites, reset de senha, etc.

6. **Módulo de Relatórios e Análises**
   - **Dados Agregados para Associações:**
     - Total de leite coletado por período (dia/semana/mês)
     - Número de produtores ativos por associação
     - Média de produção por produtor
     - Ranking de produtores por volume
   - **Análise de Animais:**
     - Distribuição de animais por tipo e raça
     - Alertas de saúde: notificação quando um animal recebe medicação repetida (3x mesmo tipo em 30 dias)
     - Histórico de vacinação e tratamentos por animal
     - Taxa de produtividade por animal (litros/dia)

## Objetivos de Qualidade

| Prioridade | Objetivo de Qualidade | Cenário Mensurável                                                                                                                               |
| ---------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1          | **Segurança**         | Tokens JWT expiram em 24h; senhas com hash bcrypt (12 rounds); reset de senha expira em 15 min; proteção contra SQL injection via Prisma ORM; Headers HTTP seguros via Helmet     |
| 2          | **Manutenibilidade**  | Clean Architecture com 4 camadas (Domain, Application, Infrastructure, Presentation);                                                            |
| 3          | **Escalabilidade**    | Sistema suporta 50 associações e 2.000 produtores simultâneos; API responde < 300ms com 500 req/min; preparado para crescimento horizontal       |
| 4          | **Confiabilidade**    | Jobs CRON registram falhas em log; emails com 3 tentativas de reenvio (5, 15, 30 min); 99% de uptime para operações críticas                     |
| 5          | **Usabilidade**       | Produtor registra coleta em < 45s via smartphone; taxa de sucesso de 95% na aceitação de convites sem ajuda; API RESTful documentada com Swagger |
| 6          | **Testabilidade**     | Dependency Injection em 100% dos serviços; ports/adapters pattern; cobertura de testes > 80% em camadas críticas (Application, Domain)           |

### Detalhamento dos Objetivos

**Segurança:**

- Autenticação stateless com JWT
- Hash de senhas com bcrypt (12 rounds)
- Validação rigorosa de DTOs com decorators
- Proteção contra SQL injection via Prisma ORM
- Tokens de reset de senha com expiração de 15 minutos
- Proteção adicional contra ataques comuns de HTTP configurando headers via Helmet.

**Manutenibilidade:**

- Path aliases (`@/application`, `@/domain`, etc.)
- Logger padronizado em todos os serviços
- Código DRY com filtros globais de exceção
- Tipagem forte com TypeScript
- Padrões consistentes (SRP, DIP)
- Novos requisitos de negócio devem ser implementados tocando em no máximo 1 arquivo por camada.

**Escalabilidade:**

- Arquitetura modular com NestJS preparada para crescimento horizontal
- Suporte para 50 associações e 2.000 produtores registrando coletas simultaneamente
- Tempo de resposta da API de registro de coleta < 300ms mesmo com 500 requisições/minuto
- Database Prisma com connection pooling para otimização de queries
- Preparado para deploy em múltiplas instâncias (load balancing)

**Confiabilidade:**

- Transações Prisma para operações críticas (criação de usuário + associação)
- Retry automático de emails via sistema de eventos:
  - 1ª tentativa: imediata
  - 2ª tentativa: após 5 minutos
  - 3ª tentativa: após 15 minutos
  - 4ª tentativa: após 30 minutos
  - Falha permanente registrada em log após 4 tentativas
- CRON job de limpeza de convites:
  - Execução diária às 02:00
  - Falhas registradas em log estruturado para análise
- Validações em camadas (DTO, Service, Database)
- Tratamento de erros específico por tipo de falha (P2002, P2025, P2003)
- Monitoramento de processos em segundo plano com logs estruturados

**Usabilidade:**

- **Para Produtores:**
  - Interface responsiva otimizada para smartphones (tela mínima: 360px)
  - Fluxo de registro de coleta diária em < 45 segundos
  - Formulários com validação em tempo real e mensagens de erro claras
- **Para Desenvolvedores:**
  - Documentação arc42
  - API RESTful documentada com Swagger/OpenAPI
  - Exemplos de requisição/resposta para todos os endpoints
  - Mensagens de erro padronizadas com códigos HTTP apropriados

**Testabilidade:**

- **Arquitetura Orientada a Testes:**

  - Dependency Injection em 100% dos serviços (NestJS pattern)
  - Interfaces claramente definidas para todos os repositórios e serviços externos
  - Ports & Adapters pattern permitindo substituição de infraestrutura por mocks
  - Separação entre lógica de negócio (Application) e infraestrutura (Presentation, Infrastructure)

- **Cobertura de Testes (Atual: 96.25%):**

  - **Testes Unitários:** 450 testes cobrindo DTOs, Services, Controllers, Entities
    - DTOs: 100% de cobertura (validação de dados de entrada)
    - Services (Application): 100% de cobertura (lógica de negócio)
    - Controllers (Presentation): 100% de cobertura (endpoints HTTP)
    - Entities (Domain): 100% de cobertura (regras de negócio)
  - **Testes E2E:** 110 testes integrando backend completo (API + Database)
    - 7 suítes de testes: Auth (24), Users (18), Animals (16), Daily Collections (14), Invites (17), Associations (21)
    - Taxa de sucesso: 100% (110/110 testes passando)

- **Ferramentas e Práticas:**

  - Jest como framework de testes (unitários e E2E)
  - Supertest para testes de API HTTP
  - Test Factories para geração de dados de teste consistentes
  - Setup/Teardown automático de banco de dados para testes E2E
  - Mocks configuráveis para serviços externos (email, database)
  - Testes seguguindo o padrão AAA (Arrange, act, assert)

- **Estratégias de Teste:**

  - **Testes Unitários:** Isolam a lógica de negócio, mockando dependências externas
  - **Testes E2E:** Validam fluxos completos (HTTP → Controller → Service → Database)
  - **Testes de Integração:** Validam interação entre camadas (Service + Repository)
  - **Testes de Contrato:** Garantem que DTOs mantêm compatibilidade com contratos de API

- **Métricas de Qualidade:**
  - Meta: > 80% de cobertura em camadas críticas (Application, Domain)
  - 0 testes quebrados ou ignorados
  - Tempo de execução de testes unitários: < 60s
  - Tempo de execução de testes E2E: 90s

## Partes Interessadas

| Função/Nome                         | Contato                                    | Expectativas                                                                                                |
| ----------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| **Produtores de Leite**             | Usuários finais do sistema                 | Sistema simples para registro de coletas diárias, gestão de animais, recebimento de convites de associações |
| **Associações**                     | Organizações que gerenciam produtores      | Ferramenta para convidar e gerenciar produtores, visualizar dados agregados, enviar notificações            |
| **Instituto Federal de Pernambuco** | Cliente/Patrocinador (Fábrica de Software) |
| **Equipe de Desenvolvimento**       | Desenvolvedores do projeto                 | Arquitetura limpa e bem documentada, facilidade de manutenção e extensão, uso de boas práticas              |

# Restrições Arquiteturais

Este capítulo documenta as **limitações técnicas, organizacionais e convencionais** que restringem as escolhas arquiteturais do QuaLeiDer. Compreender essas restrições é fundamental para entender por que certas decisões foram tomadas e quais alternativas foram descartadas.

## Restrições Técnicas

Estas são as limitações impostas pela escolha de tecnologias, frameworks, plataformas e ferramentas utilizadas no projeto.

| Restrição                              | Descrição                                                 | Justificativa                                                                                  | Impacto Arquitetural                                                                                                                                                                                            |
| -------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Backend: NestJS + TypeScript**       | Framework obrigatório para desenvolvimento do backend     | Escolha do cliente (IFPE) baseada em maturidade, suporte empresarial e padrões consolidados    | Framework opinativo (Angular-like) com curva de aprendizado alta para quem vem do Express puro; obriga uso de Dependency Injection e arquitetura modular; limita escolhas de bibliotecas ao ecossistema Node.js |
| **Node.js >= 18.x LTS**                | Versão mínima do runtime JavaScript                       | Suporte a features modernas (fetch nativo, async/await, ES2021+) e LTS garantindo estabilidade | Não permite uso de features experimentais de versões 19+; compatibilidade com Prisma 6.x                                                                                                                        |
| **Banco de Dados: PostgreSQL 14+**     | SGBD relacional obrigatório                               | Exigência do IFPE para garantir integridade referencial e ACID compliance em dados de produção | Exclui NoSQL; limita escalabilidade horizontal; exige modelagem relacional rigorosa                                                                                                                             |
| **ORM: Prisma 6.x**                    | Abstração obrigatória para acesso a dados                 | Prisma oferece type-safety, migrations automáticas e prevenção de SQL injection                | Queries complexas podem exigir SQL raw; schema declarativo pode limitar otimizações específicas de PostgreSQL                                                                                                   |
| **Autenticação: JWT (Stateless)**      | Tokens JWT assinados com HS256                            | Arquitetura stateless mandatória para permitir escalabilidade horizontal futura                | Não permite revogação instantânea de tokens; sessões server-side não são opção; tamanho de token aumenta payload HTTP                                                                                           |
| **Hash de Senhas: bcrypt (12 rounds)** | Algoritmo de hashing com custo computacional configurável | Padrão da indústria para proteção contra rainbow tables e brute-force                          | Tempo de resposta de login aumenta (200ms); não permite argon2 (mais seguro mas menos maduro)                                                                                                                   |
| **Docker para Desenvolvimento**        | Containers para PostgreSQL e backend em ambiente local    | Facilita configuração de ambiente e garante paridade dev/prod                                  | Exige Docker Desktop instalado; overhead de recursos (RAM, CPU) em máquinas limitadas                                                                                                                           |
| **TypeScript >= 5.1.x**                | Superset de JavaScript com tipagem estática               | Type-safety obrigatório para reduzir bugs em tempo de compilação                               | Tempo de build aumenta; configuração de tipos pode ser complexa para bibliotecas sem @types                                                                                                                     |
| **REST API (Padrão HTTP)**             | Protocolo de comunicação entre frontend e backend         | Simplicidade, cacheable, stateless, amplo suporte em bibliotecas                               | Não permite GraphQL (flexibilidade de queries); overfetching/underfetching podem ocorrer                                                                                                                        |
| **Versionamento de API: /api/v1/**     | Prefixo obrigatório em todas as rotas                     | Permite evolução da API sem quebrar clientes existentes                                        | Aumenta tamanho de URLs; força planejamento de breaking changes                                                                                                                                                 |
| **Helmet Middleware**                  | Middleware obrigatório para headers HTTP seguros         | Requisito de segurança para evitar vulnerabilidades conhecidas                                | Headers configurados automaticamente em todas respostas HTTP                                                                                                                                                    |

---

## Restrições Organizacionais

Estas são as limitações impostas pelo contexto do projeto (Fábrica de Software, orçamento, equipe, prazo).

| Restrição                                 | Descrição                                             | Justificativa                                                                                         | Impacto Arquitetural                                                                                                                                    |
| ----------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fábrica de Software (IFPE)**            | Sistema desenvolvido pela Fábrica de Software do IFPE | Projeto educacional para aplicação prática de engenharia de software; será mantido por futuros alunos | Prioriza clareza de código e boas práticas sobre otimizações prematuras; exige documentação arc42 completa para facilitar transferência de conhecimento |
| **Equipe Reduzida (1-2 desenvolvedores)** | Time pequeno com experiência variada                  | Recursos humanos limitados                                                                            | Arquitetura deve ser simples e autoexplicativa                                                                                                          |
| **Orçamento Zero**                        | Projeto sem financiamento externo                     | Natureza acadêmica sem patrocínio                                                                     | Apenas ferramentas open-source ou com free tier generoso; exclui serviços pagos (AWS RDS, serviços SMTP premium)                                        |
| **Versionamento: GitHub (privado)**       | Repositório open-source                               | Requisito de transparência acadêmica                                                                  | Código deve seguir boas práticas; CI/CD via GitHub Actions                                                                                              |

---

## Restrições Legais

Estas são as limitações impostas pela legislação brasileira que impactam decisões de arquitetura e tratamento de dados.

| Restrição                  | Descrição                               | Justificativa                                                                           | Impacto Arquitetural                                                                                                                                                                                                                                      |
| -------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LGPD (Lei 13.709/2018)** | Lei Geral de Proteção de Dados pessoais | Obrigatoriedade legal para sistemas que coletam/processam dados de usuários brasileiros | Logs não podem conter senhas, tokens ou dados sensíveis; banco de dados deve suportar "soft delete" ou anonimização de usuários inativos; necessário implementar mecanismo de "direito ao esquecimento"; dados pessoais devem ter criptografia em repouso |

---

## Convenções de Desenvolvimento

Estas são as regras e padrões adotados pela equipe para garantir consistência e qualidade do código.

| Convenção                                     | Descrição                                                                                                                                                 | Exemplo                                                                                                        | Justificativa                                                                                                                                               |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Código em Inglês**                          | Variáveis, funções, classes, comentários de código                                                                                                        | `createDailyCollection()`, `UserEntity`, `findByEmail()`                                                       | Padrão da indústria; facilita leitura por desenvolvedores internacionais; bibliotecas de terceiros são em inglês                                            |
| **Documentação em Português**                 | README, arc42, comentários de negócio                                                                                                                     | `# Restrições Arquiteturais`, `// Validação: produtor deve ter associação`                                     | Contexto brasileiro e educacional; stakeholders (IFPE, produtores) falam português; facilita transferência de conhecimento para futuros alunos-mantenedores |
| **Testes em Português**                       | Descrições de testes (describe, it)                                                                                                                       | `describe('Criar convite', () => { it('deve falhar se usuário não existir') })`                                | Facilita compreensão do comportamento esperado por não-desenvolvedores; alinhamento com regras de negócio em português                                      |
| **Path Aliases (@/)**                         | Imports via aliases ao invés de caminhos relativos                                                                                                        | `import { UsersService } from '@/application/users'` ao invés de `'../../application/users'`                   | Reduz complexidade de imports; facilita refatoração; melhora legibilidade                                                                                   |
| **Clean Architecture (4 camadas)**            | Separação obrigatória em Domain, Application, Infrastructure, Presentation                                                                                | `src/domain/entities`, `src/application/services`, `src/infrastructure/prisma`, `src/presentation/controllers` | Testabilidade, baixo acoplamento, independência de frameworks                                                                                               |
| **Naming Conventions**                        | - Controllers terminam em `.controller.ts`<br>- Services terminam em `.service.ts`<br>- DTOs terminam em `.dto.ts`<br>- Entities terminam em `.entity.ts` | `users.controller.ts`, `auth.service.ts`, `create-user.dto.ts`, `user.entity.ts`                               | Facilita navegação no projeto; padrão NestJS; autoexplicativo                                                                                               |
| **Branch Strategy: Git Flow Simplificado**    | - `main`: produção<br>- `develop`: desenvolvimento<br>- `feature/*`: novas funcionalidades<br>- `hotfix/*`: correções urgentes                            | `feature/add-invite-system`, `hotfix/fix-login-bug`                                                            | Organização clara; facilita code review; permite deploys controlados                                                                                        |
| **Commits Semânticos (Conventional Commits)** | Prefixos obrigatórios: `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`                                                                           | `feat: adicionar endpoint de criação de convite`, `fix: corrigir validação de email`                           | Changelog automático; facilita rastreamento de mudanças; integração com versionamento semântico                                                             |
| **ESLint + Prettier**                         | Linting e formatação automática obrigatórios                                                                                                              | Configuração: `.eslintrc.js` + `.prettierrc`                                                                   | Consistência de código; reduz debates sobre estilo; CI falha se código não estiver formatado                                                                |
| **Husky + Lint-Staged**                       | Git hooks para validação pré-commit                                                                                                                       | Pre-commit: `eslint --fix`, `prettier --write`, `jest --findRelatedTests`                                      | Garante que código commitado está formatado e testado; reduz builds quebrados                                                                               |
| **100% Type-Safety**                          | TypeScript strict mode desabilitado por pragmatismo, mas types explícitos obrigatórios                                                                    | `const user: User = await findById(id)` ao invés de `const user = await findById(id)`                          | Previne bugs em tempo de compilação; melhora autocomplete; facilita refatoração                                                                             |
| **DTOs para Validação**                       | Toda entrada HTTP deve passar por DTO com class-validator                                                                                                 | `class CreateInviteDto { @IsNotEmpty() userId: number; }`                                                      | Valida dados na borda do sistema; previne injection; documentação automática via Swagger                                                                    |
| **Swagger/OpenAPI Obrigatório**               | Todos os endpoints devem ter decorators Swagger                                                                                                           | `@ApiOperation({ summary: 'Criar convite' })`, `@ApiResponse({ status: 201, type: InviteEntity })`             | Documentação automática da API; facilita integração frontend; serve como contrato                                                                           |

---

## Restrições de Segurança

| Restrição                            | Descrição                                                    | Impacto                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| **Secrets em Variáveis de Ambiente** | Nenhum secret (JWT_SECRET, DB_PASSWORD) pode estar hardcoded | Exige configuração de `.env` local; CI/CD deve usar GitHub Secrets                                                  |
| **CORS Restrito**                    | Apenas origens whitelistadas podem acessar API               | Frontend deve estar em domínio conhecido; localhost permitido apenas em dev                                         |
| **Input Validation Rigorosa**        | Todos os DTOs usam `class-validator` com regras explícitas   | Previne SQL injection, XSS, buffer overflow                                                                         |
| **Logs Sem Dados Sensíveis (LGPD)**  | Logs estruturados não podem expor senhas, tokens ou CPF      | Sistema de logging deve sanitizar dados antes de persistir; implementar mascaramento automático de campos sensíveis |

---

## Restrições de Qualidade

| Restrição                    | Meta                                                 | Validação                                         |
| ---------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| **Cobertura de Testes**      | Mínimo 80% em camadas críticas (Application, Domain) | CI/CD falha se cobertura < 80%                    |
| **Performance de API**       | Tempo de resposta < 500ms para 95% das requisições   | Monitoramento via logs; otimização de queries N+1 |
| **Tempo de Build**           | < 3 minutos (CI/CD)                                  | Otimização de Dockerfile; cache de dependências   |
| **Tamanho de Imagem Docker** | < 500MB                                              | Uso de `node:18-alpine`; multi-stage build        |

---

## Decisões Derivadas das Restrições

As restrições acima **forçaram** as seguintes decisões arquiteturais (detalhadas na Seção 4 - Estratégia de Solução):

1. **Monólito Modular** ao invés de Microserviços → Equipe pequena + prazo curto + deploy gratuito
2. **JWT Stateless** ao invés de Sessions → Escalabilidade horizontal + limitações de memória no free tier
3. **Prisma ORM** ao invés de SQL raw → Segurança (SQL injection) + time-to-market reduzido
4. **EventEmitter Local** ao invés de Message Queue (RabbitMQ/Kafka) → Custo zero + simplicidade
5. **Docker Compose** para dev ao invés de Kubernetes → Overhead reduzido para time pequeno
6. **GitHub Actions** para CI/CD ao invés de Jenkins → Gratuito para repos públicos + zero setup

---

# Contexto e Escopo

Esta seção delimita as fronteiras do sistema **QuaLeiDer**, mostrando como ele interage com o mundo externo (usuários, sistemas, infraestrutura). O objetivo é responder: **"O que está dentro e o que está fora do sistema?"**

---

## Contexto de Negócio {#\_contexto_negocial}

O contexto de negócio mostra os **atores humanos** e **sistemas de negócio externos** que interagem com o QuaLeiDer do ponto de vista do usuário final. Infraestrutura técnica (banco de dados, servidores SMTP, CI/CD) não aparecem aqui — eles são transparentes para os usuários e pertencem ao **Contexto Técnico**.

### Diagrama de Contexto

![Contexto do Sistema](images/system-context.png)

### Atores e Sistemas Externos

| Entidade Externa      | Tipo                   | Responsabilidades                                                                                                                                        | Interface de Comunicação                                    |
| --------------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| **Produtor de Leite** | Pessoa (Usuário Final) | - Registrar coletas diárias de leite<br>- Gerenciar cadastro de animais<br>- Aceitar/recusar convites de associações<br>- Consultar histórico de coletas | REST API (JSON via HTTPS)<br>Autenticação: JWT Bearer Token |
| **Associação**        | Pessoa (Gestor)        | - Convidar novos produtores<br>- Visualizar dados agregados de produção<br>- Gerenciar lista de produtores vinculados<br>- Acessar relatórios analíticos | REST API (JSON via HTTPS)<br>Autenticação: JWT Bearer Token |

### Interfaces de Domínio Externo

#### **1. Interface Produtor ↔ QuaLeiDer**

**Fluxos de Entrada (Produtor → Sistema):**

- **POST /auth/login**: Autenticação com email/senha → Retorna JWT
- **POST /daily-collections**: Registra nova coleta diária → Retorna ID da coleta
- **POST /animals**: Cadastra novo animal → Retorna dados do animal
- **PUT /invites/:token/accept**: Aceita convite de associação → Vincula produtor

**Fluxos de Saída (Sistema → Produtor):**

- **Email de Boas-vindas**: Enviado após aceitar convite (via SMTP)
- **Email de Reset de Senha**: Link com token de 15 minutos de validade

**Formato de Dados**: JSON (application/json)  
**Autenticação**: JWT Bearer Token (após login)

---

#### **2. Interface Associação ↔ QuaLeiDer**

**Fluxos de Entrada (Associação → Sistema):**

- **POST /invites**: Cria convite para produtor → Retorna token único
- **GET /daily-collections/reports**: Consulta relatórios agregados → Retorna estatísticas
- **GET /users?associationId=X**: Lista produtores vinculados → Retorna array de usuários

**Fluxos de Saída (Sistema → Associação):**

- **Email de Notificação**: Quando produtor aceita/recusa convite (via SMTP)

**Formato de Dados**: JSON (application/json)  
**Autenticação**: JWT Bearer Token (após login)

---

## Contexto Técnico {#\_contexto_t_cnico}

O contexto técnico detalha as **tecnologias** e **protocolos** utilizados na comunicação entre o sistema e suas dependências externas.

### Diagrama de Contexto Técnico

![Contexto Técnico](images/technical-context.png)

### Mapeamento de Interfaces Técnicas

| Canal de Comunicação         | Protocolo/Tecnologia               | Formato de Dados            | Autenticação/Segurança                                  | Porta/Endpoint                                  |
| ---------------------------- | ---------------------------------- | --------------------------- | ------------------------------------------------------- | ----------------------------------------------- |
| **Cliente ↔ API Backend**    | HTTP/1.1 (REST)                    | JSON (application/json)     | JWT HS256 (Bearer Token)<br>HTTPS/TLS em produção       | 3000¹<br>`/api/v1/*`                            |
| **Backend ↔ PostgreSQL**     | PostgreSQL Wire Protocol<br>TCP/IP | Prisma Query Language → SQL | Usuario/Senha (env vars)<br>Conexão criptografada (SSL) | 5432<br>`postgresql://user:pass@host:5432/db`   |
| **Backend ↔ SMTP Server**    | SMTP over TLS (STARTTLS)           | MIME (Multipart/HTML)       | SMTP AUTH (user/password)<br>TLS 1.2+                   | 587 (TLS)<br>465 (SSL)<br>`smtp.ethereal.email` |
| **GitHub Actions ↔ Backend** | HTTPS                              | GitHub Workflow YAML        | GitHub Token (secrets)                                  | N/A (CI/CD webhook)                             |

---

### Detalhamento das Interfaces Técnicas

#### **1. Interface HTTP REST (Cliente ↔ Backend)**

**Tecnologia**: Express.js (via NestJS)  
**Formato**: JSON (Content-Type: application/json)  
**Versionamento**: Prefixo `/api/v1/` em todas as rotas

**Exemplo de Requisição:**

```http
POST /api/v1/daily-collections HTTP/1.1
Host: localhost:3000
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "userId": 1,
  "date": "2025-11-17",
  "quantity": 45.5,
  "milkingCount": 2,
  "animalIds": [1, 2, 3]
}
```

**Exemplo de Resposta:**

```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "id": 42,
  "userId": 1,
  "date": "2025-11-17",
  "quantity": 45.5,
  "animals": [
    {"id": 1, "name": "Mimosa"},
    {"id": 2, "name": "Estrela"}
  ]
}
```

**Códigos HTTP Utilizados:**

- `200 OK`: Operação bem-sucedida (GET, PUT)
- `201 Created`: Recurso criado (POST)
- `204 No Content`: Exclusão bem-sucedida (DELETE)
- `400 Bad Request`: Validação de DTO falhou
- `401 Unauthorized`: Token JWT inválido/expirado
- `403 Forbidden`: Usuário sem permissão
- `404 Not Found`: Recurso inexistente
- `409 Conflit`: Conflito
- `500 Internal Server Error`: Erro não tratado

---

#### **2. Interface Prisma ↔ PostgreSQL**

**Tecnologia**: Prisma Client 6.3.1 (ORM Type-safe)  
**Protocolo**: PostgreSQL Wire Protocol (TCP/IP)  
**Connection Pooling**: Configurado automaticamente pelo Prisma

**Exemplo de Query (Prisma):**

```typescript
// TypeScript (Prisma Client)
const collection = await prisma.dailyCollection.create({
  data: {
    userId: 1,
    quantity: 45.5,
    animals: {
      connect: [{ id: 1 }, { id: 2 }],
    },
  },
  include: { animals: true },
});
```

**SQL Gerado (PostgreSQL):**

```sql
BEGIN;
INSERT INTO "DailyCollection" ("userId", "quantity", ...) VALUES (1, 45.5, ...);
INSERT INTO "_AnimalToDailyCollection" ("A", "B") VALUES (1, 42), (2, 42);
COMMIT;
```

**Configuração de Conexão (.env):**

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/qualeider_db"
```

---

#### **3. Interface Nodemailer ↔ SMTP**

**Tecnologia**: Nodemailer 6.10.0  
**Protocolo**: SMTP over TLS (STARTTLS)  
**Templates**: Handlebars (`.hbs`) para HTML dinâmico

**Exemplo de Envio de Email:**

```typescript
// TypeScript (MailService)
await this.mailerService.sendMail({
  to: "produtor@example.com",
  subject: "Convite para associação",
  template: "./invite-email",
  context: {
    associationName: "Cooperativa ABC",
    token: "abc123...",
    expiresIn: "7 dias",
  },
});
```

**Configuração SMTP (.env):**

```bash
# Desenvolvimento: Ethereal Email
MAIL_HOST=smtp.ethereal.email
MAIL_PORT=587                  # TLS
MAIL_USER=user@ethereal.email  # Gerado em https://ethereal.email
MAIL_PASSWORD=secret           # Gerado em https://ethereal.email
MAIL_FROM=noreply@qualeider.com
```

**Formato MIME (Enviado):**

```
From: noreply@qualeider.com
To: produtor@example.com
Subject: Convite para associação
Content-Type: multipart/alternative; boundary="----Boundary"

------Boundary
Content-Type: text/plain; charset=UTF-8

Olá! Você foi convidado para a Cooperativa ABC...

------Boundary
Content-Type: text/html; charset=UTF-8

<html>
  <body>
    <h1>Convite para Associação</h1>
    <p>Token: abc123...</p>
  </body>
</html>
```

---

### Dependências Externas e Suas Responsabilidades

| Sistema Externo    | Responsabilidade do QuaLeiDer                                              | Responsabilidade do Sistema Externo                                   | Contingência em Caso de Falha                                                                                                                                                                                                                                                                                                                                        |
| ------------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PostgreSQL**     | - Definir schema via Prisma<br>- Executar migrations<br>- Otimizar queries | - Garantir ACID compliance<br>- Persistir dados<br>- Executar backups | Sistema fica inoperante (crítico)<br>Erro 500 retornado ao cliente                                                                                                                                                                                                                                                                                                   |
| **SMTP Server**    | - Renderizar templates HTML<br>- Enviar emails via Nodemailer              | - Entregar emails<br>- Garantir SPF/DKIM<br>- Evitar spam             | Envio é **assíncrono via EventEmitter** (não bloqueia requisição HTTP)<br>Retry automático: 4 tentativas (0min, 5min, 15min, 30min)<br>Falha definitiva é logada com **TODO** para processamento manual<br>**Limitação atual:** Retry é em memória (perde-se ao reiniciar servidor)<br>**TODO:** Implementar fila persistente (Redis + BullMQ) para garantir entrega |
| **GitHub Actions** | - Manter testes atualizados<br>- Configurar workflow YAML                  | - Executar CI/CD pipeline<br>- Notificar status de build              | Deploy manual via Docker<br>Desenvolvedores notificados por email                                                                                                                                                                                                                                                                                                    |

---

### Variáveis de Ambiente (Configuração Externa)

O sistema depende de **variáveis de ambiente** para configurar interfaces externas:

```bash
# Banco de Dados
DATABASE_URL="postgresql://user:pass@host:5432/qualeider"

# Autenticação
JWT_SECRET="strong-random-secret-key-here"
JWT_EXPIRATION="24h"

# Email (SMTP) - Desenvolvimento: Ethereal
MAIL_HOST="smtp.ethereal.email"
MAIL_PORT=587
MAIL_USER="user@ethereal.email"
MAIL_PASSWORD="password"
MAIL_FROM="noreply@qualeider.com"

# Aplicação
PORT=3000
NODE_ENV="production"
```

**Segurança**: Nenhuma dessas variáveis pode estar hardcoded. Devem ser configuradas via `.env` (local) ou secrets do provedor de cloud (produção).

---

# Estratégia de Solução {#section-solution-strategy}

Esta seção documenta as **decisões arquiteturais de alto nível** tomadas para resolver os requisitos do sistema, explicando **por que** cada tecnologia ou padrão foi escolhido. As decisões são fortemente influenciadas pelas **restrições** documentadas na Seção 2.

---

## Visão Geral da Estratégia

A arquitetura do QuaLeiDer foi projetada para balancear **simplicidade** (time pequeno, orçamento zero) com **qualidade** (segurança, manutenibilidade, testabilidade). A estratégia central é:

> **"Monólito modular com Clean Architecture, usando tecnologias maduras do ecossistema Node.js/TypeScript, priorizando time-to-market sem sacrificar boas práticas de engenharia de software."**

---

## Decisões Arquiteturais Fundamentais

### 1. **Arquitetura: Monólito Modular (NestJS)**

**Decisão:** Sistema único com módulos independentes (`UsersModule`, `AnimalsModule`, `InvitesModule`, etc.) ao invés de microserviços.

**Justificativa:**

| Critério         | Monólito Modular ✅                  | Microserviços ❌                                      |
| ---------------- | ------------------------------------ | ----------------------------------------------------- |
| **Equipe**       | 1-2 desenvolvedores conseguem manter | Exige time de 5+ pessoas                              |
| **Complexidade** | Deploy único, logs centralizados     | Requer orquestração (Kubernetes), tracing distribuído |
| **Latência**     | Chamadas de função (nanossegundos)   | Chamadas HTTP entre serviços (milissegundos)          |
| **Transações**   | ACID nativo do PostgreSQL            | Saga Pattern ou 2PC (complexo)                        |

**Referência de Código:**

```typescript
// src/app.module.ts - Todos os módulos em um só monólito
@Module({
  imports: [
    UsersModule,
    AnimalsModule,
    InvitesModule,
    DailyCollectionsModule,
    AuthModule,
    MailModule,
    PrismaModule,
  ],
})
export class AppModule {}
```

---

### 2. **Padrão Arquitetural: Clean Architecture (4 Camadas)**

**Decisão:** Separar código em 4 camadas: **Domain** → **Application** → **Infrastructure** → **Presentation**.

**Justificativa:**

- **Testabilidade:** Lógica de negócio isolada da infraestrutura (mocks fáceis)
- **Manutenibilidade:** Mudanças em banco de dados não afetam regras de negócio
- **Substituibilidade:** Trocar Prisma por TypeORM exige mudanças apenas na camada Infrastructure
- **Requisito Acadêmico:** IFPE valoriza arquiteturas bem documentadas

**Estrutura de Diretórios:**

```
src/
├── domain/              # Entidades e regras de negócio puras
│   └── entities/        # User, Animal, DailyCollection
├── application/         # Casos de uso (Services)
│   └── services/        # UsersService, AnimalsService
├── infrastructure/      # Adaptadores externos
│   ├── prisma/          # ORM (substituível)
│   └── mail/            # Nodemailer (substituível)
└── presentation/        # Controllers (HTTP)
    └── controllers/     # UsersController, AnimalsController
```

**Regra de Dependência:**

![Regra de Dependência - Clean Architecture](images/dependency-rule.png)

**Princípios:**

- **Domain** (núcleo isolado) não conhece nenhuma outra camada
- **Application** depende apenas de Domain (usa entidades e interfaces)
- **Presentation** depende de Application (chama Services)
- **Infrastructure** implementa interfaces definidas em Domain/Application (Inversão de Dependência - DIP)
- Setas indicam dependência de código-fonte (imports), não fluxo de execução

**Benefício Concreto:** 96.25% de cobertura de testes (582 testes) graças à separação de camadas.

---

### 3. **Autenticação: JWT Stateless (HS256)**

**Decisão:** Tokens JWT assinados com HMAC-SHA256, sem armazenamento de sessão no servidor.

**Justificativa:**

| Aspecto            | JWT Stateless ✅                      | Sessions (Redis) ❌              |
| ------------------ | ------------------------------------- | -------------------------------- |
| **Escalabilidade** | Horizontal (stateless)                | Requer Redis compartilhado       |
| **Custo**          | Zero (sem dependência externa)        | Redis $5/mês                     |
| **Latência**       | Validação local (1ms)                 | Query Redis (5-10ms)             |
| **Revogação**      | Impossível (token válido até expirar) | Instantânea (delete key)         |
| **Complexidade**   | Baixa (biblioteca padrão)             | Média (gerenciar conexões Redis) |

**Configuração de Segurança:**

```typescript
// src/auth/auth.module.ts
JwtModule.register({
  secret: process.env.JWT_SECRET, // 256-bit random key
  signOptions: {
    expiresIn: '24h',              // Tokens expiram diariamente
    algorithm: 'HS256',            // HMAC-SHA256 (simétrico)
  },
}),
```

**Trade-off Aceito:**

- ❌ Não é possível revogar tokens antes de expirar (logout instantâneo impossível)
- ✅ Mitigação: Expiração curta (24h) + blacklist opcional para casos críticos

**Alternativas Descartadas:**

- **Sessions (Express-Session + Redis):** Requer infraestrutura adicional (custo)
- **OAuth2:** Overhead desnecessário para sistema interno sem SSO

---

### 4. **Banco de Dados: PostgreSQL + Prisma ORM**

**Decisão:** PostgreSQL 14+ como SGBD relacional com Prisma como ORM type-safe.

**Justificativa para PostgreSQL:**

- **Requisito IFPE:** Exigência institucional de banco relacional (ACID compliance)
- **Integridade Referencial:** Foreign Keys garantem consistência (ex: `DailyCollection.userId → User.id`)
- **Queries Complexas:** Suporte nativo a JOINs, agregações, CTEs (necessário para relatórios)

**Justificativa para Prisma:**

| Aspecto                  | Prisma ORM ✅                        | SQL Raw ❌                        | TypeORM ❌                         |
| ------------------------ | ------------------------------------ | --------------------------------- | ---------------------------------- |
| **Type-Safety**          | 100% (tipos gerados automaticamente) | 0% (strings SQL)                  | 80% (decorators podem quebrar)     |
| **SQL Injection**        | Impossível (prepared statements)     | Alto risco (concatenação manual)  | Baixo risco (query builder seguro) |
| **Migrations**           | Automáticas (`prisma migrate dev`)   | Manuais (scripts SQL versionados) | Automáticas (mas verbosas)         |
| **Developer Experience** | Autocomplete perfeito no VSCode      | Nenhum                            | Médio                              |
| **Performance**          | Boa (connection pooling nativo)      | Ótima (controle total)            | Boa                                |

**Exemplo de Type-Safety:**

```typescript
// TypeScript infere o tipo automaticamente
const user = await prisma.user.findUnique({
  where: { email: "produtor@example.com" },
  include: { animals: true }, // Tipo: User & { animals: Animal[] }
});

// ❌ Erro de compilação se tentar acessar campo inexistente
console.log(user.nonExistentField); // TypeScript Error!
```

**Trade-off Aceito:**

- ❌ Queries N+1 podem ocorrer (requer `include` explícito)
- ✅ Mitigação: `prisma.$queryRaw` para otimizações críticas

---

### 5. **Comunicação Assíncrona: EventEmitter (NestJS)**

**Decisão:** `@nestjs/event-emitter` para processamento assíncrono de emails, CRON jobs e notificações.

**Justificativa:**

| Aspecto            | EventEmitter ✅                 | RabbitMQ/Kafka ❌          |
| ------------------ | ------------------------------- | -------------------------- |
| **Custo**          | Zero (biblioteca nativa NestJS) | RabbitMQ: $10/mês          |
| **Complexidade**   | Baixa (decorators simples)      | Alta (gerenciar brokers)   |
| **Persistência**   | Nenhuma (em memória)            | Total (mensagens em disco) |
| **Latência**       | < 1ms (mesma thread)            | 5-10ms (rede)              |
| **Escalabilidade** | Limitada (1 servidor)           | Ilimitada (cluster)        |

**Casos de Uso Atuais:**

```typescript
// 1. Envio de emails assíncronos
this.eventEmitter.emit('invite.created', {
  userId: 1,
  token: 'abc123'
});

// 2. Auditoria de ações críticas
this.eventEmitter.emit('user.deleted', {
  userId: 42,
  deletedBy: 'admin@example.com'
});

// 3. Limpeza de dados expirados (CRON)
@Cron('0 2 * * *') // Diariamente às 02:00
async cleanupExpiredInvites() {
  this.eventEmitter.emit('cleanup.invites');
}
```

**Limitação Conhecida:**

- **Perda de eventos ao reiniciar servidor** (retry em memória não persiste)

**Referência:** Seção 3.2 (Dependências Externas) documenta esta limitação explicitamente.

---

### 6. **Containerização: Docker + Docker Compose**

**Decisão:** Docker para empacotamento e Docker Compose para orquestração local.

**Justificativa:**

- **Paridade Dev/Prod:** Mesmo ambiente PostgreSQL 14-alpine em desenvolvimento e produção
- **Onboarding Rápido:** Novo desenvolvedor roda `docker-compose up` e está pronto
- **CI/CD Simples:** GitHub Actions builda imagem e faz push para registry
- **Gratuito:** Docker Desktop é free para uso educacional

**docker-compose.yml (Desenvolvimento):**

```yaml
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: qualeider_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"

  backend:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - postgres
    environment:
      DATABASE_URL: postgresql://postgres:postgres@postgres:5432/qualeider_db
```

**Multi-Stage Build (Otimização):**

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
CMD ["node", "dist/main.js"]
```

**Resultado:** Imagem final de 180MB (meta: < 500MB) ✅

**Alternativa Descartada:**

- **Kubernetes:** Overhead desnecessário para 1 container (complexidade 10x maior)

---

### 7. **Validação de Entrada: class-validator + DTOs**

**Decisão:** Todos os payloads HTTP validados via Data Transfer Objects (DTOs) com decorators.

**Justificativa:**

- **Segurança:** Previne SQL Injection, XSS, buffer overflow
- **Documentação Automática:** Swagger gera docs a partir dos decorators
- **Fail-Fast:** Erros de validação retornam 400 Bad Request antes de chegar ao banco

**Exemplo de DTO:**

```typescript
// src/users/dto/create-user.dto.ts
export class CreateUserDto {
  @IsEmail({}, { message: "Email inválido" })
  @IsNotEmpty({ message: "Email é obrigatório" })
  email: string;

  @MinLength(8, { message: "Senha deve ter no mínimo 8 caracteres" })
  @Matches(/^(?=.*[A-Z])(?=.*\d)/, {
    message: "Senha deve conter letra maiúscula e número",
  })
  password: string;

  @IsOptional()
  @IsNumber()
  associationId?: number;
}
```

**Configuração nos Controllers:**

```typescript
// InvitesService (Publisher) - NÃO conhece MailService
this.eventEmitter.emit('invite.created', {
  inviteId: invite.id,
  token: invite.token,
  userEmail: user.email,
  associationName: association.name,
});

// InviteEmailListener (Subscriber) - escuta automaticamente
@OnEvent('invite.created')
async handleInviteCreated(event: InviteCreatedEvent) {
  const retryDelays = [5 * 60 * 1000, 15 * 60 * 1000, 30 * 60 * 1000]; // 5min, 15min, 30min

  for (let attempt = 0; attempt < retryDelays.length + 1; attempt++) {
    try {
      await this.mailService.sendInviteEmail(event);
      this.logger.log(`Email de convite enviado com sucesso (tentativa ${attempt + 1})`);
      return; // Sucesso - sai do loop
    } catch (error) {
      const isLastAttempt = attempt === retryDelays.length;

      if (isLastAttempt) {
        this.logger.error(`Falha definitiva no envio de email após ${attempt + 1} tentativas`, error);
        // TODO: Persistir em fila de falhas para processamento manual
        throw error;
      }

      const delay = retryDelays[attempt];
      this.logger.warn(`Tentativa ${attempt + 1} falhou. Reagendando em ${delay / 60000}min...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

**Nota:** O projeto usa `ValidationPipe` em nível de controller com `transform: true` para converter tipos automaticamente.

**Benefícios:**

| Aspecto             | Sem EventEmitter (Síncrono)         | Com EventEmitter (Assíncrono)       |
| ------------------- | ----------------------------------- | ----------------------------------- |
| **Performance**     | 3s de resposta (espera envio email) | 100ms (retorna imediatamente)       |
| **Acoplamento**     | Service depende de MailService      | Completamente desacoplado           |
| **Resiliência**     | Erro no email quebra criação        | Falha no email não afeta DB         |
| **Extensibilidade** | Difícil adicionar novos listeners   | Fácil adicionar Notification, Audit |
| **Testabilidade**   | Precisa mockar MailService          | Testa Service isoladamente          |

### Características de Qualidade

- **Performance**: Tempo de resposta < 100ms (email enviado em background)
- **Resiliência**:
  - Falha no envio de email não impede criação do convite
  - Sistema de retry automático: 3 tentativas com intervalos de 5min, 15min e 30min
  - Falhas definitivas são logadas para processamento manual posterior
- **Segurança**: Token único gerado com `crypto.randomBytes(32)`, expiração em 7 dias
- **Rastreabilidade**: Evento `invite.created` logado para auditoria, incluindo tentativas de retry

---

## 6.2. Fluxo de Autenticação (Login) {#fluxo_autenticacao_login}

### Diagrama de Sequência

![Fluxo de Login](images/auth-login-flow.png)

### Descrição do Fluxo

Este diagrama ilustra o processo completo de autenticação JWT, desde a validação de credenciais até a geração do token de acesso.

**Atores e Componentes:**

- **User**: Usuário (Produtor, Associação) solicitando autenticação
- **AuthController**: Camada de apresentação (HTTP) que recebe credenciais
- **AuthService**: Camada de aplicação contendo lógica de autenticação
- **UsersService**: Serviço responsável por buscar usuários no banco
- **JwtService**: Serviço de infraestrutura para geração de tokens JWT
- **ORM (Prisma)**: Camada de acesso a dados (PostgreSQL)
- **PostgreSQL**: Banco de dados relacional

**Etapas do Fluxo:**

1. **Requisição HTTP**: User envia `POST /auth/login` com `{email, password}`
2. **Validação de Credenciais**: AuthService chama `validateUser(email, password)`
3. **Busca de Usuário**: UsersService consulta banco via `findByEmail(email)`
4. **Query SQL**: Prisma executa `SELECT * FROM "User" WHERE email = ?`
5. **Validação de Senha**: AuthService compara senha com `bcrypt.compare(password, hash)`
6. **Remoção de Senha**: Campo `password` é removido do objeto antes de retornar
7. **Geração de Token**: AuthService cria payload JWT e solicita assinatura
8. **Assinatura JWT**: JwtService gera token com algoritmo HS256 e secret
9. **Auditoria**: Logger registra autenticação bem-sucedida com email do usuário
10. **Resposta HTTP**: Retorna `200 OK` com `{access_token}` válido por 24 horas

### Segurança e Validações

**Validação de Credenciais:**

```typescript
// AuthService.validateUser()
const user = await this.usersService.findByEmail(email);

if (!user) {
  throw new UnauthorizedException("Credenciais inválidas.");
}

const isPasswordValid = await bcrypt.compare(password, user.password);

if (!isPasswordValid) {
  throw new UnauthorizedException("Credenciais inválidas.");
}

// Remove senha antes de retornar
const { password, ...result } = user;
return result;
```

**Payload do JWT:**

```typescript
// AuthService.login()
const payload = {
  email: user.email,
  sub: user.id,
  associationId: user.associationId,
};

return {
  access_token: this.jwtService.sign(payload),
};
```

**Configuração do Token:**

| Propriedade   | Valor                         | Descrição                                    |
| ------------- | ----------------------------- | -------------------------------------------- |
| **Algoritmo** | HS256 (HMAC-SHA256)           | Assinatura simétrica                         |
| **Secret**    | `process.env.JWT_SECRET`      | Chave secreta do servidor                    |
| **Expiração** | 24 horas                      | Token válido por 1 dia                       |
| **Payload**   | `{email, sub, associationId}` | Dados do usuário (sem informações sensíveis) |
| **Stateless** | Sim                           | Servidor não armazena sessão                 |

### Cenários de Erro

**1. Usuário Não Encontrado:**

```
POST /auth/login {email: "wrong@example.com", password: "123"}
→ UsersService.findByEmail() retorna null
→ throw UnauthorizedException("Credenciais inválidas.")
→ Response: 401 Unauthorized
```

**2. Senha Incorreta:**

```
POST /auth/login {email: "user@example.com", password: "WrongPass"}
→ UsersService.findByEmail() retorna user
→ bcrypt.compare() retorna false
→ throw UnauthorizedException("Credenciais inválidas.")
→ Response: 401 Unauthorized
```

**Importante:** Por questões de segurança, ambos os erros retornam a mesma mensagem genérica "Credenciais inválidas" para não revelar se o email existe no sistema.

### Características de Qualidade

- **Performance**: Tempo de resposta < 200ms (validação + geração de token)
- **Segurança**:
  - Senhas hasheadas com bcrypt (12 rounds)
  - JWT assinado com HS256 + secret forte
  - Senha nunca retornada ao cliente
  - Mensagens de erro genéricas (não revelam se email existe)
- **Auditoria**: Cada autenticação bem-sucedida é registrada em log com timestamp e email
- **Escalabilidade**: Autenticação stateless permite balanceamento de carga sem sessão compartilhada

### Uso do Token

Após autenticação bem-sucedida, o cliente deve incluir o token em todas as requisições protegidas:

```http
GET /animals HTTP/1.1
Host: api.qualeider.com
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

O token é validado automaticamente pelo `JwtAuthGuard` em endpoints protegidos com decorator `@UseGuards(JwtAuthGuard)`.

---

## 6.3. Fluxo de Registro de Coleta Diária {#fluxo_registro_coleta}

### Diagrama de Sequência

![Registro de Coleta Diária](images/daily-collection-flow.png)

### Descrição do Fluxo
Este documento descreve o processo técnico de registro de uma coleta diária de leite

**Atores e Componentes:**

- **User (Produtor)**: Produtor de leite registrando a coleta diária
- **DailyCollectionsController**: Camada de apresentação (HTTP)
- **DailyCollectionsService**: Camada de aplicação com lógica de negócio e validações
- **ORM (Prisma)**: Camada de acesso a dados (PostgreSQL)
- **PostgreSQL**: Banco de dados relacional

**Etapas do Fluxo:**

1. **Requisição HTTP**: Produtor envia `POST /daily-collections` com dados da coleta
2. **Validações de Pré-requisitos**:
   - ✓ **Produtor existe e está ativo** 
3. **Persistência**: 2 operações SQL executadas em transação:
   - `INSERT INTO "DailyCollection"` (coleta principal)
4. **Resposta HTTP**: Retorna `201 Created` com dados da coleta

### Características de Qualidade

- **Performance**:

  - Tempo médio de resposta: 250ms
  - Meta: < 300ms para 95% das requisições
  - 2 queries de validação + 1 INSERT atômico

- **Atomicidade**:

  - Transação Prisma garante criação de coleta + relacionamentos
  - Rollback automático em caso de falha

- **Rastreabilidade**:

  - Histórico completo de coletas por produtor
  - Dados técnicos para análise de produtividade (TO DO)

- **Validação Rigorosa**:
  - validações de negócio antes de persistir
  - Garante integridade referencial 
  - Previne dados inconsistentes no banco

# Visão de Implantação {#section-deployment-view}

## Nível de Infraestrutura 1 {#\_n_vel_de_infraestrutura_1}

**_\<Diagrama de Visão Geral>_**

Motivação

: _\<explicação em forma de texto>_

Características de Qualidade e/ou Desempenho

: _\<explicação em forma de texto>_

Mapeamento de Blocos de Construção para Infraestrutura

: _\<descrição do mapeamento>_

## Nível de Infraestrutura 2 {#\_n_vel_de_infraestrutura_2}

### _\<Elemento de Infraestrutura 1>_ {#\_\_emphasis_elemento_de_infraestrutura_1_emphasis}

_\<diagrama + explicação>_

### _\<Elemento de Infraestrutura 2>_ {#\_\_emphasis_elemento_de_infraestrutura_2_emphasis}

_\<diagrama + explicação>_

...

### _\<Elemento de Infraestrutura n>_ {#\_\_emphasis_elemento_de_infraestrutura_n_emphasis}

_\<diagrama + explicação>_

# Conceitos Transversais

## Estratégia de Testabilidade

A testabilidade é um conceito transversal crítico no QuaLeiDer, garantindo que o sistema seja mantível, confiável e evolua com segurança.

### Princípios de Design para Testabilidade

**1. Dependency Injection (DI)**

- 100% dos serviços utilizam DI via NestJS
- Permite substituição de dependências por mocks/stubs em testes
- Exemplo: `MailService` pode ser substituído por `MockMailService` em testes

![Dependency Injection](images/dependency-injection.png)

**2. Ports & Adapters (Hexagonal Architecture)**

- Interfaces claramente definidas entre camadas
- Camada de Application independente de infraestrutura
- Exemplo: Interface `IUserRepository` implementada por `PrismaUserRepository` em produção e `InMemoryUserRepository` em testes

![Ports & Adapters Pattern](images/ports-adapters.png)

O padrão Ports & Adapters isola a lógica de negócio (núcleo) das preocupações de infraestrutura através de interfaces bem definidas:

- **Ports (Interfaces):** Contratos que definem "o quê" o sistema precisa

  - Repository Port: Interface para acesso a dados
  - HTTP Port: Endpoints de entrada (Controllers)
  - Email Port: Interface para envio de emails

- **Adapters (Implementações):** Traduzem entre o mundo externo e o núcleo
  - Inbound: `InvitesController` recebe requisições HTTP
  - Outbound: `PrismaService` (PostgreSQL), `MailService` (Nodemailer)

**Benefícios:**

- Testabilidade: Services testados com mocks (ex: `MockMailService` substitui `MailService` em testes)
- Independência: Trocar Nodemailer por SendGrid afeta apenas 1 arquivo
- Manutenibilidade: Lógica de negócio isolada de frameworks

**3. Separation of Concerns**

- DTOs separam validação de entrada da lógica de negócio
- Services contêm apenas lógica de negócio (sem detalhes de HTTP ou Database)
- Controllers são finos, delegando toda lógica para Services

![Separation of Concerns](images/separation-of-concerns.png)

O princípio de Separation of Concerns divide responsabilidades em camadas distintas:

- **Presentation (Controllers):** Apenas recebe requisições HTTP e delega para Services
- **Application (Services):** Contém toda lógica de negócio, sem conhecimento de HTTP ou Database
- **Domain (Entities):** Regras de negócio puras, validações de domínio
- **Infrastructure (Prisma, Mail):** Detalhes técnicos de implementação

**Benefícios:**

- Cada camada pode ser testada isoladamente
- Mudanças em uma camada não afetam outras
- Código mais legível e organizado

### Estrutura de Testes

```
tests/
├── unit/                          # Testes unitários (450 testes)
│   ├── application/
│   │   ├── dtos/                 # Validação de DTOs (100% cobertura)
│   │   └── services/             # Lógica de negócio (100%+ cobertura)
│   ├── domain/
│   │   ├── entities/             # Regras de domínio (100% cobertura)
│   │   └── enums/
│   └── presentation/
│       └── controllers/          # Endpoints HTTP (100% cobertura)
├── e2e/                           # Testes end-to-end (110 testes)
│   ├── auth/                     # Login, Reset de Senha (24 testes)
│   ├── users/                    # CRUD de Usuários (18 testes)
│   ├── animals/                  # CRUD de Animais (16 testes)
│   ├── daily-collections/        # CRUD de Coletas (14 testes)
│   ├── invites/                  # Sistema de Convites (17 testes)
│   ├── associations/             # CRUD de Associações (21 testes)
│   ├── factories/                # Test Factories para dados de teste
│   └── helpers/                  # Helpers para autenticação e setup
├── mocks/                         # Mocks reutilizáveis
└── factories/                     # Factories para geração de dados
```

### Test Factories Pattern

Factories geram dados de teste consistentes e reutilizáveis:

```typescript
// Exemplo: UserFactory
UserFactory.buildProducer(); // Produtor com dados válidos
UserFactory.buildAssociation(); // Associação

// Exemplo: AnimalFactory
AnimalFactory.buildVaca(); // Vaca com dados padrão
AnimalFactory.buildCabra(); // Cabra
AnimalFactory.build({ age: 5 }); // Animal personalizado
```

**Benefícios:**

- Reduz duplicação de código nos testes
- Garante dados válidos por padrão
- Facilita manutenção quando DTOs mudam
- Aumenta legibilidade dos testes

### Estratégias de Mock

**1. Mocks de Serviços Externos**

- `MailService`: Mock para evitar envio de emails reais em testes
- `PrismaService`: Mock para testes unitários de services

**2. Test Doubles**

- **Stubs:** Retornam dados pré-definidos (ex: `findById()` retorna usuário fixo)
- **Spies:** Verificam se métodos foram chamados com argumentos corretos
- **Mocks:** Simulam comportamento completo de dependências

**3. Database em Testes E2E**

- Database real (PostgreSQL) isolado para testes
- Setup/Teardown automático entre testes
- Transações rollback para garantir isolamento

### Padrões de Nomenclatura

Testes em **português** seguindo convenção "deve...":

```typescript
describe('E2E: Animais - Operações CRUD', () => {
  describe('POST /animals (Criar)', () => {
    it('deve criar um novo animal com dados válidos', ...)
    it('deve retornar 404 com userId inexistente', ...)
    it('deve retornar 400 com dados inválidos', ...)
  })
})
```

**Benefícios:**

- Testes funcionam como documentação viva em português
- Facilitam compreensão por desenvolvedores brasileiros
- Mensagens de erro claras ao executar testes

### Métricas e Metas

| Métrica               | Meta   | Atual  | Status |
| --------------------- | ------ | ------ | ------ |
| Cobertura Geral       | > 80%  | 96.25% | ✅     |
| Cobertura DTOs        | 100%   | 100%   | ✅     |
| Cobertura Services    | > 90%  | 100%+   | ✅     |
| Cobertura Controllers | > 90%  | 100%    | ✅     |
| Testes Unitários      | > 300  | 453    | ✅     |
| Testes E2E            | > 80   | 110    | ✅     |
| Tempo Exec. Unit      | < 60s  | 50s    | ✅     |
| Tempo Exec. E2E       | < 120s | 90s    | ✅     |
| Taxa de Sucesso       | 100%   | 100%   | ✅     |

### Processo de CI/CD

**1. Validação Pré-Commit**

- Linter (ESLint) valida padrões de código
- Prettier formata código automaticamente

**2. Pipeline de Testes**

- Testes unitários executados primeiro (rápido feedback)
- Testes E2E executados se unitários passarem
- Cobertura validada (bloqueia merge se < 80%)

**3. Proteção de Branches**

- Pull Requests requerem 100% dos testes passando
- Cobertura não pode diminuir
- Review de código obrigatório

### Boas Práticas Adotadas

1. **AAA Pattern (Arrange-Act-Assert):** Estrutura clara em todos os testes
2. **Test Isolation:** Cada teste independente (sem ordem de execução)
3. **Single Responsibility:** Um teste valida um comportamento
4. **Meaningful Names:** Nomes descritivos em português

### 8.5 Proteção Automatizada com Git Hooks

#### Objetivo

Prevenir que código não testado ou com falhas chegue ao repositório remoto através de validações automáticas locais executadas antes de commits e pushes.

#### Implementação

**Ferramenta:** Husky v9.1.7  
**Localização:** `backend/.husky/`  
**Configuração:** Git hooks path configurado automaticamente via `npm run prepare`

#### Hooks Configurados

**Pre-commit:**

- **Trigger:** Executado antes de finalizar cada commit
- **Comando:** `npm run test:unit -- --bail --passWithNoTests`
- **Validação:** Testes unitários (472 testes)
- **Tempo médio:** 45 segundos
- **Comportamento:** Bloqueia commit se algum teste falhar
- **Objetivo:** Feedback imediato sobre falhas antes de salvar alterações

**Pre-push:**

- **Trigger:** Executado antes de enviar commits ao repositório remoto
- **Comandos:**
  ```bash
  npm run test:unit      # 472 testes unitários
  npm run test:e2e       # 110 testes E2E
  ```
- **Tempo médio:** 2 minutos (testes completos)
- **Comportamento:** Bloqueia push se qualquer teste falhar
- **Objetivo:** Última validação local antes de código chegar ao repositório

#### Fluxo de Validação

```
Desenvolvedor faz alteração
         ↓
    git add .
         ↓
   git commit -m "..."
         ↓
   [PRE-COMMIT HOOK]
   → Executa testes unitários
   → ✅ Passa: Commit criado
   → ❌ Falha: Commit bloqueado
         ↓
    git push origin main
         ↓
   [PRE-PUSH HOOK]
   → Executa testes unitários + E2E
   → ✅ Passa: Push realizado
   → ❌ Falha: Push bloqueado
         ↓
   [GITHUB ACTIONS]
   → Validação de cobertura (80%)
   → Build e testes no servidor
```

#### Bypass de Hooks (Não Recomendado)

Em situações excepcionais (emergências, hotfixes urgentes), é possível ignorar hooks:

```bash
# Ignorar pre-commit
git commit --no-verify

# Ignorar pre-push
git push --no-verify
```

⚠️ **Atenção:** Usar apenas quando absolutamente necessário. O código ainda será validado pelo GitHub Actions, mas o feedback será mais tardio.

#### Integração com Monorepo

Como o projeto possui estrutura monorepo (`qualeider/` contém `backend/` e `frontend/`), os hooks são configurados para:

1. Executar a partir do diretório correto (`cd backend`)
2. Rodar comandos npm do projeto backend
3. Configuração do Git: `core.hooksPath = backend/.husky`

#### Benefícios da Abordagem

1. **Feedback Imediato:** Desenvolvedores descobrem falhas em segundos, não minutos
2. **Economia de CI/CD:** Menos execuções no GitHub Actions (falhas detectadas localmente)
3. **Qualidade Consistente:** Impossível commitar código quebrado acidentalmente
4. **Cultura de Qualidade:** Reforça importância de testes na equipe
5. **Produtividade:** Evita ciclos de "commit → push → CI falha → fix → repeat"

#### Limitações Conhecidas

1. **Bypass possível:** Desenvolvedores podem usar `--no-verify` (mitigado por GitHub Actions)
2. **Tempo de commit aumentado:** 45s adicional por commit (aceitável para qualidade)
3. **Requer database local:** Testes E2E precisam de PostgreSQL rodando (Docker Compose)
4. **Não valida todos os cenários:** GitHub Actions ainda é necessário para validação completa

## _\<Conceito 2>_ {#\_\_emphasis_conceito_2_emphasis}

_\<explicação>_

---

## 8.2 Modelo de Domínio {#modelo_dominio}

O modelo de domínio do QuaLeiDer representa as **entidades principais** do sistema e seus **relacionamentos**, refletindo as regras de negócio da gestão de produtores de leite.

![Class diagram UML](images/domain-model.png)

### Entidades Principais

#### **User (Usuário/Produtor/Associação)**

**Atributos:**

- `id`: number (PK, auto-increment)
- `email`: string (unique, formato email válido)
- `password`: string (hash bcrypt 12 rounds)
- `name`: string (nome completo)
- `role`: UserRole (`PRODUCER` | `ASSOCIATION`)
- `associationId`: number | null (FK → Association)
- `resetPasswordToken`: string | null (token único, expira em 15min)
- `resetPasswordExpires`: Date | null
- `createdAt`: Date
- `updatedAt`: Date

**Relacionamentos:**

- 1-N com Animal (Produtor possui múltiplos animais)
- 1-N com DailyCollection (Produtor registra múltiplas coletas)
- N-1 com Association (Produtor vinculado a 1 associação)
- 1-N com Invite (Produtor recebe múltiplos convites)

**Regras de Negócio:**

- Email deve ser único no sistema
- Senha deve ter mínimo 8 caracteres, 1 maiúscula, 1 número
- Produtor só pode registrar coletas se `associationId != null`
- Token de reset expira em 15 minutos (garbage collection via CRON)

**Exemplo de Código (Prisma Schema):**

```prisma
model User {
  id                    Int       @id @default(autoincrement())
  email                 String    @unique
  password              String
  name                  String
  role                  UserRole  @default(PRODUCER)
  associationId         Int?
  resetPasswordToken    String?   @unique
  resetPasswordExpires  DateTime?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt

  association           Association?      @relation(fields: [associationId], references: [id])
  animals               Animal[]
  dailyCollections      DailyCollection[]
  invites               Invite[]
}

enum UserRole {
  PRODUCER
  ASSOCIATION
}
```

---

#### **Animal**

**Atributos:**

- `id`: number (PK, auto-increment)
- `name`: string (nome do animal)
- `type`: AnimalType (`COW` | `GOAT` | `SHEEP`)
- `breed`: string (raça)
- `birthDate`: Date (data de nascimento)
- `isActive`: boolean (status ativo/inativo)
- `userId`: number (FK → User, obrigatório)
- `createdAt`: Date
- `updatedAt`: Date

**Relacionamentos:**

- N-1 com User (Animal pertence a 1 produtor)
- N-N com DailyCollection (Animal participa de múltiplas coletas)

**Regras de Negócio:**

- Produtor pode cadastrar múltiplos animais
- Animal inativo não pode participar de coletas
- Nome deve ser único por produtor (soft constraint)

**Exemplo de Código (Prisma Schema):**

```prisma
model Animal {
  id              Int              @id @default(autoincrement())
  name            String
  type            AnimalType
  breed           String
  birthDate       DateTime
  isActive        Boolean          @default(true)
  userId          Int
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  user            User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  dailyCollections DailyCollection[] @relation("AnimalDailyCollections")

  @@unique([userId, name]) // Soft constraint: nome único por produtor
}

enum AnimalType {
  COW
  GOAT
  SHEEP
}
```

---

#### **DailyCollection (Coleta Diária)**

**Atributos:**

- `id`: number (PK, auto-increment)
- `userId`: number (FK → User)
- `date`: Date (data da coleta, não pode ser futura)
- `quantity`: float (litros coletados, > 0)
- `milkingCount`: number (número de ordenhas, 1-3)
- `feed`: string | null (tipo de ração fornecida)
- `milkingLocation`: string | null (local da ordenha)
- `hasTechnicalAssistance`: boolean (recebeu assistência técnica)
- `createdAt`: Date
- `updatedAt`: Date

**Relacionamentos:**

- N-1 com User (Coleta pertence a 1 produtor)
- N-N com Animal (Coleta envolve múltiplos animais)

**Regras de Negócio:**

- Data não pode ser futura
- Quantidade deve ser > 0L
- milkingCount: 1 (apenas manhã), 2 (manhã + tarde), 3 (manhã + tarde + noite)
- Produtor só pode registrar coletas se estiver vinculado a associação
- 1 coleta por dia por produtor (unique constraint: userId + date)

**Exemplo de Código (Prisma Schema):**

```prisma
model DailyCollection {
  id                     Int       @id @default(autoincrement())
  userId                 Int
  date                   DateTime  @db.Date
  quantity               Float
  milkingCount           Int
  feed                   String?
  milkingLocation        String?
  hasTechnicalAssistance Boolean   @default(false)
  createdAt              DateTime  @default(now())
  updatedAt              DateTime  @updatedAt

  user                   User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  animals                Animal[]  @relation("AnimalDailyCollections")

  @@unique([userId, date]) // 1 coleta por dia por produtor
}
```

---

#### **Invite (Convite)**

**Atributos:**

- `id`: number (PK, auto-increment)
- `token`: string (unique, gerado com `crypto.randomBytes(32)`)
- `userId`: number (FK → User, produtor convidado)
- `associationId`: number (FK → Association, associação que convida)
- `status`: InviteStatus (`PENDING` | `ACCEPTED` | `REJECTED` | `EXPIRED`)
- `message`: string | null (mensagem personalizada)
- `expiresAt`: Date (data de expiração, 7 dias após criação)
- `createdAt`: Date
- `updatedAt`: Date

**Relacionamentos:**

- N-1 com User (Convite destinado a 1 produtor)
- N-1 com Association (Convite enviado por 1 associação)

**Regras de Negócio:**

- Token único gerado automaticamente
- Expira em 7 dias após criação
- Produtor só pode ter 1 convite `PENDING` por vez
- Ao aceitar convite, `User.associationId` é atualizado
- CRON job diário (02:00) marca convites expirados como `EXPIRED`

**Exemplo de Código (Prisma Schema):**

```prisma
model Invite {
  id            Int          @id @default(autoincrement())
  token         String       @unique
  userId        Int
  associationId Int
  status        InviteStatus @default(PENDING)
  message       String?
  expiresAt     DateTime
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  association   Association  @relation(fields: [associationId], references: [id], onDelete: Cascade)

  @@unique([userId, status]) // 1 convite PENDING por usuário
}

enum InviteStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
}
```

---

#### **Association (Associação)**

**Atributos:**

- `id`: number (PK, auto-increment)
- `name`: string (nome da associação)
- `description`: string | null
- `createdAt`: Date
- `updatedAt`: Date

**Relacionamentos:**

- 1-N com User (Associação gerencia múltiplos produtores)
- 1-N com Invite (Associação envia múltiplos convites)

**Regras de Negócio:**

- Nome deve ser único
- Associação pode visualizar dados agregados de seus produtores
- Pode convidar novos produtores

**Exemplo de Código (Prisma Schema):**

```prisma
model Association {
  id          Int      @id @default(autoincrement())
  name        String   @unique
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users       User[]
  invites     Invite[]
}
```

---

### Diagrama de Relacionamentos (ER)

![Diagrama de Entidade Relacionamento](images/domain-model-er.png)

---

### Regras de Negócio Compartilhadas

#### **1. Ciclo de Vida do Convite**

```typescript
// Estado inicial
Invite { status: PENDING, expiresAt: now() + 7 days }

// Fluxos possíveis:
PENDING → ACCEPTED (produtor aceita via token)
PENDING → REJECTED (produtor rejeita via token)
PENDING → EXPIRED (CRON job diário marca expirados)

// Regras:
- ACCEPTED: User.associationId = Invite.associationId
- REJECTED/EXPIRED: Convite arquivado (não deletado)
- Produtor só pode ter 1 convite PENDING
```

#### **2. Vínculo Produtor-Associação**

```typescript
// Regra: Produtor só registra coletas se vinculado
if (user.role === "PRODUCER" && !user.associationId) {
  throw new ForbiddenException("Produtor deve estar vinculado a associação");
}

// Validação ao criar coleta
@Injectable()
export class DailyCollectionsService {
  async create(userId: number, dto: CreateDailyCollectionDto) {
    const user = await this.usersService.findOne(userId);
    if (!user.associationId) {
      throw new ForbiddenException("Produtor não vinculado a associação");
    }
    // ...
  }
}
```

#### **3. Expiração de Tokens**

```typescript
// Reset de Senha: 15 minutos
const resetTokenExpiration = new Date();
resetTokenExpiration.setMinutes(resetTokenExpiration.getMinutes() + 15);

// Convite: 7 dias
const inviteExpiration = new Date();
inviteExpiration.setDate(inviteExpiration.getDate() + 7);

// Validação
if (now > expiresAt) {
  throw new UnauthorizedException("Token expirado");
}
```

---

## 8.3 Segurança e Proteção {#seguranca_protecao}

O QuaLeiDer implementa múltiplas camadas de segurança para proteger dados sensíveis (senhas, emails, dados de produção) e garantir conformidade com a LGPD.

### Autenticação JWT (Stateless)

**Algoritmo:** HS256 (HMAC-SHA256)  
**Expiração:** 24 horas  
**Secret:** Armazenado em variável de ambiente `JWT_SECRET`

**Estrutura do Token:**

```typescript
// Payload (não criptografado, apenas assinado)
{
  "sub": 42,                      // userId (subject)
  "email": "produtor@example.com",
  "associationId": 1,             // null se não vinculado
  "iat": 1700000000,              // issued at (timestamp)
  "exp": 1700086400               // expires (24h após iat)
}

// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Signature (HMAC-SHA256)
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

**Exemplo de Código (Geração):**

```typescript
// src/auth/auth.service.ts
@Injectable()
export class AuthService {
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      associationId: user.associationId,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: "24h",
        algorithm: "HS256",
      }),
    };
  }
}
```

**Exemplo de Código (Validação):**

```typescript
// src/auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false; // Rejeita tokens expirados
      secretOrKey: configService.get("JWT_SECRET"),
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      associationId: payload.associationId,
    };
  }
}
```

**Características:**

- ✅ **Stateless:** Servidor não armazena sessão (escalabilidade horizontal)
- ✅ **Self-contained:** Todas informações no token (sem query ao DB)
- ❌ **Revogação:** Impossível revogar token antes de expirar (trade-off aceito)
- ⚠️ **Mitigação:** Expiração curta (24h) + blacklist opcional (Redis) para casos críticos

---

### Hashing de Senhas (bcrypt)

**Algoritmo:** bcrypt  
**Rounds:** 10-12 (configurável, projeto usa ambos dependendo do contexto)  
**Salt:** Gerado automaticamente por bcrypt

**Por que bcrypt?**

- Algoritmo adaptativo (aumenta rounds conforme hardware evolui)
- Salt único por senha (previne rainbow tables)
- Comparação em tempo constante (previne timing attacks)

**Exemplo de Código Real (Hashing - UsersService):**

```typescript
// src/application/services/users/users.service.ts
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;

    try {
      // 10 rounds = 2^10 = 1.024 iterações
      const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS_USER_CREATION);

      const user = await this.prisma.user.create({
        data: {
          ...rest,
          password: hashedPassword, // Armazena hash, nunca plaintext
        },
      });

      this.logger.log(`Usuário criado: ${user.email} (ID: ${user.id})`);

      // Remove senha do retorno por segurança
      return this.removePassword(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException("Email já está em uso.");
        }
      }
      throw error;
    }
  }

  /**
   * Remove o campo password do objeto retornado (se existir), para evitar vazamento.
   */
  private removePassword<T extends Record<string, unknown>>(entity: T): T {
    if (entity && "password" in entity) {
      delete (entity as { password?: string }).password;
    }
    return entity;
  }
}
```

**Exemplo de Código Real (Validação - AuthService):**

```typescript
// src/auth/auth.service.ts
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    // Comparação em tempo constante (previne timing attacks)
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user; // Remove senha do retorno
      return result;
    }

    throw new UnauthorizedException("Credenciais inválidas.");
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      associationId: user.associationId,
    };

    this.logger.log(`Usuário autenticado: ${user.email}`);

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

**Exemplo de Código Real (Reset de Senha - 12 rounds):**

```typescript
// src/auth/auth.service.ts
async resetPassword(
  email: string,
  token: string,
  newPassword: string,
): Promise<boolean> {
  await this.validateResetToken(email, token);

  const user = await this.prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new NotFoundException('Usuário não encontrado.');
  }

  // 12 rounds para reset de senha (mais seguro)
  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS_RESET_PASSWORD);

  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,           // Invalida token após uso
      resetTokenExpiry: null,
    },
  });

  this.logger.log(`Senha redefinida para ${email}`);

  return true;
}
```

**Diferença entre 10 e 12 rounds:**

| Rounds | Iterações | Tempo de Hash | Uso no Projeto                              |
| ------ | --------- | ------------- | ------------------------------------------- |
| 10     | 1.024     | ~100ms        | Criação de usuário (UsersService)           |
| 12     | 4.096     | ~200ms        | Reset de senha (AuthService) - mais crítico |

**Impacto de Performance:**

- **Tempo de hashing (10 rounds):** ~100ms
- **Tempo de hashing (12 rounds):** ~200ms (intencional para dificultar brute-force)
- **Tempo de login:** ~100-200ms (aceitável para segurança)
- **Trade-off:** Segurança > Performance

**Características de Segurança:**

- ✅ **Salt único:** Cada senha tem salt diferente (gerado automaticamente)
- ✅ **Tempo constante:** `bcrypt.compare()` não vaza informações via timing
- ✅ **Custo adaptativo:** Pode aumentar rounds no futuro sem quebrar hashes antigos
- ✅ **Resistente a GPU:** bcrypt usa muita memória (dificulta ataques com GPU)

---

### Centralização de Constantes de Segurança

Para evitar "números mágicos" espalhados pelo código e facilitar manutenção, todas as constantes de segurança foram centralizadas em um arquivo único.

**Arquivo de Constantes:**

```typescript
// src/common/constants/security.constants.ts

export const BCRYPT_ROUNDS_USER_CREATION = 10;
export const BCRYPT_ROUNDS_RESET_PASSWORD = 12;
export const RESET_TOKEN_MIN_VALUE = 100000;
export const RESET_TOKEN_MAX_VALUE = 900000;
export const RESET_TOKEN_EXPIRY_MINUTES = 15;
```

**Benefícios da Centralização:**

| Benefício                  | Descrição                                                               |
| -------------------------- | ----------------------------------------------------------------------- |
| **Single Source of Truth** | Todas constantes em um único arquivo                                    |
| **Documentação Clara**     | JSDoc explica propósito e uso de cada constante                         |
| **Manutenção Fácil**       | Alterar rounds em 1 lugar afeta todo o projeto                          |
| **Consistência**           | User e Association usam mesma constante (10 rounds)                     |
| **Rastreabilidade**        | Comentários indicam onde cada constante é usada                         |
| **Semântica**              | Nomes descritivos evitam confusão (`USER_CREATION` vs `RESET_PASSWORD`) |

**Tabela de Uso:**

| Constante                      | Valor  | Usado Em                                           |
| ------------------------------ | ------ | -------------------------------------------------- |
| `BCRYPT_ROUNDS_USER_CREATION`  | 10     | UsersService, AssociationsService                  |
| `BCRYPT_ROUNDS_RESET_PASSWORD` | 12     | AuthService.resetPassword()                        |
| `RESET_TOKEN_MIN_VALUE`        | 100000 | AuthService.forgotPassword()                       |
| `RESET_TOKEN_MAX_VALUE`        | 900000 | AuthService.forgotPassword()                       |
| `RESET_TOKEN_EXPIRY_MINUTES`   | 15     | AuthService.forgotPassword(), validateResetToken() |

---

### Validação de Entrada (class-validator)

Todas as entradas HTTP são validadas na **borda do sistema** (Controllers) via DTOs com decorators do `class-validator`.

**Código Real (CreateUserDto):**

```typescript
// backend/src/application/dtos/users/create-user.dto.ts
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  Length,
  Matches,
} from "class-validator";
import { Transform } from "class-transformer";
import { UserCategory, UserType } from "@/domain/enums/enums";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
  @ApiProperty({ description: "Nome do usuário", example: "Silva Santos" })
  @IsNotEmpty({ message: "O nome não pode ser vazio." })
  @IsString({ message: "O nome deve ser uma string." })
  @Length(3, 255, { message: "O nome deve ter entre 3 e 255 caracteres." })
  name!: string;

  @ApiProperty({
    description: "Email do usuário",
    example: "silva.santos@example.com",
  })
  @IsNotEmpty({ message: "O email não pode ser vazio." })
  @IsEmail({}, { message: "O email fornecido não é válido." })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @ApiProperty({ description: "Senha do usuário", example: "Leite@123" })
  @IsNotEmpty({ message: "A senha não pode ser vazia." })
  @IsString()
  @MinLength(8, { message: "A senha deve ter no mínimo 8 caracteres." })
  // Força a senha a ter: 1 letra minúscula, 1 maiúscula, 1 número e 1 caractere especial
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        "A senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial (@$!%*?&).",
    }
  )
  password!: string;

  @ApiProperty({
    description: "Tipo de usuário",
    enum: UserType,
    example: UserType.Pecuarista,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserType, {
    message: "O tipo de usuário (userType) fornecido não é válido.",
  })
  userType?: UserType;

  @ApiProperty({
    description: "Pessoa física ou jurídica",
    enum: UserCategory,
    example: UserCategory.Fisica,
  })
  @IsNotEmpty({ message: "A categoria do usuário é obrigatória." })
  @IsEnum(UserCategory, {
    message: "A categoria de usuário fornecida não é válida.",
  })
  userCategory!: UserCategory;

  @ApiProperty({
    description: "CPF ou CNPJ do usuário",
    example: "12345678000190",
    required: false,
  })
  @IsOptional()
  @IsString({ message: "O documento deve ser uma string." })
  document?: string;

  @ApiProperty({ description: "Estado do usuário (UF)", example: "PE" })
  @IsNotEmpty({ message: "O estado não pode ser vazio." })
  @Length(2, 2, {
    message: "O estado deve ser uma sigla de 2 caracteres (UF).",
  })
  @Transform(({ value }) => value?.toUpperCase().trim())
  state!: string;

  @ApiProperty({ description: "Cidade do usuário", example: "Belo Jardim" })
  @IsNotEmpty({ message: "A cidade não pode ser vazia." })
  @IsString()
  city!: string;
}
```

**Configuração nos Controllers:**

```typescript
// backend/src/presentation/controllers/animals.controller.ts
import { ValidationPipe } from "@nestjs/common";

@Controller("animals")
export class AnimalsController {
  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async create(@Body() createAnimalDto: CreateAnimalDto) {
    return this.animalsService.create(createAnimalDto);
  }
}
```

**Nota:** O projeto usa `ValidationPipe` em nível de controller com `transform: true` para converter tipos automaticamente.

**Benefícios:**

- ✅ Valida antes de chegar ao Service (fail-fast)
- ✅ Previne SQL Injection, XSS, buffer overflow
- ✅ Mensagens de erro padronizadas
- ✅ Documentação automática (Swagger lê decorators)

**Exemplo de Resposta de Erro (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": [
    "Email inválido",
    "Senha deve ter no mínimo 8 caracteres",
    "Senha deve conter pelo menos 1 letra maiúscula e 1 número"
  ],
  "error": "Bad Request"
}
```

---

### Proteção Contra Ataques

#### **1. SQL Injection**

**Proteção:** Prisma ORM com **prepared statements** automáticos

```typescript
// VULNERÁVEL (SQL raw com concatenação)
const email = req.body.email; // "admin@example.com' OR '1'='1"
const query = `SELECT * FROM users WHERE email = '${email}'`; // SQL Injection!

// SEGURO (Prisma com parameterização automática)
const user = await prisma.user.findUnique({
  where: { email: dto.email }, // Prisma escapa automaticamente
});

// SQL gerado:
// SELECT * FROM "User" WHERE "email" = $1
// Parâmetros: ['admin@example.com\' OR \'1\'=\'1']
```

#### **2. XSS (Cross-Site Scripting)**

**Proteção:** DTOs com `class-validator` + sanitização automática

```typescript
// Payload malicioso
const maliciousInput = '<script>alert("XSS")</script>';

// DTO rejeita HTML tags via @IsString + whitelist
@IsString()
@IsNotEmpty()
name: string; // Aceita apenas strings seguras

// class-transformer sanitiza automaticamente
// Resultado armazenado: "&lt;script&gt;alert(\"XSS\")&lt;/script&gt;"
```

#### **3. CSRF (Cross-Site Request Forgery)**

**Proteção:** CORS restritivo + SameSite cookies (futuro)

```typescript
// src/main.ts
app.enableCors({
  origin: ["https://qualeider.com", "http://localhost:3001"], // Whitelist
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
});
```

#### **4. Brute-Force Login**

**Proteção Atual:** bcrypt (12 rounds) torna brute-force lento  
**TODO:** Implementar rate limiting com `@nestjs/throttler`

```typescript
// TODO: Implementar
@ThrottlerGuard()
@Post('login')
async login(@Body() dto: LoginDto) {
  // Limite: 5 tentativas por minuto por IP
}
```

---

### Headers de Segurança

**Implementado:** Helmet e remoção do header X-Powered-By

O projeto agora usa Helmet para aplicar headers de segurança e o servidor foi configurado para não expor a tecnologia usada (removido `X-Powered-By`).

```typescript
// backend/src/presentation/main.ts
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          // Swagger precisa de 'unsafe-inline' e 'unsafe-eval' para funcionar corretamente
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }),
  );
}
```

Headers aplicados:

- `Strict-Transport-Security`: Força HTTPS  
- `X-Content-Type-Options: nosniff`: Previne MIME sniffing  
- `X-Frame-Options: DENY`: Previne clickjacking  
- `Content-Security-Policy`: Restringe recursos carregados  

### Conformidade LGPD

**Lei 13.709/2018 - Lei Geral de Proteção de Dados**

#### **1. Dados Sensíveis Armazenados**

| Dado         | Categoria | Proteção                      |
| ------------ | --------- | ----------------------------- |
| Email        | PII       | Criptografia em repouso (TDE) |
| Senha        | Sensível  | bcrypt 12 rounds              |
| Nome         | PII       | Criptografia em repouso       |
| CPF (futuro) | Sensível  | Mascaramento em logs          |

#### **2. Sanitização de Logs**

**⚠️ TODO:** Implementar logger customizado com sanitização

**Atualmente:** O projeto usa o Logger padrão do NestJS sem sanitização automática.

**Recomendação futura:**

```typescript
// src/common/logger.service.ts (NÃO IMPLEMENTADO)
@Injectable()
export class LoggerService {
  log(message: string, context?: any) {
    const sanitizedContext = this.sanitize(context);
    console.log(
      JSON.stringify({
        timestamp: new Date().toISOString(),
        message,
        context: sanitizedContext,
      })
    );
  }

  private sanitize(data: any): any {
    const sensitiveFields = ["password", "resetPasswordToken", "access_token"];
    // ... implementação de sanitização
  }
}
```

#### **3. Direito ao Esquecimento**

**Implementação:** Soft delete + anonimização

```typescript
// src/users/users.service.ts
async softDelete(userId: number) {
  return this.prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted_${userId}@qualeider.com`,
      name: 'Usuário Deletado',
      password: crypto.randomBytes(32).toString('hex'),
      resetPasswordToken: null,
      isActive: false,
    },
  });
}
```

---

## 8.3 Segurança e Proteção {#seguranca_protecao}

O QuaLeiDer implementa múltiplas camadas de segurança para proteger dados sensíveis (senhas, emails, dados de produção) e garantir conformidade com a LGPD.

### Autenticação JWT (Stateless)

**Algoritmo:** HS256 (HMAC-SHA256)  
**Expiração:** 24 horas  
**Secret:** Armazenado em variável de ambiente `JWT_SECRET`

**Estrutura do Token:**

```typescript
// Payload (não criptografado, apenas assinado)
{
  "sub": 42,                      // userId (subject)
  "email": "produtor@example.com",
  "associationId": 1,             // null se não vinculado
  "iat": 1700000000,              // issued at (timestamp)
  "exp": 1700086400               // expires (24h após iat)
}

// Header
{
  "alg": "HS256",
  "typ": "JWT"
}

// Signature (HMAC-SHA256)
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

**Exemplo de Código (Geração):**

```typescript
// src/auth/auth.service.ts
@Injectable()
export class AuthService {
  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

    const payload = {
      sub: user.id,
      email: user.email,
      associationId: user.associationId,
    };

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: "24h",
        algorithm: "HS256",
      }),
    };
  }
}
```

**Exemplo de Código (Validação):**

```typescript
// src/auth/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false; // Rejeita tokens expirados
      secretOrKey: configService.get("JWT_SECRET"),
    });
  }

  async validate(payload: any) {
    return {
      userId: payload.sub,
      email: payload.email,
      associationId: payload.associationId,
    };
  }
}
```

**Características:**

- ✅ **Stateless:** Servidor não armazena sessão (escalabilidade horizontal)
- ✅ **Self-contained:** Todas informações no token (sem query ao DB)
- ❌ **Revogação:** Impossível revogar token antes de expirar (logout instantâneo impossível)
- ⚠️ **Mitigação:** Expiração curta (24h) + blacklist opcional para casos críticos

---

### Hashing de Senhas (bcrypt)

**Algoritmo:** bcrypt  
**Rounds:** 10-12 (configurável, projeto usa ambos dependendo do contexto)  
**Salt:** Gerado automaticamente por bcrypt

**Por que bcrypt?**

- Algoritmo adaptativo (aumenta rounds conforme hardware evolui)
- Salt único por senha (previne rainbow tables)
- Comparação em tempo constante (previne timing attacks)

**Exemplo de Código Real (Hashing - UsersService):**

```typescript
// src/application/services/users/users.service.ts
import * as bcrypt from "bcryptjs";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async create(createUserDto: CreateUserDto) {
    const { password, ...rest } = createUserDto;

    try {
      // 10 rounds = 2^10 = 1.024 iterações
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          ...rest,
          password: hashedPassword, // Armazena hash, nunca plaintext
        },
      });

      this.logger.log(`Usuário criado: ${user.email} (ID: ${user.id})`);

      // Remove senha do retorno por segurança
      return this.removePassword(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException("Email já está em uso.");
        }
      }
      throw error;
    }
  }

  /**
   * Remove o campo password do objeto retornado (se existir), para evitar vazamento.
   */
  private removePassword<T extends Record<string, unknown>>(entity: T): T {
    if (entity && "password" in entity) {
      delete (entity as { password?: string }).password;
    }
    return entity;
  }
}
```

**Exemplo de Código Real (Validação - AuthService):**

```typescript
// src/auth/auth.service.ts
import * as bcrypt from "bcryptjs";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);

    // Comparação em tempo constante (previne timing attacks)
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user; // Remove senha do retorno
      return result;
    }

    throw new UnauthorizedException("Credenciais inválidas.");
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      associationId: user.associationId,
    };

    this.logger.log(`Usuário autenticado: ${user.email}`);

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
```

**Exemplo de Código Real (Reset de Senha - 12 rounds):**

```typescript
// src/auth/auth.service.ts
async resetPassword(
  email: string,
  token: string,
  newPassword: string,
): Promise<boolean> {
  await this.validateResetToken(email, token);

  const user = await this.prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new NotFoundException('Usuário não encontrado.');
  }

  // 12 rounds para reset de senha (mais seguro)
  const hashedPassword = await bcrypt.hash(newPassword, 12);

  await this.prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetToken: null,           // Invalida token após uso
      resetTokenExpiry: null,
    },
  });

  this.logger.log(`Senha redefinida para ${email}`);

  return true;
}
```

**Diferença entre 10 e 12 rounds:**

| Rounds | Iterações | Tempo de Hash | Uso no Projeto                              |
| ------ | --------- | ------------- | ------------------------------------------- |
| 10     | 1.024     | ~100ms        | Criação de usuário (UsersService)           |
| 12     | 4.096     | ~200ms        | Reset de senha (AuthService) - mais crítico |

**Impacto de Performance:**

- **Tempo de hashing (10 rounds):** ~100ms
- **Tempo de hashing (12 rounds):** ~200ms (intencional para dificultar brute-force)
- **Tempo de login:** ~100-200ms (aceitável para segurança)
- **Trade-off:** Segurança > Performance

**Características de Segurança:**

- ✅ **Salt único:** Cada senha tem salt diferente (gerado automaticamente)
- ✅ **Tempo constante:** `bcrypt.compare()` não vaza informações via timing
- ✅ **Custo adaptativo:** Pode aumentar rounds no futuro sem quebrar hashes antigos
- ✅ **Resistente a GPU:** bcrypt usa muita memória (dificulta ataques com GPU)

---

### Centralização de Constantes de Segurança

Para evitar "números mágicos" espalhados pelo código e facilitar manutenção, todas as constantes de segurança foram centralizadas em um arquivo único.

**Arquivo de Constantes:**

```typescript
// src/common/constants/security.constants.ts

export const BCRYPT_ROUNDS_USER_CREATION = 10;
export const BCRYPT_ROUNDS_RESET_PASSWORD = 12;
export const RESET_TOKEN_MIN_VALUE = 100000;
export const RESET_TOKEN_MAX_VALUE = 900000;
export const RESET_TOKEN_EXPIRY_MINUTES = 15;
```

**Benefícios da Centralização:**

| Benefício                  | Descrição                                                               |
| -------------------------- | ----------------------------------------------------------------------- |
| **Single Source of Truth** | Todas constantes em um único arquivo                                    |
| **Documentação Clara**     | JSDoc explica propósito e uso de cada constante                         |
| **Manutenção Fácil**       | Alterar rounds em 1 lugar afeta todo o projeto                          |
| **Consistência**           | User e Association usam mesma constante (10 rounds)                     |
| **Rastreabilidade**        | Comentários indicam onde cada constante é usada                         |
| **Semântica**              | Nomes descritivos evitam confusão (`USER_CREATION` vs `RESET_PASSWORD`) |

**Tabela de Uso:**

| Constante                      | Valor  | Usado Em                                           |
| ------------------------------ | ------ | -------------------------------------------------- |
| `BCRYPT_ROUNDS_USER_CREATION`  | 10     | UsersService, AssociationsService                  |
| `BCRYPT_ROUNDS_RESET_PASSWORD` | 12     | AuthService.resetPassword()                        |
| `RESET_TOKEN_MIN_VALUE`        | 100000 | AuthService.forgotPassword()                       |
| `RESET_TOKEN_MAX_VALUE`        | 900000 | AuthService.forgotPassword()                       |
| `RESET_TOKEN_EXPIRY_MINUTES`   | 15     | AuthService.forgotPassword(), validateResetToken() |

---

## 8.4 Logging e Monitoramento {#logging_monitoramento}

O sistema de logging estruturado facilita debugging, auditoria e monitoramento de processos críticos (CRON jobs, emails, autenticação).

### Níveis de Log

| Nível   | Quando Usar                         | Exemplo                                   |
| ------- | ----------------------------------- | ----------------------------------------- |
| `error` | Falhas críticas                     | Database down, erro não tratado           |
| `warn`  | Situações anormais não críticas     | Retry de email, token expirado            |
| `log`   | Eventos importantes                 | Autenticação bem-sucedida, convite criado |
| `debug` | Informações detalhadas (apenas dev) | Payload de requisição, query SQL gerada   |

### Logs Estruturados (JSON)

**⚠️ TODO:** Implementar logger estruturado (JSON) customizado

**Atualmente:** O projeto usa `Logger` do NestJS com formato padrão de texto.

**Logs atuais (exemplo real):**

```typescript
// backend/src/listener/invite-email.listener.ts
this.logger.log(`Enviando email de convite para ${event.userEmail}...`);
this.logger.error(
  `❌ Erro ao enviar email de convite para ${event.userEmail}:`,
  error
);
```

**Formato de saída atual:** Texto simples do NestJS Logger

**Recomendação futura:** Implementar logs em formato JSON estruturado para facilitar parsing e análise.

---

### Sanitização de Dados Sensíveis (LGPD)

**⚠️ TODO:** Implementar middleware de sanitização de logs

Logs **nunca** devem conter:

- Senhas (plaintext ou hash)
- Tokens completos (JWT, reset password)
- CPF completo (apenas primeiros 3 e últimos 2 dígitos)
- Dados de pagamento (cartão de crédito)

**Recomendação futura:** Implementar interceptor para sanitizar dados sensíveis antes de logar.

---

### Monitoramento de Processos Críticos

#### **1. CRON Job de Limpeza de Convites**

```typescript
// backend/src/application/services/invites/invites-cleanup.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "@/infrastructure/prisma/prisma.service";
import { InviteStatus } from "@/application/enums/invite-status.enum";

@Injectable()
export class InvitesCleanupService {
  private readonly logger = new Logger(InvitesCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Roda todos os dias à meia-noite
   * Marca convites pendentes expirados como EXPIRED
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async expireOldInvites() {
    this.logger.log("Iniciando verificação de convites expirados...");

    const result = await this.prisma.invite.updateMany({
      where: {
        status: InviteStatus.PENDING,
        expiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: InviteStatus.EXPIRED,
      },
    });

    this.logger.log(
      `✅ ${result.count} convite(s) marcado(s) como expirado(s)`
    );

    return {
      success: true,
      expiredCount: result.count,
      timestamp: new Date(),
    };
  }
}
```

#### **2. Retry de Emails**

Ver implementação real na seção **Tratamento de Erros Assíncronos** (EmailListener com MAX_RETRIES = 3).

---

### TODO: Observabilidade com Prometheus + Grafana

**Roadmap v1.1 (3 meses):**

```typescript
// Métricas a coletar:
- Taxa de sucesso de login (%)
- Tempo médio de resposta de API (ms)
- Número de convites criados/aceitos/rejeitados (count)
- Número de coletas registradas por dia (count)
- Taxa de erro de envio de emails (%)
- Uso de memória/CPU do container (%)

// Ferramentas:
- Prometheus: Coleta de métricas
- Grafana: Visualização de dashboards
- @willsoto/nestjs-prometheus: Integração NestJS
```

---

## 8.5 Tratamento de Erros {#tratamento_erros}

O tratamento de erros no QuaLeiDer segue uma abordagem **fail-fast** e **centralizada**, garantindo mensagens consistentes e logs estruturados.

### Filtros Globais de Exceção

O projeto atualmente implementa apenas o `PrismaExceptionFilter` para capturar erros de banco de dados. Erros HTTP genéricos são tratados pelo comportamento padrão do NestJS.

**Registro Global (main.ts):**

```typescript
// backend/src/presentation/main.ts
import { PrismaExceptionFilter } from "@/common/filters/prisma-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Configurar CORS
  const corsOptions = configureCors(configService);
  app.enableCors(corsOptions);

  // Configurar filtros globais
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Configurar Swagger
  setupSwagger(app);

  // Iniciar o servidor
  const port = getAppPort(configService);
  await app.listen(port);
}
```

**⚠️ TODO:** Implementar `HttpExceptionFilter` para padronizar respostas de erro HTTP (401, 403, 404, etc.) com logs estruturados.

---

### Códigos HTTP Padronizados

| Código | Nome                  | Quando Usar                           | Exemplo                               |
| ------ | --------------------- | ------------------------------------- | ------------------------------------- |
| 200    | OK                    | Operação bem-sucedida (GET, PUT)      | `GET /users/1` retorna usuário        |
| 201    | Created               | Recurso criado (POST)                 | `POST /invites` cria convite          |
| 204    | No Content            | Exclusão bem-sucedida (DELETE)        | `DELETE /animals/1` deleta animal     |
| 400    | Bad Request           | Validação de DTO falhou               | Email inválido, senha curta           |
| 401    | Unauthorized          | Token JWT inválido/expirado           | `Authorization: Bearer invalid_token` |
| 403    | Forbidden             | Usuário sem permissão                 | Produtor tenta criar associação       |
| 404    | Not Found             | Recurso inexistente                   | `GET /users/999` (usuário não existe) |
| 409    | Conflict              | Recurso duplicado (unique constraint) | Email já cadastrado                   |
| 500    | Internal Server Error | Erro não tratado                      | Database connection failed            |

---

### Tratamento de Erros do Prisma

Prisma ORM retorna códigos de erro específicos (PXX) que são traduzidos para HTTP.

**Código Real (PrismaExceptionFilter):**

```typescript
// backend/src/common/filters/prisma-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

@Catch(PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Erro interno de banco de dados";

    switch (exception.code) {
      case "P2002":
        status = HttpStatus.CONFLICT;
        message = this.handleUniqueConstraintViolation(exception);
        break;

      case "P2025":
        status = HttpStatus.NOT_FOUND;
        message = "Registro não encontrado";
        break;

      case "P2003":
        status = HttpStatus.BAD_REQUEST;
        message = "Violação de chave estrangeira";
        break;

      case "P2014":
        status = HttpStatus.BAD_REQUEST;
        message = "A operação viola uma relação necessária";
        break;

      default:
        this.logger.error(
          `[Prisma Error ${exception.code}] ${exception.message}`,
          exception.stack
        );
        break;
    }

    this.logger.warn(
      `Prisma Error [${exception.code}] on ${request.method} ${request.url}: ${message}`
    );

    response.status(status).json({
      statusCode: status,
      message,
      error: this.getErrorName(status),
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private handleUniqueConstraintViolation(
    exception: PrismaClientKnownRequestError
  ): string {
    const meta = exception.meta as { target?: string[] };
    const fields = meta?.target?.join(", ") || "campo";
    return `Já existe um registro com este ${fields}`;
  }

  private getErrorName(status: number): string {
    switch (status) {
      case HttpStatus.NOT_FOUND:
        return "Not Found";
      case HttpStatus.CONFLICT:
        return "Conflict";
      case HttpStatus.BAD_REQUEST:
        return "Bad Request";
      default:
        return "Internal Server Error";
    }
  }
}
```

**Mapeamento de Erros do Prisma:**

| Código Prisma | HTTP Status | Significado                 | Exemplo                                       |
| ------------- | ----------- | --------------------------- | --------------------------------------------- |
| P2002         | 409         | Unique constraint violation | Email já existe                               |
| P2025         | 404         | Record not found            | `findUniqueOrThrow` não encontrou registro    |
| P2003         | 400         | Foreign key constraint      | `userId` inválido em `DailyCollection`        |
| P2014         | 400         | Invalid relation            | Tentar associar `Animal` a `User` inexistente |
| P1001         | 500         | Can't reach database        | PostgreSQL offline                            |

---

### Mensagens de Erro Amigáveis

**⚠️ TODO:** Implementar custom exceptions para regras de negócio

**Atualmente:** O projeto usa exceptions padrão do NestJS (`ConflictException`, `NotFoundException`, `UnauthorizedException`, etc.).

**Recomendação futura:** Criar `BusinessException` customizada para padronizar erros de regra de negócio.

**Exemplo de uso atual:**

```typescript
// Código atual no projeto
throw new ConflictException("Email já cadastrado");
throw new NotFoundException("Usuário não encontrado");
```

---

### Tratamento de Erros Assíncronos

**Código Real (InviteEmailListener):**

```typescript
// backend/src/listener/invite-email.listener.ts
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { MailService } from "@/mail/mail.service";
import { InviteCreatedEvent } from "@/events/invite-created.event";

@Injectable()
export class InviteEmailListener {
  private readonly logger = new Logger(InviteEmailListener.name);

  constructor(
    private readonly mailService: MailService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Quando convite é criado, envia email para o usuário convidado
   */
  @OnEvent("invite.created")
  async handleInviteCreated(event: InviteCreatedEvent) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const acceptUrl = `${frontendUrl}/invites/${event.token}?action=accept`;
    const declineUrl = `${frontendUrl}/invites/${event.token}?action=decline`;

    try {
      this.logger.log(`Enviando email de convite para ${event.userEmail}...`);

      await this.mailService.sendInviteEmail(
        event.userEmail,
        event.userName,
        event.associationName,
        event.message,
        acceptUrl,
        declineUrl,
        event.expiresAt
      );

      this.logger.log(
        `Email de convite enviado com sucesso para ${event.userEmail}`
      );
    } catch (error) {
      this.logger.error(
        `❌ Erro ao enviar email de convite para ${event.userEmail}:`,
        error
      );
      // NÃO propaga erro (falha no email não deve quebrar criação de convite)
    }
  }
}
```

**Código Real (EmailListener com retry):**

```typescript
// backend/src/listener/email.listener.ts
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

const MAX_RETRIES = 3;
const DELAY_MS = 2000;

@Injectable()
export class EmailListener {
  private readonly logger = new Logger(EmailListener.name);

  @OnEvent("notification.send")
  async handleNotificationSend(payload: NotificationSendPayload) {
    await this.safeSendEmail(payload, 1);
  }

  private async safeSendEmail(
    payload: NotificationSendPayload,
    attempt: number
  ) {
    try {
      this.logger.log(
        `Tentativa ${attempt} de enviar email para ${payload.to}...`
      );

      await this.mailService.sendNotificationEmail(
        payload.to,
        payload.subject,
        payload.message,
        payload.userName,
        payload.metadata
      );

      this.logger.log(
        `Email enviado com sucesso para ${payload.to} na tentativa ${attempt}.`
      );
    } catch (error) {
      this.logger.error(
        `Erro na Tentativa ${attempt} para ${payload.to}:`,
        error
      );

      if (attempt < MAX_RETRIES) {
        const delayTime = DELAY_MS * attempt; // 2s, 4s, 6s
        this.logger.log(
          `Aguardando ${delayTime}ms antes da próxima tentativa...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayTime));

        await this.safeSendEmail(payload, attempt + 1);
      } else {
        this.logger.error(
          `Falha final ao enviar email para ${payload.to} após ${MAX_RETRIES} tentativas.`
        );
        // TODO: Implementar DLQ (Dead Letter Queue)
      }
    }
  }
}
```

---

### Validação em Camadas

**Estratégia:** Validar dados em múltiplas camadas para garantir consistência.

![Validation layers](images/validation-layers.png)

**Exemplo de Código (Validação em Camadas):**

```typescript
// Camada 1: DTO (formato)
export class CreateDailyCollectionDto {
  @IsNumber()
  userId: number;

  @IsDateString()
  date: string;

  @IsPositive()
  quantity: number; // > 0
}


async create(dto: CreateDailyCollectionDto) {
  const user = await this.usersService.findOne(dto.userId);

  if (!user.associationId) {
    throw new BusinessException('Produtor não vinculado');
  }

  if (new Date(dto.date) > new Date()) {
    throw new BusinessException('Data não pode ser futura');
  }

  return this.prisma.dailyCollection.create({ data: dto });
}

// Camada 3: Database (constraints)
// @@unique([userId, date]) no schema Prisma
// Prisma lança P2002 se tentar criar 2 coletas no mesmo dia
```

---

# Decisões Arquiteturais

## DA-001: Adoção de Jest como Framework de Testes Único

**Contexto:**

- Necessidade de framework de testes para unitários e E2E
- NestJS recomenda Jest como padrão
- Alternativas: Mocha, Vitest, AVA

**Decisão:**
Adotar Jest como framework único para testes unitários e E2E, com Supertest para testes de API HTTP.

**Consequências:**

- ✅ **Positivas:**
  - Ecossistema consistente com NestJS
  - Suporte nativo a mocking e coverage
  - Documentação abundante e comunidade ativa
  - Execução paralela de testes
  - Configuração unificada (jest.config.ts)
- ⚠️ **Negativas:**
  - Performance inferior ao Vitest
  - Configuração de path aliases pode ser complexa para bibliotecas sem @types (Padrão que já foi adotado antes)

## DA-002: Testes E2E com Database Real

**Contexto:**

- Testes E2E precisam validar integração completa
- Opções: database real, in-memory (SQLite), mocks completos
- Prisma ORM utilizado no projeto

**Decisão:**
Utilizar PostgreSQL real em testes E2E com setup/teardown automático para isolamento. (MIGRAR DEPOIS)

**Consequências:**

- ✅ **Positivas:**
  - Valida queries reais (sem discrepância SQLite vs PostgreSQL)
  - Detecta problemas de migração e constraints
  - Testes mais confiáveis (produção-like)
  - Sem necessidade de mocks complexos
- ⚠️ **Negativas:**
  - Testes E2E mais lentos (90s total)
  - Requer PostgreSQL instalado localmente
  - Setup/teardown adiciona complexidade

## DA-003: Factories Pattern para Dados de Teste

**Contexto:**

- Necessidade de gerar dados válidos nos testes
- Repetição de código ao criar objetos de teste
- DTOs com muitos campos obrigatórios

**Decisão:**
Implementar Test Factories para todos os DTOs principais (User, Animal, DailyCollection, Invite, Association).

**Consequências:**

- ✅ **Positivas:**
  - Reduz duplicação de código nos testes
  - Facilita manutenção quando DTOs mudam
  - Testes mais legíveis e focados
  - Dados válidos por padrão
- ⚠️ **Negativas:**
  - Código adicional a manter (factories/)
  - Necessidade do desenvolvedor conhecer o conceito de factory

## DA-004: Nomenclatura de Testes em Português

**Contexto:**

- Equipe brasileira com diferentes níveis de inglês
- Testes devem funcionar como documentação
- Padrão "should..." vs "deve..."

**Decisão:**
Todos os testes (unitários e E2E) devem ser escritos em português seguindo padrão "deve...".

**Consequências:**

- ✅ **Positivas:**
  - Testes funcionam como documentação viva em português
  - Facilita compreensão por desenvolvedores brasileiros
  - Mensagens de erro mais claras
  - Alinhamento com comentários de código em português
- ⚠️ **Negativas:**
  - Mistura de idiomas (código em inglês, testes em português)

## DA-005: Cobertura Mínima de 80%

**Status:** Aceita

**Contexto:**

- Necessidade de garantir qualidade do código
- Balance entre cobertura e produtividade
- Diferentes níveis de criticidade por camada

**Decisão:**
Estabelecer meta de cobertura mínima de 80% geral, com 90%+ para camadas críticas (Application, Domain).

**Consequências:**

- ✅ **Positivas:**
  - Código crítico bem testado
  - Reduz bugs em produção
  - Facilita refatoração com confiança
  - CI/CD bloqueia deploys com cobertura baixa
- ⚠️ **Negativas:**
  - Pode incentivar testes sem valor (coverage gaming)
  - Tempo adicional de desenvolvimento
  - Cobertura não garante qualidade

**Métricas Atuais:**

- Cobertura Geral: 96.25% ✅
- Application Services: 95%+ ✅
- Domain Entities: 100% ✅
- Presentation Controllers: 97% ✅

## DA-006: Git Hooks para Validação Local de Testes

**Status:** Aceito  
**Data:** 2025-11-15  
**Decisores:** Equipe de desenvolvimento

**Contexto:**

Após implementar cobertura de 96.25% e 582 testes (472 unitários + 110 E2E), identificamos que código não testado ainda chegava ao repositório remoto. Desenvolvedores esqueciam de rodar testes localmente antes de fazer push, causando:

- Falhas no CI/CD (GitHub Actions) detectadas tardiamente
- Tempo desperdiçado em ciclos de "push → falha → fix → push novamente"
- Risco de código quebrado chegar ao branch principal
- Feedback lento (minutos no CI vs segundos localmente)

**Alternativas Consideradas:**

1. **Apenas CI/CD (GitHub Actions):**

   - ✅ Validação garantida no servidor
   - ❌ Feedback tardio (após push)
   - ❌ Desperdiça recursos de CI/CD
   - ❌ Fluxo de trabalho ineficiente

2. **Pre-commit Framework (Python):**

   - ✅ Framework robusto e maduro
   - ❌ Dependência de Python em projeto Node.js
   - ❌ Configuração mais complexa
   - ❌ Curva de aprendizado para equipe

3. **Lint-staged apenas:**

   - ✅ Rápido para validações de lint
   - ❌ Limitado para execução de testes completos
   - ❌ Não valida testes E2E

4. **Husky + Git Hooks (Escolhido):**
   - ✅ Integração nativa com Node.js/npm
   - ✅ Configuração simples e declarativa
   - ✅ Suporta validação completa de testes
   - ✅ Amplamente usado em projetos NestJS
   - ⚠️ Pode ser ignorado com `--no-verify`

**Decisão:**

Implementar Git Hooks via Husky v9.1.7 com duas camadas de validação:

1. **Pre-commit:** Executa testes unitários (45s) antes de cada commit
2. **Pre-push:** Executa testes completos (2min) antes de push ao repositório

**Justificativa:**

- Feedback imediato: Falhas detectadas em segundos, não minutos
- Economia de CI/CD: Reduz execuções desnecessárias no GitHub Actions
- Melhora produtividade: Evita ciclos de push/falha/fix
- Cultura de qualidade: Reforça importância de testes
- Integração perfeita: Husky é padrão em projetos Node.js

**Consequências:**

✅ **Positivas:**

- Redução de 90% em pushes com testes falhando
- Desenvolvedores recebem feedback em 45s (vs 5min+ no CI)
- Economia de 70% nos minutos de GitHub Actions
- Impossível commitar código quebrado acidentalmente
- Reforça cultura de "código testado = código pronto"
- Documentação viva: Hooks mostram expectativas de qualidade

⚠️ **Negativas:**

- Tempo de commit aumenta em 45 segundos (antes: instantâneo)
- Tempo de push aumenta em 2 minutos (validação completa)
- Desenvolvedores podem fazer bypass com `--no-verify` (mitigado por GitHub Actions)
- Requer PostgreSQL rodando localmente para testes E2E
- Curva de aprendizado inicial (configuração de database local)

**Mitigações:**

1. GitHub Actions como segunda barreira (valida mesmo com `--no-verify`)
2. Documentação clara sobre como configurar ambiente local
3. Pre-commit valida apenas testes unitários (rápido)
4. Pre-push valida tudo (mais lento, mas menos frequente)
5. Mensagens claras nos hooks explicando o que está sendo validado

**Métricas de Sucesso:**

- ✅ 100% dos commits validados localmente
- ✅ Tempo médio de feedback: 45s (antes: 5min+)
- ✅ Redução de pushes falhando no CI: > 90%
- ✅ Taxa de adoção: 100% da equipe

# Requisitos de qualidade

## Árvore de qualidade

```
QuaLeiDer - Qualidade
├── Segurança (P1)
│   ├── Autenticação
│   ├── Autorização
│   └── Proteção de Dados
├── Manutenibilidade (P2)
│   ├── Modularidade
│   ├── Testabilidade
│   │   ├── Cobertura de Código (96.25%)
│   │   ├── Testes Unitários (472 testes)
│   │   ├── Testes E2E (110 testes)
│   │   └── Test Factories
│   └── Documentação
├── Escalabilidade (P3)
│   ├── Capacidade
│   ├── Performance
│   └── Elasticidade
├── Confiabilidade (P4)
│   ├── Disponibilidade
│   ├── Recuperação de Falhas
│   └── Monitoramento
└── Usabilidade (P5)
    ├── Eficiência do Usuário Final
    ├── Experiência do Desenvolvedor
    └── Acessibilidade
```

## Cenários de Qualidade {#\_cen_rios_de_qualidade}

### Cenário 1: Registro Rápido de Coleta (Usabilidade)

- **Fonte:** Produtor de leite com baixa experiência técnica
- **Estímulo:** Necessita registrar a coleta diária de leite pelo smartphone
- **Artefato:** Interface web responsiva de registro de coletas
- **Ambiente:** Hora do pico (07:00-09:00), rede 3G/4G instável
- **Resposta:** Sistema apresenta formulário pré-preenchido com dados do último registro
- **Medida:** Produtor completa o registro em < 45 segundos, com taxa de sucesso de 95%

### Cenário 2: Aceitação de Convite sem Ajuda (Usabilidade)

- **Fonte:** Novo produtor recebendo convite de associação pela primeira vez
- **Estímulo:** Clica no link do email de convite
- **Artefato:** Fluxo de aceitação de convite
- **Ambiente:** Dispositivo móvel, primeira interação com o sistema
- **Resposta:** Interface guiada com passos numerados (1/3, 2/3, 3/3) e confirmação visual
- **Medida:** 95% dos usuários completam o fluxo sem pedir ajuda ou abandonar

### Cenário 3: Carga de Produtores Simultâneos (Escalabilidade)

- **Fonte:** 2.000 produtores de 50 associações diferentes
- **Estímulo:** Todos registram coletas simultaneamente no horário de pico (07:00-09:00)
- **Artefato:** API de registro de coletas (`POST /daily-collections`)
- **Ambiente:** Sistema em produção com database PostgreSQL (connection pool: 20)
- **Resposta:** Sistema processa todas as requisições sem perda de dados
- **Medida:** Tempo de resposta < 300ms para 95% das requisições; 500 req/min sustentáveis

### Cenário 4: Recuperação de Falha no Envio de Email (Confiabilidade)

- **Fonte:** Serviço de email externo (ex: SendGrid) fora do ar por 30 minutos
- **Estímulo:** Sistema tenta enviar email de reset de senha durante a indisponibilidade
- **Artefato:** Módulo de envio de emails com sistema de eventos
- **Ambiente:** Ambiente de produção, serviço externo com SLA de 99.9%
- **Resposta:** Sistema registra o evento em fila e tenta reenvio automático (5, 15, 30 min)
- **Medida:** 99% dos emails são entregues dentro de 1 hora; falhas permanentes são logadas

### Cenário 5: Falha no CRON Job de Limpeza (Confiabilidade)

- **Fonte:** CRON job de limpeza de convites expirados
- **Estímulo:** Job falha por 3 dias consecutivos (ex: erro de database)
- **Artefato:** Serviço `InvitesCleanupService` com monitoramento
- **Ambiente:** Sistema em produção, database temporariamente indisponível
- **Resposta:** Sistema registra falha em log estruturado para análise posterior
- **Medida:** Falha registrada em < 5 minutos após 3ª tentativa consecutiva; convites não são deletados incorretamente

### Cenário 6: Ataque de SQL Injection (Segurança)

- **Fonte:** Atacante mal-intencionado
- **Estímulo:** Tenta injetar SQL via campo de email: `user@test.com' OR '1'='1`
- **Artefato:** Endpoint de login (`POST /auth/login`)
- **Ambiente:** Sistema em produção exposto na internet
- **Resposta:** Prisma ORM sanitiza a entrada; validação do DTO rejeita formato inválido
- **Medida:** Tentativa de injeção é bloqueada; log de segurança registra a tentativa; 0 vulnerabilidades detectadas

### Cenário 7: Token de Reset de Senha Expirado (Segurança)

- **Fonte:** Usuário recebe email de reset de senha
- **Estímulo:** Tenta usar o token após 20 minutos (limite: 15 minutos)
- **Artefato:** Endpoint de reset de senha (`POST /auth/reset-password`)
- **Ambiente:** Sistema em produção
- **Resposta:** Sistema rejeita o token expirado com mensagem clara
- **Medida:** Usuário recebe erro HTTP 400 com mensagem "Token expirado. Solicite um novo reset de senha."; novo token pode ser gerado

### Cenário 8: Visualização de Dados Agregados (Funcionalidade)

- **Fonte:** Associação com 150 produtores ativos
- **Estímulo:** Solicita relatório de produção mensal
- **Artefato:** Endpoint de relatórios (`GET /reports/monthly-production`)
- **Ambiente:** Sistema em produção com 6 meses de histórico
- **Resposta:** Sistema retorna dados agregados (total de leite, média por produtor, ranking)
- **Medida:** Resposta gerada em < 2 segundos; dados consistentes com registros individuais; formato exportável (JSON/CSV)

### Cenário 9: Alerta de Medicação Repetida (Funcionalidade)

- **Fonte:** Produtor registra medicação para um animal
- **Estímulo:** É a 3ª vez que o mesmo tipo de medicação é aplicado em 30 dias
- **Artefato:** Módulo de análise de animais (futuro)
- **Ambiente:** Sistema em produção com histórico de tratamentos
- **Resposta:** Sistema gera alerta visual no dashboard e notificação por email
- **Medida:** Alerta gerado em tempo real (< 5 segundos); taxa de falsos positivos < 5%; produtor pode marcar alerta como "revisado"

### Cenário 10: Adição de Nova Funcionalidade sem Quebrar Testes (Testabilidade)

- **Fonte:** Desenvolvedor precisa adicionar validação de CNPJ em associações
- **Estímulo:** Requisito novo de validar formato e dígitos verificadores do CNPJ
- **Artefato:** Service `AssociationsService` e DTO `CreateAssociationDto`
- **Ambiente:** Ambiente de desenvolvimento com suite de testes completa (582 testes)
- **Resposta:** Desenvolvedor adiciona validação em DTO; testes existentes continuam passando; novos testes são adicionados
- **Medida:** Testes executados em < 60s; cobertura mantida > 95%; zero regressões; implementação completa em < 2 horas

### Cenário 11: Substituição de Serviço de Email por Mock em Testes (Testabilidade)

- **Fonte:** Desenvolvedor executando testes E2E localmente
- **Estímulo:** Necessita testar fluxo de reset de senha sem enviar emails reais
- **Artefato:** Módulo `MailService` e testes E2E de autenticação
- **Ambiente:** Ambiente de desenvolvimento local sem acesso a serviço de email externo
- **Resposta:** Sistema utiliza mock de `MailService` via Dependency Injection; emails são "enviados" para array em memória
- **Medida:** Testes executam sem dependências externas; verificação de conteúdo de email via mock; 100% de isolamento

### Cenário 12: Debugging de Falha em Produção via Testes Reproduzíveis (Testabilidade)

- **Fonte:** Bug reportado em produção: convite duplicado não retorna erro 409
- **Estímulo:** Desenvolvedor precisa reproduzir o bug localmente
- **Artefato:** Teste E2E `invites-crud.e2e-spec.ts`
- **Ambiente:** Ambiente de desenvolvimento com database PostgreSQL local
- **Resposta:** Desenvolvedor adiciona teste que reproduz cenário exato do bug; teste falha conforme esperado; correção implementada; teste passa
- **Medida:** Bug reproduzido em < 10 minutos; correção validada por teste automatizado; deploy com confiança (100% dos testes passando)

# Riscos e Débitos Técnicos

## Riscos Relacionados à Testabilidade

### RT-001: Degradação da Cobertura de Testes

**Probabilidade:** Média | **Impacto:** Alto | **Prioridade:** Alta

**Descrição:**
Desenvolvedores podem adicionar novas funcionalidades sem criar testes correspondentes, reduzindo a cobertura ao longo do tempo.

**Mitigação:**

- CI/CD bloqueia merge se cobertura cair abaixo de 80%
- Code reviews obrigatórios verificam presença de testes
- Dashboard de cobertura visível para toda equipe
- Meta de 90%+ para camadas críticas (Application, Domain)

**Plano de Contingência:**

- Revisão de processo de code review
- Treinamento da equipe em boas práticas de teste

### RT-002: Testes E2E Flaky (Instáveis)

**Probabilidade:** Baixa | **Impacto:** Médio | **Prioridade:** Média

**Descrição:**
Testes E2E podem falhar intermitentemente devido a dependências de tempo, concorrência ou estado compartilhado.

**Mitigação Atual:**

- Setup/teardown limpa database entre testes
- Uso de database isolado para testes E2E
- Sem dependências de sleep/timeout fixos
- Factories garantem dados determinísticos

**Monitoramento:**

- Taxa de sucesso dos testes E2E: 100%
- Reexecução automática de testes falhados (max 1x)
- Log detalhado de falhas intermitentes

**Plano de Contingência:**

- Identificar testes flaky via histórico de CI/CD
- Desabilitar temporariamente
- Refatorar para remover não-determinismo

### RT-003: Lentidão Progressiva dos Testes

**Probabilidade:** Média | **Impacto:** Médio | **Prioridade:** Média

**Descrição:**
À medida que o sistema cresce, tempo de execução de testes pode aumentar, reduzindo velocidade de feedback.

**Métricas Atuais:**

- Testes Unitários: 50s (472 testes)
- Testes E2E: 90s (110 testes)
- Total: 140s

**Limites Estabelecidos:**

- Testes Unitários: < 60s
- Testes E2E: < 120s
- Total: < 180s

**Mitigação:**

- Execução paralela de testes (Jest workers)
- Otimização de queries em testes E2E
- Test filtering (rodar apenas testes afetados)
- Cache de módulos compilados

**Plano de Contingência:**

- Revisar testes lentos (> 5s unitários, > 10s E2E)
- Considerar splitting de suítes de teste
- Avaliar migração para Vitest se necessário

## Débitos Técnicos Relacionados à Testabilidade

### DT-001: Ausência de Testes de Carga (Load Testing)

**Prioridade:** Alta | **Esforço Estimado:** 2 semanas

**Descrição:**
Sistema não possui testes automatizados de carga para validar cenário de 2.000 produtores simultâneos.

**Impacto:**

- Impossível validar meta de escalabilidade (< 300ms com 500 req/min)
- Risco de degradação de performance em produção

**Proposta de Resolução:**

- Implementar testes com k6 ou Artillery
- Simular carga realista (pico 07:00-09:00)
- Incluir em pipeline de CI/CD (execução semanal)
- Monitorar métricas (latência p95, p99, taxa de erro)

### DT-002: Cobertura de Testes de Segurança

**Prioridade:** Média | **Esforço Estimado:** 1 semana

**Descrição:**
Não há testes automatizados específicos para validar vulnerabilidades de segurança (OWASP Top 10).

**Impacto:**

- Risco de regressões de segurança passarem despercebidas
- Validação manual é propensa a erros

**Proposta de Resolução:**

- Adicionar testes de SQL Injection (já mitigado por Prisma)
- Testes de XSS em endpoints que retornam HTML
- Validação de autenticação/autorização em todos endpoints
- Integrar SAST tool (ex: SonarQube) no pipeline

# Glossário

| Termo                         | Definição                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **AAA Pattern**               | Arrange-Act-Assert: padrão de estruturação de testes dividido em 3 etapas (preparar, executar, verificar)                             |
| **CI/CD**                     | Continuous Integration/Continuous Deployment: prática de integração e deploy contínuos com validação automatizada                     |
| **Cobertura de Código**       | Métrica que indica percentual de código executado durante testes automatizados                                                        |
| **Dependency Injection (DI)** | Padrão de design onde dependências são fornecidas externamente ao invés de criadas internamente, facilitando testes                   |
| **E2E (End-to-End)**          | Testes que validam fluxo completo do sistema, do endpoint HTTP até o banco de dados                                                   |
| **Flaky Test**                | Teste instável que falha intermitentemente sem mudanças no código, geralmente por não-determinismo                                    |
| **Mock**                      | Objeto que simula comportamento de dependência real, usado para isolar código em testes                                               |
| **Ports & Adapters**          | Padrão arquitetural (Hexagonal Architecture) que separa lógica de negócio de detalhes de infraestrutura via interfaces                |
| **Stub**                      | Tipo de test double que retorna dados pré-definidos, mais simples que mocks                                                           |
| **Test Double**               | Termo genérico para objetos que substituem dependências reais em testes (mocks, stubs, spies, fakes)                                  |
| **Test Factory**              | Padrão de criação de objetos de teste com dados válidos por padrão, reduzindo duplicação de código                                    |
| **Test Isolation**            | Princípio de que cada teste deve ser independente e não afetar outros testes                                                          |
| **Testes de Contrato**        | Testes que validam se a interface entre sistemas externos permanece compatível                                                        |
| **Testes Unitários**          | Testes que validam pequenas unidades de código (funções, métodos) de forma isolada                                                    |
| **JWT**                       | JSON Web Token: padrão de token para autenticação stateless                                                                           |
| **DTO**                       | Data Transfer Object: objeto que transporta dados entre camadas, usado para validação de entrada                                      |
| **ORM**                       | Object-Relational Mapping: framework que mapeia objetos para tabelas de banco de dados (ex: Prisma)                                   |
| **CRON Job**                  | Tarefa agendada que executa automaticamente em intervalos definidos                                                                   |
| **Clean Architecture**        | Arquitetura em camadas que separa lógica de negócio de frameworks e infraestrutura                                                    |
| **Prisma**                    | ORM TypeScript-first utilizado no projeto para acesso ao PostgreSQL                                                                   |
| **NestJS**                    | Framework Node.js para construção de aplicações server-side escaláveis                                                                |
| **Supertest**                 | Biblioteca para testes de APIs HTTP em Node.js                                                                                        |
| **Jest**                      | Framework JavaScript para testes unitários e E2E                                                                                      |
| **DRY**                       | Don't Repeat Yourself: princípio de evitar duplicação de código através de abstração e reutilização                                   |
| **SRP**                       | Single Responsibility Principle: cada classe/módulo deve ter uma única responsabilidade                                               |
| **DIP**                       | Dependency Inversion Principle: depender de abstrações (interfaces) ao invés de implementações concretas                              |
| **SOLID**                     | Conjunto de 5 princípios de design orientado a objetos (SRP, OCP, LSP, ISP, DIP)                                                      |
| **KISS**                      | Keep It Simple, Stupid: princípio de manter soluções simples e evitar complexidade desnecessária                                      |
| **YAGNI**                     | You Aren't Gonna Need It: não implementar funcionalidades até que sejam realmente necessárias                                         |
| **TDD**                       | Test-Driven Development: metodologia de desenvolver testes antes do código de produção                                                |
| **Refactoring**               | Processo de melhorar estrutura interna do código sem alterar comportamento externo                                                    |
| **Code Smell**                | Indicador de possível problema no código que merece atenção (ex: funções muito longas, duplicação)                                    |
| **Path Alias**                | Atalho de importação (ex: `@/application`) que simplifica caminhos relativos no código                                                |
| **Clean Code**                | Conjunto de práticas para escrever código legível, simples e fácil de manter                                                          |
| **Git Hooks**                 | Scripts automatizados que executam em eventos específicos do Git (commit, push, merge) para validações personalizadas                 |
| **Husky**                     | Ferramenta Node.js que facilita configuração e gerenciamento de Git Hooks em projetos JavaScript/TypeScript                           |
| **Pre-commit**                | Hook do Git que executa antes de finalizar um commit, usado para validar código antes de salvá-lo no histórico                        |
| **Pre-push**                  | Hook do Git que executa antes de enviar commits ao repositório remoto, última validação local antes do push                           |
| **--no-verify**               | Flag do Git que ignora execução de hooks configurados (bypass), deve ser usado apenas em emergências                                  |
| **Time-to-Market**            | Tempo entre a concepção de uma ideia/produto e sua disponibilização ao mercado; quanto menor, mais rápido o feedback                  |
| **Load Balancer**             | Componente que distribui tráfego entre múltiplas instâncias de uma aplicação, garantindo disponibilidade e performance                |
| **Stateless**                 | Arquitetura onde o servidor não armazena estado de sessão; cada requisição contém todas as informações necessárias                    |
| **Stateful**                  | Arquitetura onde o servidor mantém estado de sessão entre requisições (oposto de stateless)                                           |
| **Connection Pooling**        | Técnica de reutilizar conexões de banco de dados ao invés de criar novas a cada requisição, melhorando performance                    |
| **Query N+1**                 | Anti-pattern onde uma query principal gera N queries adicionais, causando problemas de performance                                    |
| **Soft Delete**               | Técnica de marcar registros como deletados (flag `deleted_at`) ao invés de removê-los fisicamente do banco                            |
| **Hard Delete**               | Remoção física de registros do banco de dados (DELETE FROM), sem possibilidade de recuperação                                         |
| **Prepared Statement**        | Query SQL pré-compilada com placeholders, prevenindo SQL injection e melhorando performance                                           |
| **SQL Injection**             | Ataque onde código SQL malicioso é inserido em inputs para manipular ou acessar banco de dados indevidamente                          |
| **XSS**                       | Cross-Site Scripting: ataque que injeta scripts maliciosos em páginas web para roubar dados ou executar ações não autorizadas         |
| **CORS**                      | Cross-Origin Resource Sharing: mecanismo de segurança que controla quais domínios podem acessar recursos da API                       |
| **ACID**                      | Atomicidade, Consistência, Isolamento, Durabilidade: propriedades que garantem confiabilidade de transações em bancos de dados        |
| **Migration**                 | Script versionado que altera schema do banco de dados de forma controlada e rastreável                                                |
| **Seed**                      | Script que popula banco de dados com dados iniciais para desenvolvimento ou testes                                                    |
| **Schema**                    | Estrutura de tabelas, colunas, índices e relacionamentos do banco de dados                                                            |
| **Foreign Key**               | Restrição que garante integridade referencial entre tabelas relacionadas no banco de dados                                            |
| **SMTP**                      | Simple Mail Transfer Protocol: protocolo para envio de emails                                                                         |
| **TLS**                       | Transport Layer Security: protocolo de criptografia para comunicação segura em redes (sucessor do SSL)                                |
| **SSL**                       | Secure Sockets Layer: protocolo antigo de criptografia, substituído pelo TLS (mas termo ainda usado)                                  |
| **MIME**                      | Multipurpose Internet Mail Extensions: padrão para formatar emails com conteúdo HTML, anexos, etc.                                    |
| **LGPD**                      | Lei Geral de Proteção de Dados (Lei 13.709/2018): legislação brasileira sobre privacidade e proteção de dados pessoais                |
| **PII**                       | Personally Identifiable Information: dados que podem identificar uma pessoa (nome, CPF, email, etc.)                                  |
| **Hash**                      | Função criptográfica que transforma dados em string fixa e irreversível, usada para armazenar senhas com segurança                    |
| **Salt**                      | Dado aleatório adicionado a senhas antes do hash para prevenir ataques com rainbow tables                                             |
| **Rainbow Table**             | Tabela pré-computada de hashes comuns usada para quebrar senhas fracas rapidamente                                                    |
| **Brute Force**               | Ataque que tenta todas as combinações possíveis para quebrar senha ou criptografia                                                    |
| **Token**                     | String única e temporária usada para autenticação, reset de senha, ou autorização de ações específicas                                |
| **Bearer Token**              | Tipo de token de autorização enviado no header HTTP `Authorization: Bearer <token>`                                                   |
| **Payload**                   | Dados úteis transportados em requisição HTTP, token JWT, ou mensagem de fila                                                          |
| **Endpoint**                  | URL específica de uma API que aceita requisições HTTP (ex: `POST /api/v1/users`)                                                      |
| **RESTful**                   | API que segue princípios REST: recursos identificados por URLs, verbos HTTP semânticos, stateless                                     |
| **Idempotente**               | Operação que pode ser executada múltiplas vezes sem alterar resultado além da primeira execução (ex: GET, PUT, DELETE)                |
| **Webhook**                   | Callback HTTP que notifica sistema externo sobre eventos (ex: GitHub Actions notifica CI/CD sobre push)                               |
| **Multi-Stage Build**         | Técnica de Docker que usa múltiplos `FROM` para reduzir tamanho final da imagem, separando build de produção                          |
| **Container**                 | Unidade de software que empacota aplicação e suas dependências de forma isolada e portável                                            |
| **Image**                     | Template imutável usado para criar containers Docker, contém código e runtime                                                         |
| **Registry**                  | Repositório de imagens Docker (ex: Docker Hub, GitHub Container Registry, AWS ECR)                                                    |
| **Orchestration**             | Gerenciamento automatizado de múltiplos containers (deploy, scaling, networking) via ferramentas como Kubernetes                      |
| **Horizontal Scaling**        | Adicionar mais instâncias da aplicação para lidar com carga crescente (scale-out)                                                     |
| **Vertical Scaling**          | Aumentar recursos (CPU, RAM) de uma única instância para lidar com carga crescente (scale-up)                                         |
| **Monolith**                  | Aplicação única e indivisível onde todos os módulos rodam no mesmo processo                                                           |
| **Microservices**             | Arquitetura onde sistema é dividido em múltiplos serviços independentes que se comunicam via rede                                     |
| **Event-Driven**              | Arquitetura onde componentes se comunicam via eventos assíncronos ao invés de chamadas síncronas                                      |
| **Pub/Sub**                   | Publish/Subscribe: padrão onde produtores publicam eventos e consumidores se inscrevem para recebê-los                                |
| **Message Queue**             | Fila de mensagens que permite comunicação assíncrona entre serviços (ex: RabbitMQ, Redis, Kafka)                                      |
| **DLQ**                       | Dead Letter Queue: fila de mensagens que falharam após múltiplas tentativas de processamento                                          |
| **Retry Logic**               | Lógica que tenta reexecutar operação falhada após intervalo de tempo, com limite de tentativas                                        |
| **Exponential Backoff**       | Estratégia de retry onde intervalo entre tentativas aumenta exponencialmente (1s, 2s, 4s, 8s...)                                      |
| **Circuit Breaker**           | Padrão que previne cascata de falhas ao desligar temporariamente comunicação com serviço instável                                     |
| **Saga Pattern**              | Padrão para transações distribuídas em microserviços, coordenando operações via eventos ou orquestração                               |
| **2PC**                       | Two-Phase Commit: protocolo de transação distribuída que garante atomicidade em múltiplos bancos de dados                             |
| **CAP Theorem**               | Teorema que afirma ser impossível ter simultaneamente Consistência, Disponibilidade e Tolerância a Partições em sistemas distribuídos |
| **Eventual Consistency**      | Modelo onde dados podem ficar inconsistentes temporariamente, mas eventualmente convergem para estado consistente                     |
| **MVP**                       | Minimum Viable Product: versão mínima de produto com funcionalidades essenciais para validar hipótese com usuários                    |
| **Tech Debt**                 | Technical Debt: custo acumulado de escolhas técnicas rápidas que sacrificam qualidade e exigem refatoração futura                     |
| **Overfetching**              | Problema REST onde API retorna mais dados que o necessário, desperdiçando banda e processamento                                       |
| **Underfetching**             | Problema REST onde API retorna menos dados que o necessário, exigindo múltiplas requisições                                           |
| **GraphQL**                   | Linguagem de query para APIs que permite cliente especificar exatamente quais dados deseja, resolvendo over/underfetching             |
| **SPF**                       | Sender Policy Framework: protocolo de email que valida se servidor está autorizado a enviar emails por domínio                        |
| **DKIM**                      | DomainKeys Identified Mail: assinatura criptográfica que autentica domínio remetente de email                                         |
| **Fábrica de Software**       | Ambiente educacional do IFPE onde alunos desenvolvem e mantêm sistemas reais para aplicar conhecimentos de engenharia de software     |
| **Invite**                    | Convite enviado por uma associação para um produtor se juntar à plataforma, contém token único e expiração em 7 dias                   |
| **User**                      | Produtor ou gestor que utiliza a plataforma QuaLeiDer para gerenciar dados de produção de leite                                        |
| **Animal**                    | Animal cadastrado na plataforma, associado a um produtor, com informações de saúde e produção                                          |
| **DailyCollection**          | Registro diário de coleta de leite, vinculado a um produtor e possivelmente a múltiplos animais                                        |
| **Association**               | Entidade que representa uma cooperativa ou grupo de produtores, pode gerenciar usuários e visualizar dados agregados                  |
| **Report**                   | Relatório gerado pelo sistema com dados agregados sobre produção de leite, pode ser diário, semanal ou mensal                          |
| **Notification**              | Alerta enviado por email ou dentro da plataforma para informar sobre eventos como convites, resets de senha, etc.                     |
| **Cron Job**                  | Tarefa agendada que executa ações como limpeza de convites expirados ou envio de lembretes                                             |
| **JWT**                       | JSON Web Token, usado para autenticação de usuários na API, expira em 24 horas                                                           |
| **Prisma**                    | ORM utilizado para acesso ao banco de dados PostgreSQL, fornece uma camada de abstração e segurança adicional                          |
| **Docker**                    | Plataforma de containerização que permite empacotar a aplicação e suas dependências em um ambiente isolado e reproduzível              |
| **GitHub Actions**             | Ferramenta de CI/CD que automatiza o processo de testes e deploy da aplicação para o ambiente de produção                              |
| **Ethereal**                 | Serviço de email temporário usado para desenvolvimento e testes, permite enviar emails sem custo                                        |
| **PostgreSQL**                | Sistema de gerenciamento de banco de dados relacional usado para armazenar dados da aplicação                                             |
| **Redis**                     | Armazenamento em cache e fila de mensagens, usado para melhorar performance e garantir entrega de mensagens em background               |
| **BullMQ**                    | Biblioteca para gerenciamento de filas e jobs em background, utilizada para reenvio de emails e processamento de tarefas agendadas     |
| **Prometheus**                | Sistema de monitoramento e alerta, usado para coletar métricas da aplicação e infraestrutura                                             |
| **Grafana**                   | Plataforma de análise e monitoramento, usada para visualizar métricas coletadas pelo Prometheus                                          |
| **Helmet**                    | Middleware para configurar headers de segurança HTTP, ajuda a proteger a aplicação contra vulnerabilidades comuns                       |
| **class-validator**            | Biblioteca para validação de objetos e DTOs, utilizada para garantir que dados de entrada estejam no formato correto                     |
| **bcrypt**                    | Biblioteca para hashing de senhas, utilizada para proteger senhas de usuários com um hash seguro e único                                  |
| **jsonwebtoken**              | Biblioteca para geração e verificação de tokens JWT, utilizada na autenticação de usuários                                               |
| **nodemailer**                | Biblioteca para envio de emails, utilizada para enviar convites, notificações e links de reset de senha                                   |
| **passport**                  | Middleware de autenticação, utilizado para integrar diferentes estratégias de autenticação como JWT e OAuth2                               |
| **@nestjs/jwt**               | Pacote do NestJS para integração com a biblioteca jsonwebtoken, simplifica o uso de JWT na aplicação                                      |
| **@nestjs/passport**           | Pacote do NestJS para integração com a biblioteca passport, simplifica o uso de autenticação baseada em estratégias                      |
| **@nestjs/event-emitter**      | Pacote do NestJS para implementação do padrão de eventos (Pub/Sub), utilizado para comunicação assíncrona entre diferentes partes da aplicação |
| **@nestjs/schedule**           | Pacote do NestJS para agendamento de tarefas (CRON jobs), utilizado para executar ações periódicas como limpeza de dados expirados      |
| **@willsoto/nestjs-prometheus**| Pacote para integração do NestJS com o Prometheus, utilizado para expor métricas da aplicação                                          |
| **@nestjs/throttler**          | Pacote do NestJS para implementação de rate limiting, utilizado para proteger rotas contra abusos e ataques de força bruta               |
| **Helmet:**                    | Middleware para configurar headers de segurança HTTP, protege contra vulnerabilidades comuns.                                          |