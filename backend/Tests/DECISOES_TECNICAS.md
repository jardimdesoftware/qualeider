# Decisões Técnicas na Arquitetura de Testes

## Índice

1. [Visão Geral](#visão-geral)
2. [Estrutura de Diretórios](#estrutura-de-diretórios)
3. [Configurações de Teste](#configurações-de-teste)
4. [Factories e Mocks](#factories-e-mocks)
5. [Testes de Domain](#testes-de-domain)
6. [Testes de Services](#testes-de-services)
7. [Testes de DTOs](#testes-de-dtos)
8. [Testes de Controllers](#testes-de-controllers)
9. [Padrões e Convenções](#padrões-e-convenções)
10. [Próximos Passos](#próximos-passos)

---

## Visão Geral

### Objetivo

Criar uma suíte de testes **completa, escalável e manutenível** para o backend Qualeider, seguindo as melhores práticas do NestJS e garantindo alta cobertura de código.

### Princípios Adotados

1. **Separação de Concerns**: Testes unitários isolados dos testes de integração
2. **DRY (Don't Repeat Yourself)**: Uso extensivo de factories para evitar duplicação
3. **AAA Pattern**: Arrange, Act, Assert em todos os testes
4. **Isolation**: Cada teste é independente e pode rodar isoladamente
5. **Fast Feedback**: Testes unitários extremamente rápidos (<30s para 400+ testes)
6. **Realistic Data**: Factories geram dados realistas que refletem o domínio

---

## Estrutura de Diretórios

### Decisão: Espelhar a estrutura do src/

```
tests/
├── unit/
│   ├── domain/
│   ├── application/
│   └── presentation/
├── integration/
├── e2e/
└── helpers/
```

**Razão:**

- ✅ **Navegação intuitiva**: Encontrar testes é trivial (espelha src/)
- ✅ **Escalabilidade**: Fácil adicionar novos testes seguindo o padrão
- ✅ **Separação clara**: Unit, integration e e2e bem separados
- ✅ **IDE-friendly**: Autocomplete e navegação funcionam perfeitamente

**Alternativa rejeitada:**
❌ Estrutura flat (todos testes em /tests/\*.spec.ts)

- Problema: Dificulta encontrar testes em projetos grandes
- Problema: Mistura diferentes tipos de teste

---

## Configurações de Teste

### 1. jest.config.ts (Root Config)

**Decisão:** Configuração base com paths aliases e transformers

```typescript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

**Razão:**

- ✅ **Imports limpos**: `import { User } from '@/domain/entities/user'`
- ✅ **Refactoring seguro**: Mudar estrutura não quebra imports
- ✅ **Consistência**: Mesmos aliases do tsconfig.json

### 2. jest.unit.config.ts

**Decisão:** Configuração específica para testes unitários

```typescript
testMatch: ['**/tests/unit/**/*.spec.ts'];
collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'];
```

**Razão:**

- ✅ **Isolamento**: Roda apenas testes unitários (rápido)
- ✅ **Coverage preciso**: Exclui arquivos não testáveis (main.ts, migrations)
- ✅ **Performance**: Não carrega banco de dados ou serviços externos

### 3. jest.integration.config.ts

**Decisão:** Preparado para testes com banco de dados

```typescript
setupFilesAfterEnv: ['<rootDir>/tests/setup/integration-setup.ts'];
testTimeout: 30000;
```

**Razão:**

- ✅ **DB de teste**: Setup próprio para criar/limpar banco
- ✅ **Timeout maior**: Operações de I/O levam mais tempo
- ✅ **Isolamento**: Não afeta testes unitários

**Planejamento futuro:**

- Container PostgreSQL via Docker
- Migrations automáticas no setup
- Limpeza de dados entre testes

---

## Factories e Mocks

### Decisão: Factories centralizadas em /helpers/factories/

#### 1. User Factory

**Design:**

```typescript
export const createUser = (overrides?: Partial<User>): User => {
  const defaults = {
    id: faker.number.int({ min: 1, max: 10000 }),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    // ...
  };
  return { ...defaults, ...overrides };
};
```

**Razão:**

- ✅ **Dados realistas**: Faker gera nomes, emails, CPFs válidos
- ✅ **Flexibilidade**: Override apenas o que importa no teste
- ✅ **Manutenção**: Um lugar para atualizar quando modelo mudar
- ✅ **Type-safe**: TypeScript garante campos obrigatórios

**Exemplo de uso:**

```typescript
// Usuário padrão
const user = createUser();

// Override específico para teste
const admin = createUser({
  userType: UserType.ASSOCIATION_ADMIN,
});
```

#### 2. Mock Repositories

**Design:**

```typescript
export const createMockUserRepository = () => ({
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
  // ...
});
```

**Razão:**

- ✅ **Reuso**: Mesmo mock para todos os testes de services
- ✅ **Consistência**: Interface sempre completa
- ✅ **Type-safe**: TypeScript valida métodos
- ✅ **Reset fácil**: `jest.clearAllMocks()` limpa tudo

**Alternativa rejeitada:**
❌ Mock inline em cada teste

```typescript
// ❌ Ruim: duplicação
const mockRepo = {
  findById: jest.fn(),
  findByEmail: jest.fn(),
};
```

#### 3. Mock Services

**Design:** Similar aos repositories, mas para services

```typescript
export const createMockAuthService = () => ({
  validateUser: jest.fn(),
  login: jest.fn(),
  generateResetToken: jest.fn(),
});
```

**Razão:**

- ✅ **Isolamento**: Controllers testam apenas sua lógica
- ✅ **Velocidade**: Não executa lógica real dos services
- ✅ **Controle**: Mock retorna exatamente o que o teste precisa

---

## Testes de Domain

### Decisão: Testar entidades e value objects isoladamente

#### 1. Estrutura de Testes de Entidades

**Pattern:**

```typescript
describe('User', () => {
  describe('constructor', () => {
    it('deve criar usuário com dados válidos', () => {
      const user = createUser();
      expect(user.id).toBeDefined();
      expect(user.email).toContain('@');
    });
  });

  describe('validations', () => {
    it('deve validar email', () => {
      // teste
    });
  });
});
```

**Razão:**

- ✅ **Organização**: Describe aninhado separa concerns
- ✅ **Legibilidade**: Fácil encontrar teste específico
- ✅ **Coverage**: Garante todos os métodos testados

#### 2. Testes de Value Objects

**Exemplo: CPF**

```typescript
describe('CPF', () => {
  it('deve aceitar CPF válido', () => {
    const cpf = new CPF('12345678909');
    expect(cpf.isValid()).toBe(true);
  });

  it('deve rejeitar CPF inválido', () => {
    expect(() => new CPF('111.111.111-11')).toThrow('CPF inválido');
  });
});
```

**Razão:**

- ✅ **Validação de regras de negócio**: CPF, CNPJ, Email
- ✅ **Imutabilidade**: Garante que value objects não mudam
- ✅ **Edge cases**: Testa formatos, máscaras, validações

**Cobertura alcançada:** 90 testes, 100% de cobertura em domain

---

## Testes de Services

### Decisão: Mockar dependências, testar apenas lógica do service

#### 1. Pattern de Setup

**Design:**

```typescript
describe('UsersService', () => {
  let service: UsersService;
  let mockUserRepository: MockUserRepository;
  let mockHashService: MockHashService;

  beforeEach(async () => {
    mockUserRepository = createMockUserRepository();
    mockHashService = createMockHashService();

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: 'UserRepository', useValue: mockUserRepository },
        { provide: 'HashService', useValue: mockHashService },
      ],
    }).compile();

    service = module.get(UsersService);
    jest.clearAllMocks();
  });
});
```

**Razão:**

- ✅ **Isolamento total**: Service não acessa DB ou APIs reais
- ✅ **Velocidade**: Testes rodam em milissegundos
- ✅ **Controle**: Mock retorna exatamente o que teste precisa
- ✅ **Reset**: `jest.clearAllMocks()` garante testes independentes

#### 2. Testes de Success Path

**Pattern:**

```typescript
it('deve criar usuário com sucesso', async () => {
  // Arrange
  const createDto = { name: 'João', email: 'joao@test.com' };
  const expectedUser = createUser(createDto);
  mockUserRepository.create.mockResolvedValue(expectedUser);
  mockHashService.hash.mockResolvedValue('hashedPassword');

  // Act
  const result = await service.create(createDto);

  // Assert
  expect(mockHashService.hash).toHaveBeenCalledWith(createDto.password);
  expect(mockUserRepository.create).toHaveBeenCalledWith({
    ...createDto,
    password: 'hashedPassword',
  });
  expect(result).toEqual(expectedUser);
});
```

**Razão:**

- ✅ **AAA Pattern**: Arrange, Act, Assert bem separados
- ✅ **Assertions completas**: Verifica chamadas E resultado
- ✅ **Realistic data**: Factory gera dados válidos

#### 3. Testes de Error Path

**Pattern:**

```typescript
it('deve lançar ConflictException se email já existe', async () => {
  mockUserRepository.findByEmail.mockResolvedValue(createUser());

  await expect(service.create(createDto)).rejects.toThrow(ConflictException);

  expect(mockUserRepository.create).not.toHaveBeenCalled();
});
```

**Razão:**

- ✅ **Business rules**: Testa validações de negócio
- ✅ **Early returns**: Verifica que fluxo para quando deve
- ✅ **Error types**: Garante exceção correta (ConflictException, NotFoundException)

**Cobertura alcançada:** 124 testes, 100% em 8 services críticos

---

## Testes de DTOs

### Decisão: Validar class-validator decorators

#### 1. Setup com ValidationPipe

**Design:**

```typescript
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

describe('CreateUserDto', () => {
  async function validateDto(dto: any) {
    const transformed = plainToClass(CreateUserDto, dto);
    return validate(transformed);
  }
});
```

**Razão:**

- ✅ **Validação real**: Usa mesma lógica que NestJS
- ✅ **Transformation**: Testa plainToClass também
- ✅ **Error messages**: Verifica mensagens customizadas

#### 2. Testes de Success

**Pattern:**

```typescript
it('deve aceitar DTO válido', async () => {
  const dto = {
    name: 'João Silva',
    email: 'joao@test.com',
    password: 'Password123!',
    userType: 'producer',
  };

  const errors = await validateDto(dto);
  expect(errors).toHaveLength(0);
});
```

**Razão:**

- ✅ **Baseline**: Garante que DTO válido passa
- ✅ **Documentação**: Mostra exemplo de uso correto

#### 3. Testes de Validação

**Pattern:**

```typescript
it('deve rejeitar email inválido', async () => {
  const dto = { ...validDto, email: 'invalid-email' };
  const errors = await validateDto(dto);

  expect(errors).toHaveLength(1);
  expect(errors[0].property).toBe('email');
  expect(errors[0].constraints?.isEmail).toBeDefined();
});
```

**Razão:**

- ✅ **Field-level**: Testa cada campo isoladamente
- ✅ **Constraints**: Verifica decorator correto (isEmail, minLength)
- ✅ **Edge cases**: Valores vazios, null, undefined, formatos inválidos

#### 4. Testes de Enums

**Pattern:**

```typescript
it('deve aceitar apenas valores do enum UserType', async () => {
  const invalidDto = { ...validDto, userType: 'invalid' };
  const errors = await validateDto(invalidDto);

  expect(errors[0].constraints?.isEnum).toBeDefined();
});
```

**Razão:**

- ✅ **Type safety**: Garante apenas valores permitidos
- ✅ **Runtime validation**: TypeScript não valida em runtime

**Cobertura alcançada:** 106 testes, ~70% dos DTOs principais

---

## Testes de Controllers

### Decisão: Testar apenas camada HTTP, mockar services

#### 1. Setup com TestingModule

**Design:**

```typescript
describe('UsersController', () => {
  let controller: UsersController;
  let mockUsersService: MockUsersService;

  beforeEach(async () => {
    mockUsersService = createMockUsersService();

    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get(UsersController);
    jest.clearAllMocks();
  });
});
```

**Razão:**

- ✅ **Isolamento**: Testa apenas lógica do controller
- ✅ **Velocidade**: Não executa services reais
- ✅ **NestJS DI**: Usa injeção de dependência real

#### 2. Testes de Endpoints

**Pattern:**

```typescript
it('deve retornar usuário por ID', async () => {
  // Arrange
  const user = createUser({ id: 1 });
  mockUsersService.findOne.mockResolvedValue(user);

  // Act
  const result = await controller.findOne('1');

  // Assert
  expect(mockUsersService.findOne).toHaveBeenCalledWith(1);
  expect(result).toEqual(user);
});
```

**Razão:**

- ✅ **Param parsing**: Testa conversão de string para number
- ✅ **Service call**: Verifica chamada correta
- ✅ **Response**: Valida retorno

#### 3. Testes de Validação de Params

**Pattern:**

```typescript
it('deve lançar BadRequestException para ID inválido', async () => {
  await expect(controller.findOne('invalid')).rejects.toThrow(
    BadRequestException,
  );

  expect(mockUsersService.findOne).not.toHaveBeenCalled();
});
```

**Razão:**

- ✅ **Validation**: ParseIntPipe rejeita IDs inválidos
- ✅ **Early return**: Service não é chamado
- ✅ **HTTP status**: BadRequestException = 400

#### 4. Testes de Query Params

**Pattern:**

```typescript
it('deve filtrar por associationId quando fornecido', async () => {
  const users = [createUser()];
  mockUsersService.findAll.mockResolvedValue(users);

  await controller.findAll('10');

  expect(mockUsersService.findAll).toHaveBeenCalledWith(10);
});
```

**Razão:**

- ✅ **Optional params**: Testa com e sem query params
- ✅ **Conversion**: Valida ParseIntPipe em queries
- ✅ **Filtering**: Confirma filtro aplicado

#### 5. Testes de Error Handling

**Pattern:**

```typescript
it('deve propagar NotFoundException do service', async () => {
  mockUsersService.findOne.mockRejectedValue(
    new NotFoundException('Usuário não encontrado'),
  );

  await expect(controller.findOne('1')).rejects.toThrow(NotFoundException);
});
```

**Razão:**

- ✅ **Exception propagation**: Controller não deve engolir erros
- ✅ **HTTP status**: NotFoundException = 404
- ✅ **Error messages**: Mensagem preservada

#### 6. Decisão: Response Wrappers

**Alguns controllers retornam:**

```typescript
return {
  statusCode: 200,
  message: 'Animal criado com sucesso',
  data: animal,
};
```

**Outros retornam diretamente:**

```typescript
return user;
```

**Razão para diferença:**

- ✅ **Consistência com código existente**: Mantive padrão do projeto
- ✅ **Flexibilidade**: Permite customizar response por endpoint
- ⚠️ **Ideal futuro**: Usar Interceptors para padronizar globalmente

**Testes adaptados:**

```typescript
// Para wrappers
expect(result).toEqual({
  statusCode: 200,
  message: expect.any(String),
  data: animal,
});

// Para retorno direto
expect(result).toEqual(user);
```

**Cobertura alcançada:** 82 testes, 100% dos 7 controllers

---

## Padrões e Convenções

### 1. Nomenclatura de Testes

**Padrão adotado:**

```typescript
it('deve [ação esperada] quando [condição]', () => {
  // teste
});
```

**Exemplos:**

- ✅ "deve criar usuário com sucesso"
- ✅ "deve lançar ConflictException quando email já existe"
- ✅ "deve retornar lista vazia quando não houver usuários"

**Razão:**

- ✅ **Português**: Time é brasileiro
- ✅ **Legibilidade**: Lê como especificação
- ✅ **Clareza**: Contexto e expectativa explícitos

### 2. Assertions

**Pattern preferido:**

```typescript
// ✅ Bom: Assertions específicas
expect(user.id).toBe(1);
expect(user.name).toBe('João');
expect(mockService.create).toHaveBeenCalledWith(dto);

// ❌ Evitar: Assertions genéricas
expect(user).toBeDefined();
expect(result).toBeTruthy();
```

**Razão:**

- ✅ **Precisão**: Falhas mostram exatamente o que quebrou
- ✅ **Debugging**: Menos tempo investigando

### 3. Describe Blocks

**Organização:**

```typescript
describe('EntityOrService', () => {
  describe('methodName', () => {
    it('deve testar caso 1', () => {});
    it('deve testar caso 2', () => {});
  });
});
```

**Razão:**

- ✅ **Hierarquia clara**: Entidade → Método → Casos
- ✅ **Navegação**: Fácil encontrar testes
- ✅ **Reports**: Saída organizada no console

### 4. beforeEach vs beforeAll

**Decisão: Usar beforeEach**

```typescript
beforeEach(async () => {
  // Setup fresh para cada teste
  mockRepo = createMockUserRepository();
  jest.clearAllMocks();
});
```

**Razão:**

- ✅ **Isolamento**: Cada teste começa limpo
- ✅ **Debugging**: Falha em um teste não afeta outros
- ⚠️ **Performance**: Imperceptível em testes unitários (<0.1ms overhead)

**Quando usar beforeAll:**

- Apenas para setup pesado (DB, servidor HTTP)
- Apenas em testes de integração/e2e

### 5. Mock Return Values

**Pattern:**

```typescript
// ✅ Bom: mockResolvedValue para Promises
mockRepo.findById.mockResolvedValue(user);

// ✅ Bom: mockReturnValue para síncronos
mockHashService.hash.mockReturnValue('hashed');

// ❌ Evitar: mockImplementation sem necessidade
mockRepo.findById.mockImplementation(async (id) => {
  return user;
});
```

**Razão:**

- ✅ **Simplicidade**: mockResolvedValue é mais legível
- ✅ **Performance**: Menos overhead
- ✅ **Manutenção**: Menos código para quebrar

### 6. Type Casting em Testes

**Decisão: Cast para 'any' quando necessário**

```typescript
// ✅ Permitido em testes
const dto = {
  ...validDto,
  phoneNumber: '11999999999', // Campo que não existe no tipo
} as any;
```

**Razão:**

- ✅ **Flexibilidade**: Permite testar edge cases
- ✅ **Pragmatismo**: Testes não precisam ser 100% type-safe
- ⚠️ **Cuidado**: Usar apenas quando realmente necessário

---

## Próximos Passos

### Passo 7: Infrastructure (Estimativa: 40-60 testes)

**Componentes:**

1. **Repositories**
   - PrismaUserRepository
   - PrismaAnimalRepository
   - PrismaDailyCollectionRepository
   - PrismaInviteRepository

**Decisão pendente: Integration vs Unit**

**Opção A: Integration Tests (Recomendado)**

```typescript
describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasourceUrl: process.env.TEST_DATABASE_URL,
    });
    await prisma.$connect();
  });

  beforeEach(async () => {
    // Limpar tabelas
    await prisma.user.deleteMany();
  });
});
```

**Prós:**

- ✅ Testa SQL queries reais
- ✅ Detecta problemas de schema
- ✅ Valida transformações de dados

**Contras:**

- ❌ Requer Docker/PostgreSQL
- ❌ Mais lento (~1-2s por suite)
- ❌ Setup mais complexo

**Opção B: Unit Tests**

```typescript
describe('PrismaUserRepository', () => {
  let repository: PrismaUserRepository;
  let mockPrisma: MockPrismaClient;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    repository = new PrismaUserRepository(mockPrisma);
  });
});
```

**Prós:**

- ✅ Rápido
- ✅ Sem dependências externas
- ✅ Fácil setup

**Contras:**

- ❌ Não testa SQL real
- ❌ Pode perder bugs de query
- ❌ Mock complexo

**Recomendação: Opção A (Integration)**

- Infrastructure é crítico demais
- Bugs de query são caros em produção
- Performance ainda aceitável (<5s total)

2. **Hash/Token Services**
   - BcryptHashService
   - JwtTokenService

**Pattern sugerido: Unit tests**

```typescript
describe('BcryptHashService', () => {
  it('deve hashear senha', async () => {
    const service = new BcryptHashService();
    const hashed = await service.hash('password123');

    expect(hashed).not.toBe('password123');
    expect(hashed).toMatch(/^\$2[aby]\$/); // bcrypt pattern
  });

  it('deve comparar senha correta', async () => {
    const service = new BcryptHashService();
    const hashed = await service.hash('password123');

    const isValid = await service.compare('password123', hashed);
    expect(isValid).toBe(true);
  });
});
```

### Passo 8: Cross-Cutting Concerns (Estimativa: 30-40 testes)

1. **MailService**

   - Mockar MailerService
   - Validar templates
   - Testar retry logic

2. **Event Listeners**

   - EmailListener
   - InviteEmailListener
   - Verificar eventos corretos

3. **Exception Filters**
   - PrismaExceptionFilter
   - Mapear códigos Prisma para HTTP status

### Passo 9: E2E Tests (Estimativa: 25-35 testes)

**Setup:**

```typescript
describe('Auth Flow (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });
});
```

**Fluxos críticos:**

1. Autenticação completa
2. Sistema de convites
3. Registro de coletas
4. CRON de limpeza
5. Notificações

### Passo 10: CI/CD

**GitHub Actions:**

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
      - run: npm run test:e2e
      - run: npm run test:coverage
```

