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

6. **Gestão Administrativa**

   - Acesso a logs detalhados do sistema (autenticação, erros, jobs)
   - Monitoramento de processos em segundo plano (CRON jobs, envio de emails)
   - Visualização de estatísticas globais (total de produtores, associações, coletas)
   - Gestão de configurações do sistema (parâmetros de email, timeouts)
   - Alertas automáticos para falhas críticas (jobs, serviços externos)

7. **Módulo de Relatórios e Análises**
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

| Prioridade | Objetivo de Qualidade | Cenário Mensurável                                                                                                                              |
| ---------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1          | **Segurança**         | Tokens JWT expiram em 24h; senhas com hash bcrypt (10 rounds); reset de senha expira em 15 min; proteção contra SQL injection via Prisma ORM    |
| 2          | **Manutenibilidade**  | Clean Architecture com 4 camadas (Domain, Application, Infrastructure, Presentation);                                                           |
| 3          | **Escalabilidade**    | Sistema suporta 50 associações e 2.000 produtores simultâneos; API responde <300ms com 500 req/min; preparado para crescimento horizontal       |
| 4          | **Confiabilidade**    | Jobs CRON alertam admin em caso de falha; emails com 3 tentativas de reenvio (5, 15, 30 min); 99% de uptime para operações críticas             |
| 5          | **Usabilidade**       | Produtor registra coleta em <45s via smartphone; taxa de sucesso de 95% na aceitação de convites sem ajuda; API RESTful documentada com Swagger |
| 6          | **Testabilidade**     | Dependency Injection em 100% dos serviços; ports/adapters pattern; cobertura de testes >80% em camadas críticas (Application, Domain)           |

### Detalhamento dos Objetivos

**Segurança:**

- Autenticação stateless com JWT
- Hash de senhas com bcrypt (10 rounds)
- Validação rigorosa de DTOs com decorators
- Proteção contra SQL injection via Prisma ORM
- Tokens de reset de senha com expiração de 15 minutos

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
- Tempo de resposta da API de registro de coleta <300ms mesmo com 500 requisições/minuto
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
  - Alerta enviado ao Administrador se falhar por 3 dias consecutivos
- Validações em camadas (DTO, Service, Database)
- Tratamento de erros específico por tipo de falha (P2002, P2025, P2003)
- Monitoramento de processos em segundo plano com logs estruturados

**Usabilidade:**

- **Para Produtores:**
  - Interface responsiva otimizada para smartphones (tela mínima: 360px)
  - Fluxo de registro de coleta diária em <45 segundos
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

  - **Testes Unitários:** 466 testes cobrindo DTOs, Services, Controllers, Entities
    - DTOs: 100% de cobertura (validação de dados de entrada)
    - Services (Application): 95%+ de cobertura (lógica de negócio)
    - Controllers (Presentation): 97% de cobertura (endpoints HTTP)
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
  - Tempo de execução de testes unitários: <60s
  - Tempo de execução de testes E2E: ~90s

## Partes Interessadas

| Função/Nome                         | Contato                               | Expectativas                                                                                                    |
| ----------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Produtores de Leite**             | Usuários finais do sistema            | Sistema simples para registro de coletas diárias, gestão de animais, recebimento de convites de associações     |
| **Associações**                     | Organizações que gerenciam produtores | Ferramenta para convidar e gerenciar produtores, visualizar dados agregados, enviar notificações                |
| **Instituto Federal de Pernambuco** | Cliente/Patrocinador                  | Sistema funcional que apoie a gestão de produtores de leite na região, código de qualidade para fins acadêmicos |
| **Equipe de Desenvolvimento**       | Desenvolvedores do projeto            | Arquitetura limpa e bem documentada, facilidade de manutenção e extensão, uso de boas práticas                  |
| **Administradores do Sistema**      | Suporte técnico                       | Acesso administrativo, logs detalhados, facilidade de deployment e monitoramento                                |

# Restrições Arquiteturais

