# Testes E2E (End-to-End)

## 📋 Visão Geral

Esta pasta contém todos os testes end-to-end da aplicação Qualeider. Os testes E2E verificam o comportamento completo da API, incluindo integração com banco de dados, autenticação, e fluxos de negócio.

## 📊 Status Atual

- ✅ **Auth (Login)**: 9 testes
- ✅ **Auth (Forgot/Reset Password)**: 15 testes
- ✅ **Users (CRUD)**: 18 testes
- ✅ **Animals (CRUD)**: 16 testes
- ✅ **Daily Collections (CRUD)**: 14 testes
- **Total**: **72 testes passando** (100%)

## 🏗️ Estrutura

```
tests/e2e/
├── setup.ts                      # Setup/teardown global
├── factories/                    # Factories para dados de teste
│   ├── user.factory.ts          # Factory de usuários
│   ├── animal.factory.ts        # Factory de animais
│   ├── daily-collection.factory.ts  # Factory de coletas
│   └── index.ts                 # Barrel exports
├── helpers/                      # Utilitários reutilizáveis
│   ├── test-app.ts              # Wrapper da aplicação NestJS
│   ├── auth-helper.ts           # Helper de autenticação
│   └── index.ts                 # Barrel exports
├── auth/                        # Testes de autenticação
│   ├── login.e2e-spec.ts
│   └── forgot-reset-password.e2e-spec.ts
├── users/                       # Testes CRUD de usuários
│   └── users-crud.e2e-spec.ts
├── animals/                     # Testes CRUD de animais
│   └── animals-crud.e2e-spec.ts
└── daily-collections/           # Testes CRUD de coletas
    └── daily-collections-crud.e2e-spec.ts
```

## 🚀 Como Executar

### Pré-requisitos

1. **Banco de dados PostgreSQL rodando**:

   ```bash
   # Via Docker:
   docker-compose up -d

   # Ou manualmente:
   # PostgreSQL deve estar rodando em 127.0.0.1:5432
   ```

2. **Variáveis de ambiente configuradas** (`.env`):
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/qualeider_test"
   JWT_SECRET="your-secret-key"
   ```

### Comandos

```bash
# Executar todos os testes E2E
npm run test:e2e

# Executar em modo watch (reexecuta ao salvar)
npm run test:e2e:watch

# Executar com coverage
npm run test:e2e:cov
```

## 🧪 Usando Factories

Os factories facilitam a criação de dados de teste consistentes e únicos.

### UserFactory

```typescript
import { UserFactory } from '../factories';

// Usuário padrão (Física)
const userData = UserFactory.build();

// Admin (Jurídica)
const adminData = UserFactory.buildAdmin({
  email: 'custom@admin.com',
});

// Produtor (Física)
const producerData = UserFactory.buildProducer();
```

### AnimalFactory

```typescript
import { AnimalFactory } from '../factories';

// Animal padrão (Vaca)
const animalData = AnimalFactory.build({ userId: 1 });

// Vaca específica
const vacaData = AnimalFactory.buildVaca({
  userId: 1,
  name: 'Mimosa',
});

// Cabra
const cabraData = AnimalFactory.buildCabra({ userId: 1 });
```

### DailyCollectionFactory

```typescript
import { DailyCollectionFactory } from '../factories';

// Coleta padrão
const collectionData = DailyCollectionFactory.build({ userId: 1 });

// Com assistência técnica
const withAssistance = DailyCollectionFactory.buildWithAssistance({
  userId: 1,
});

// Sem assistência técnica
const withoutAssistance = DailyCollectionFactory.buildWithoutAssistance({
  userId: 1,
});
```

## 🧪 Escrevendo Testes E2E

### Estrutura Básica

```typescript
import { setupE2ETests, teardownE2ETests } from '../setup';
import { TestApp, AuthHelper } from '../helpers';

describe('E2E: Nome do Módulo', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let token: string;

  beforeAll(async () => {
    // 1. Limpar banco de dados
    await setupE2ETests();

    // 2. Criar aplicação de teste
    testApp = new TestApp();
    await testApp.setup();

    // 3. Criar helper de autenticação
    authHelper = new AuthHelper(testApp);

    // 4. Criar usuário e obter token (se necessário)
    const { token: userToken } = await authHelper.createUserAndLogin({
      email: 'test@example.com',
      password: 'Test@1234',
    });
    token = userToken;
  });

  afterAll(async () => {
    // 1. Fechar aplicação
    await testApp.close();

    // 2. Limpar banco e desconectar
    await teardownE2ETests();
  });

  describe('GET /endpoint', () => {
    it('deve retornar sucesso com autenticação', async () => {
      const response = await testApp
        .request()
        .get('/endpoint')
        .set(authHelper.authHeader(token))
        .expect(200);

      expect(response.body).toHaveProperty('data');
    });
  });
});
```

### Usando TestApp

```typescript
// Requisição GET
await testApp
  .request()
  .get('/users')
  .set(authHelper.authHeader(token))
  .expect(200);