---

## Métricas Atuais

### Cobertura por Camada

| Camada                   | Arquivos | Testes  | Coverage |
| ------------------------ | -------- | ------- | -------- |
| Domain                   | 4        | 90      | 100%     |
| Application Services     | 8        | 124     | 100%     |
| Application DTOs         | 5        | 106     | ~70%     |
| Presentation Controllers | 7        | 82      | 100%     |
| **TOTAL**                | **24**   | **402** | **~85%** |

### Performance

- **Testes Unitários**: ~28s para 402 testes
- **Média por teste**: ~70ms
- **Suites em paralelo**: Sim (Jest workers)
- **Coverage collection**: +5s overhead

### Qualidade

- **Flaky tests**: 0
- **Skipped tests**: 0
- **Warnings**: 0
- **Falsos positivos**: 0

---

## Lições Aprendidas

### ✅ O que funcionou bem

1. **Factories**: Economizaram 70% de código duplicado
2. **Mock centralizados**: Evitaram inconsistências
3. **Separação unit/integration**: Permitiu TDD rápido
4. **AAA Pattern**: Testes muito legíveis
5. **TypeScript strict**: Pegou bugs cedo

### ⚠️ Desafios Enfrentados

1. **DTO field mismatches**: Factories desatualizadas
   - Solução: Review regular de factories vs entities