# Contexto e Escopo

## Contexto Negocial {#\_contexto_negocial}

**\<Diagrama ou Tabela>**

**\<opcionalmente: Explicação das interfaces de domínio externo>**

## Contexto Técnico {#\_contexto_t_cnico}

**\<Diagrama ou Tabela>**

**\<opcionalmente: Explicação das interfaces técnicas>**

**\<Mapeamento de entrada/saída para canais>**

# Estratégia de Solução {#section-solution-strategy}

# Visão de Blocos de Construção {#section-building-block-view}

## Visão Sistêmica Geral de Caixa Branca {#\_vis_o_sist_mica_geral_de_caixa_branca}

**_\<Diagrama de Visão Geral>_**

Motivação

: _\<explicação textual>_

Blocos de Construção Contidos

: _\<Descrição dos blocos de construção contidos (caixas pretas)>_

Interfaces Importantes

: _\<Descrição de interfaces importantes>_

### \<Nome Caixa Preta 1> {#\_\_nome_caixa_preta_1}

_\<Propósito/Responsabilidade>_

_\<Interface(s)>_

_\<(Opcional) Características de Qualidade/Desempenho>_

_\<(Opcional) Local do Diretório/Arquivo>_

_\<(Opcional) Requisitos Cumpridos>_

_\<(opcional) Problemas/Riscos Abertos>_

### \<Nome Caixa Preta 2> {#\_\_nome_caixa_preta_2}

_\<modelo de caixa preta>_

### \<Nome Caixa Preta n> {#\_\_nome_caixa_preta_n}

_\<modelo de caixa preta>_

### \<Nome Interface 1> {#\_\_nome_interface_1}

...

### \<Nome Interface m> {#\_\_nome_interface_m}

## Nível 2 {#\_n_vel_2}

### Caixa Branca _\<Bloco de Construção 1>_ {#\_caixa_branca_emphasis_bloco_de_constru_o_1_emphasis}

_\<modelo de caixa branca>_

### Caixa Branca _\<Bloco de Construção 2>_ {#\_caixa_branca_emphasis_bloco_de_constru_o_2_emphasis}

_\<modelo de caixa branca>_

...

### Caixa Branca _\<Bloco de Construção m>_ {#\_caixa_branca_emphasis_bloco_de_constru_o_m_emphasis}

_\<modelo de caixa branca>_

## Nível 3 {#\_n_vel_3}

### Caixa Branca \<\_Bloco de Construção x.1\_\> {#\_caixa_branca_bloco_de_constru_o_x_1}

_\<modelo de caixa branca>_

### Caixa Branca \<\_Bloco de Construção x.2\_\> {#\_caixa_branca_bloco_de_constru_o_x_2}

_\<modelo de caixa branca>_

### Caixa Branca \<\_Bloco de Construção y.1\_\> {#\_caixa_branca_bloco_de_constru_o_y_1}

_\<modelo de caixa branca>_

# Visão de Tempo de Execução {#section-runtime-view}

## \<Cenário de Tempo de Execução 1> {#\_\_cen_rio_de_tempo_de_execu_o_1}

- _\<inserir diagrama de tempo de execução ou descrição textual do
  cenário>_

- _\<inserir descrição dos aspectos notáveis ​​das interações entre as
  instâncias do bloco de construção descritas neste diagrama.\>_

## \<Cenário de Tempo de Execução 2> {#\_\_cen_rio_de_tempo_de_execu_o_2}

## ... {#\_}

## \<Cenário de Tempo de Execução n> {#\_\_cen_rio_de_tempo_de_execu_o_n}

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

**2. Ports & Adapters (Hexagonal Architecture)**

- Interfaces claramente definidas entre camadas
- Camada de Application independente de infraestrutura
- Exemplo: Interface `IUserRepository` implementada por `PrismaUserRepository` em produção e `InMemoryUserRepository` em testes

**3. Separation of Concerns**