// Requisição POST
await testApp
  .request()
  .post('/users')
  .send({ email: 'test@example.com', password: 'Test@1234' })
  .expect(201);

// Requisição PUT
await testApp
  .request()
  .put('/users/1')
  .set(authHelper.authHeader(token))
  .send({ name: 'Updated Name' })
  .expect(200);

// Requisição DELETE
await testApp
  .request()
  .delete('/users/1')
  .set(authHelper.authHeader(token))
  .expect(200);

// Acessar PrismaService diretamente (para verificações)
const prisma = testApp.getPrismaService();
const user = await prisma.user.findUnique({ where: { id: 1 } });
```

### Usando AuthHelper

```typescript
// Criar usuário de teste
const user = await authHelper.createTestUser({
  email: 'test@example.com',
  password: 'Test@1234',
  name: 'Test User',
  userCategory: UserCategory.Fisica,
  city: 'São Paulo',
  state: 'SP',
});

// Fazer login e obter token
const token = await authHelper.login('test@example.com', 'Test@1234');

// Criar usuário E fazer login (atalho)
const { user, token } = await authHelper.createUserAndLogin({
  email: 'test@example.com',
  password: 'Test@1234',
});

// Criar header de autorização
const headers = authHelper.authHeader(token);
// Resultado: { Authorization: 'Bearer <token>' }
```

## 📝 Convenções

### Nomenclatura de Arquivos

- **Padrão**: `<module-name>.e2e-spec.ts`
- **Exemplos**: `login.e2e-spec.ts`, `users-crud.e2e-spec.ts`

### Nomenclatura de Testes

- **Suite (describe)**: `E2E: <Módulo> - <Contexto>`
- **Teste (it)**: `deve <ação> <condição>`

```typescript
describe('E2E: Users - CRUD Operations', () => {
  describe('POST /users', () => {
    it('deve criar usuário com dados válidos', async () => {
      // ...
    });

    it('deve retornar 400 com dados inválidos', async () => {
      // ...
    });
  });
});
```

### Ordem de Verificação

1. **Happy Path** (cenário de sucesso)
2. **Validação de dados** (400)
3. **Autenticação** (401)
4. **Autorização** (403)
5. **Não encontrado** (404)
6. **Erros de servidor** (500)

## ⚙️ Configuração

### jest.e2e.config.ts

```typescript
{
  testMatch: ['<rootDir>/tests/e2e/**/*.e2e-spec.ts'],
  testTimeout: 60000,        // 60 segundos
  maxWorkers: 1,             // Execução sequencial (evita conflitos de DB)
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 65,
      lines: 65,
      statements: 65,
    },
  },
}
```

## 🔧 Troubleshooting

### Erro: "Can't reach database server"

**Solução**: Certifique-se de que o PostgreSQL está rodando:

```bash
docker-compose up -d
# ou
pg_isready -h 127.0.0.1 -p 5432
```

### Erro: "Foreign key constraint violation"

**Solução**: A função `cleanDatabase()` já limpa todas as tabelas na ordem correta. Se o erro persistir, verifique se há novas tabelas que precisam ser adicionadas ao setup.

### Testes falhando com timeout

**Solução**: Aumente o timeout no `jest.e2e.config.ts`:

```typescript
testTimeout: 120000, // 2 minutos
```

### Dados persistindo entre testes

**Solução**: Verifique se `setupE2ETests()` e `teardownE2ETests()` estão sendo chamados corretamente nos hooks `beforeAll` e `afterAll`.

## 📊 Coverage

Os testes E2E complementam os testes unitários, focando em:

- **Integração real** com banco de dados
- **Validação de DTOs** com ValidationPipe
- **Autenticação e autorização** JWT
- **Fluxos completos** de negócio
- **Comportamento HTTP** (status codes, headers, body)

**Meta de coverage E2E**: 60-65% (definido em `jest.e2e.config.ts`)

## 🎯 Próximos Passos

- [ ] Criar testes E2E para módulo `animals`
- [ ] Criar testes E2E para módulo `daily-collections`
- [ ] Adicionar testes de forgot/reset password
- [ ] Criar fixtures/factories para dados de teste
- [ ] Adicionar testes de paginação e filtros
- [ ] Implementar testes de performance (load testing)

## 📚 Referências

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [SuperTest Documentation](https://github.com/visionmedia/supertest)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