2. **Enum import paths**: Mudanças na estrutura
   - Solução: Path aliases centralizados
3. **HttpException vs raw errors**: Controllers inconsistentes
   - Solução: Padronizar wrappers via Interceptors (futuro)
4. **TypeScript strict em testes**: Cast para 'any' necessário
   - Solução: Aceitar pragmatismo em testes

### 🎯 Recomendações

1. **Rodar testes antes de commit**: Husky + lint-staged
2. **Coverage threshold**: 80% em services críticos
3. **Revisar factories**: A cada mudança de schema
4. **Integration tests**: Repositories e serviços externos
5. **E2E**: Fluxos críticos de negócio

---

## Conclusão

A arquitetura de testes atual está **sólida e escalável**, com:

- ✅ 402 testes passando (100% success rate)
- ✅ ~85% de cobertura nas camadas críticas
- ✅ Performance excelente (<30s)
- ✅ Padrões consistentes e documentados
- ✅ Fácil manutenção e extensão

**Próximos marcos:**

1. Infrastructure tests (repositories com DB real)
2. E2E para fluxos críticos
3. CI/CD com coverage reports
4. Threshold de coverage no pipeline

**Estimativa total final:** ~550-600 testes quando completo

---

_Documento criado em: Novembro 2025_  
_Versão: 1.0_  
_Autor: Equipe Qualeider_
