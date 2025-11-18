import { TestApp } from './test-app';
import { UserCategory, Status } from '@/domain/enums/enums';
import * as bcrypt from 'bcryptjs';

/**
 * Dados de usuário para testes
 */
export interface TestUser {
  id?: number;
  name: string;
  email: string;
  password: string;
  userCategory: UserCategory;
  city: string;
  state: string;
  status?: Status;
  associationId?: number;
}

/**
 * Helper para autenticação em testes E2E
 */
export class AuthHelper {
  constructor(private testApp: TestApp) {}

  /**
   * Cria um usuário de teste no banco de dados
   */
  async createTestUser(userData: Partial<TestUser> = {}): Promise<TestUser> {
    const prisma = this.testApp.getPrismaService();

    const defaultUser: TestUser = {
      name: 'Usuário Teste',
      email: 'teste@example.com',
      password: 'senha123',
      userCategory: UserCategory.Fisica,
      city: 'São Paulo',
      state: 'SP',
      status: Status.Active,
      ...userData,
    };

    const hashedPassword = await bcrypt.hash(defaultUser.password, 10);

    const user = await prisma.user.create({
      data: {
        name: defaultUser.name,
        email: defaultUser.email,
        password: hashedPassword,
        userCategory: defaultUser.userCategory,
        city: defaultUser.city,
        state: defaultUser.state,
        status: defaultUser.status,
        associationId: defaultUser.associationId,
      },
    });

    return {
      ...defaultUser,
      id: user.id,
    };
  }

  /**
   * Faz login e retorna o token de acesso
   */
  async login(email: string, password: string): Promise<string> {
    const response = await this.testApp
      .request()
      .post('/auth/login')
      .send({ email, password })
      .expect(200); // ✅ Corrigido para 200 OK

    // ✅ Corrigido para acessar o token dentro do wrapper 'data'
    return response.body.data.access_token;
  }

  /**
   * Cria um usuário e faz login, retornando o token
   */
  async createUserAndLogin(
    userData: Partial<TestUser> = {},
  ): Promise<{ user: TestUser; token: string }> {
    const user = await this.createTestUser(userData);
    const token = await this.login(user.email, user.password);

    return { user, token };
  }

  /**
   * Cria um header de autorização com o token
   */
  authHeader(token: string): { Authorization: string } {
    return { Authorization: `Bearer ${token}` };
  }
}