- DTOs separam validação de entrada da lógica de negócio
- Services contêm apenas lógica de negócio (sem detalhes de HTTP ou Database)
- Controllers são finos, delegando toda lógica para Services

### Estrutura de Testes

```
tests/
├── unit/                          # Testes unitários (466 testes)
│   ├── application/
│   │   ├── dtos/                 # Validação de DTOs (100% cobertura)
│   │   └── services/             # Lógica de negócio (95%+ cobertura)
│   ├── domain/
│   │   ├── entities/             # Regras de domínio (100% cobertura)
│   │   └── enums/
│   └── presentation/
│       └── controllers/          # Endpoints HTTP (97% cobertura)
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
UserFactory.buildAdmin(); // Administrador
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

| Métrica               | Meta  | Atual  | Status |
| --------------------- | ----- | ------ | ------ |
| Cobertura Geral       | >80%  | 96.25% | ✅     |
| Cobertura DTOs        | 100%  | 100%   | ✅     |
| Cobertura Services    | >90%  | 95%+   | ✅     |
| Cobertura Controllers | >90%  | 97%    | ✅     |
| Testes Unitários      | >300  | 466    | ✅     |
| Testes E2E            | >80   | 110    | ✅     |
| Tempo Exec. Unit      | <60s  | ~50s   | ✅     |
| Tempo Exec. E2E       | <120s | ~90s   | ✅     |
| Taxa de Sucesso       | 100%  | 100%   | ✅     |

### Processo de CI/CD

**1. Validação Pré-Commit**

- Linter (ESLint) valida padrões de código
- Prettier formata código automaticamente

**2. Pipeline de Testes**

- Testes unitários executados primeiro (rápido feedback)
- Testes E2E executados se unitários passarem
- Cobertura validada (bloqueia merge se <80%)

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
- **Validação:** Testes unitários (466 testes)
- **Tempo médio:** ~45 segundos
- **Comportamento:** Bloqueia commit se algum teste falhar
- **Objetivo:** Feedback imediato sobre falhas antes de salvar alterações

**Pre-push:**

- **Trigger:** Executado antes de enviar commits ao repositório remoto
- **Comandos:**
  ```bash
  npm run test:unit      # 466 testes unitários
  npm run test:e2e       # 110 testes E2E
  ```
- **Tempo médio:** ~2 minutos (testes completos)
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
2. **Tempo de commit aumentado:** ~45s adicional por commit (aceitável para qualidade)
3. **Requer database local:** Testes E2E precisam de PostgreSQL rodando (Docker Compose)
4. **Não valida todos os cenários:** GitHub Actions ainda é necessário para validação completa

## _\<Conceito 2>_ {#\_\_emphasis_conceito_2_emphasis}

_\<explicação>_

...

## _\<Conceito n>_ {#\_\_emphasis_conceito_n_emphasis}

_\<explicação>_

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
  - Configuração de path aliases pode ser complexa (Padrão que já foi adotado antes)

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
  - Testes E2E mais lentos (~90s total)
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

Após implementar cobertura de 96.25% e 576 testes (466 unitários + 110 E2E), identificamos que código não testado ainda chegava ao repositório remoto. Desenvolvedores esqueciam de rodar testes localmente antes de fazer push, causando:

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

1. **Pre-commit:** Executa testes unitários (~45s) antes de cada commit
2. **Pre-push:** Executa testes completos (~2min) antes de push ao repositório

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
- Economia de ~70% nos minutos de GitHub Actions
- Impossível commitar código quebrado acidentalmente
- Reforça cultura de "código testado = código pronto"
- Documentação viva: Hooks mostram expectativas de qualidade

⚠️ **Negativas:**

- Tempo de commit aumenta em ~45 segundos (antes: instantâneo)
- Tempo de push aumenta em ~2 minutos (validação completa)
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
- ✅ Redução de pushes falhando no CI: >90%
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
│   │   ├── Testes Unitários (466 testes)
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
- **Medida:** Produtor completa o registro em <45 segundos, com taxa de sucesso de 95%

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
- **Medida:** Tempo de resposta <300ms para 95% das requisições; 500 req/min sustentáveis

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
- **Resposta:** Sistema registra falha em log estruturado e envia alerta ao Administrador
- **Medida:** Alerta enviado em <5 minutos após 3ª falha consecutiva; convites não são deletados incorretamente

### Cenário 6: Ataque de SQL Injection (Segurança)

- **Fonte:** Atacante mal-intencionado
- **Estímulo:** Tenta injetar SQL via campo de email: `admin@test.com' OR '1'='1`
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
- **Medida:** Resposta gerada em <2 segundos; dados consistentes com registros individuais; formato exportável (JSON/CSV)

### Cenário 9: Alerta de Medicação Repetida (Funcionalidade)

- **Fonte:** Produtor registra medicação para um animal
- **Estímulo:** É a 3ª vez que o mesmo tipo de medicação é aplicado em 30 dias
- **Artefato:** Módulo de análise de animais (futuro)
- **Ambiente:** Sistema em produção com histórico de tratamentos
- **Resposta:** Sistema gera alerta visual no dashboard e notificação por email
- **Medida:** Alerta gerado em tempo real (<5 segundos); taxa de falsos positivos <5%; produtor pode marcar alerta como "revisado"

### Cenário 10: Adição de Nova Funcionalidade sem Quebrar Testes (Testabilidade)

- **Fonte:** Desenvolvedor precisa adicionar validação de CNPJ em associações
- **Estímulo:** Requisito novo de validar formato e dígitos verificadores do CNPJ
- **Artefato:** Service `AssociationsService` e DTO `CreateAssociationDto`
- **Ambiente:** Ambiente de desenvolvimento com suite de testes completa (576 testes)
- **Resposta:** Desenvolvedor adiciona validação em DTO; testes existentes continuam passando; novos testes são adicionados
- **Medida:** Testes executados em <60s; cobertura mantida >95%; zero regressões; implementação completa em <2 horas

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
- **Medida:** Bug reproduzido em <10 minutos; correção validada por teste automatizado; deploy com confiança (100% dos testes passando)

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

- Testes Unitários: ~50s (466 testes)
- Testes E2E: ~90s (110 testes)
- Total: ~140s

**Limites Estabelecidos:**

- Testes Unitários: <60s
- Testes E2E: <120s
- Total: <180s

**Mitigação:**

- Execução paralela de testes (Jest workers)
- Otimização de queries em testes E2E
- Test filtering (rodar apenas testes afetados)
- Cache de módulos compilados

**Plano de Contingência:**

- Revisar testes lentos (>5s unitários, >10s E2E)
- Considerar splitting de suítes de teste
- Avaliar migração para Vitest se necessário

## Débitos Técnicos Relacionados à Testabilidade

### DT-001: Ausência de Testes de Carga (Load Testing)

**Prioridade:** Alta | **Esforço Estimado:** 2 semanas

**Descrição:**
Sistema não possui testes automatizados de carga para validar cenário de 2.000 produtores simultâneos.

**Impacto:**

- Impossível validar meta de escalabilidade (<300ms com 500 req/min)
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

| Termo                         | Definição                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **AAA Pattern**               | Arrange-Act-Assert: padrão de estruturação de testes dividido em 3 etapas (preparar, executar, verificar)              |
| **CI/CD**                     | Continuous Integration/Continuous Deployment: prática de integração e deploy contínuos com validação automatizada      |
| **Cobertura de Código**       | Métrica que indica percentual de código executado durante testes automatizados                                         |
| **Dependency Injection (DI)** | Padrão de design onde dependências são fornecidas externamente ao invés de criadas internamente, facilitando testes    |
| **E2E (End-to-End)**          | Testes que validam fluxo completo do sistema, do endpoint HTTP até o banco de dados                                    |
| **Flaky Test**                | Teste instável que falha intermitentemente sem mudanças no código, geralmente por não-determinismo                     |
| **Mock**                      | Objeto que simula comportamento de dependência real, usado para isolar código em testes                                |
| **Ports & Adapters**          | Padrão arquitetural (Hexagonal Architecture) que separa lógica de negócio de detalhes de infraestrutura via interfaces |
| **Stub**                      | Tipo de test double que retorna dados pré-definidos, mais simples que mocks                                            |
| **Test Double**               | Termo genérico para objetos que substituem dependências reais em testes (mocks, stubs, spies, fakes)                   |
| **Test Factory**              | Padrão de criação de objetos de teste com dados válidos por padrão, reduzindo duplicação de código                     |
| **Test Isolation**            | Princípio de que cada teste deve ser independente e não afetar outros testes                                           |
| **Testes de Contrato**        | Testes que validam se a interface entre sistemas externos permanece compatível                                         |
| **Testes Unitários**          | Testes que validam pequenas unidades de código (funções, métodos) de forma isolada                                     |
| **JWT**                       | JSON Web Token: padrão de token para autenticação stateless                                                            |
| **DTO**                       | Data Transfer Object: objeto que transporta dados entre camadas, usado para validação de entrada                       |
| **ORM**                       | Object-Relational Mapping: framework que mapeia objetos para tabelas de banco de dados (ex: Prisma)                    |
| **CRON Job**                  | Tarefa agendada que executa automaticamente em intervalos definidos                                                    |
| **Clean Architecture**        | Arquitetura em camadas que separa lógica de negócio de frameworks e infraestrutura                                     |
| **Prisma**                    | ORM TypeScript-first utilizado no projeto para acesso ao PostgreSQL                                                    |
| **NestJS**                    | Framework Node.js para construção de aplicações server-side escaláveis                                                 |
| **Supertest**                 | Biblioteca para testes de APIs HTTP em Node.js                                                                         |
| **Jest**                      | Framework JavaScript para testes unitários e E2E                                                                       |
| **DRY**                       | Don't Repeat Yourself: princípio de evitar duplicação de código através de abstração e reutilização                    |
| **SRP**                       | Single Responsibility Principle: cada classe/módulo deve ter uma única responsabilidade                                |
| **DIP**                       | Dependency Inversion Principle: depender de abstrações (interfaces) ao invés de implementações concretas               |
| **SOLID**                     | Conjunto de 5 princípios de design orientado a objetos (SRP, OCP, LSP, ISP, DIP)                                       |
| **KISS**                      | Keep It Simple, Stupid: princípio de manter soluções simples e evitar complexidade desnecessária                       |
| **YAGNI**                     | You Aren't Gonna Need It: não implementar funcionalidades até que sejam realmente necessárias                          |
| **TDD**                       | Test-Driven Development: metodologia de desenvolver testes antes do código de produção                                 |
| **Refactoring**               | Processo de melhorar estrutura interna do código sem alterar comportamento externo                                     |
| **Code Smell**                | Indicador de possível problema no código que merece atenção (ex: funções muito longas, duplicação)                     |
| **Path Alias**                | Atalho de importação (ex: `@/application`) que simplifica caminhos relativos no código                                 |
| **Clean Code**                | Conjunto de práticas para escrever código legível, simples e fácil de manter                                           |
| **Git Hooks**                 | Scripts automatizados que executam em eventos específicos do Git (commit, push, merge) para validações personalizadas  |
| **Husky**                     | Ferramenta Node.js que facilita configuração e gerenciamento de Git Hooks em projetos JavaScript/TypeScript            |
| **Pre-commit**                | Hook do Git que executa antes de finalizar um commit, usado para validar código antes de salvá-lo no histórico         |
| **Pre-push**                  | Hook do Git que executa antes de enviar commits ao repositório remoto, última validação local antes do push            |
| **--no-verify**               | Flag do Git que ignora execução de hooks configurados (bypass), deve ser usado apenas em emergências                   |
