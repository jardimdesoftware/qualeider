import { setupE2ETests, teardownE2ETests } from '../setup';
import { TestApp, AuthHelper } from '../helpers';
import { AssociationFactory, UserFactory, AnimalFactory, DailyCollectionFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

describe('E2E: Associations - Relatórios', () => {
  let testApp: TestApp;
  let authHelper: AuthHelper;
  let associationToken: string;
  let associationId: number;
  let producer1Id: number;
  let producer2Id: number;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();
    authHelper = new AuthHelper(testApp);

    // Criar associação e fazer login
    const association = AssociationFactory.build();
    const createResponse = await testApp
      .request()
      .post('/associations')
      .send(association);
    
    associationId = createResponse.body.data.id;

    // Login como associação
    const loginResponse = await testApp
      .request()
      .post('/auth/login')
      .send({
        email: association.email,
        password: association.password,
      });

    associationToken = loginResponse.body.access_token;

    // Criar 2 produtores vinculados à associação
    const producer1Data = UserFactory.build({ associationId });
    const producer1Response = await testApp
      .request()
      .post('/users')
      .send(producer1Data);
    producer1Id = producer1Response.body.data.id;

    const producer2Data = UserFactory.build({ associationId });
    const producer2Response = await testApp
      .request()
      .post('/users')
      .send(producer2Data);
    producer2Id = producer2Response.body.data.id;

    // Criar animais para os produtores
    await testApp
      .request()
      .post('/animals')
      .send(AnimalFactory.build({ userId: producer1Id }));
    
    await testApp
      .request()
      .post('/animals')
      .send(AnimalFactory.build({ userId: producer2Id }));

    // Criar coletas diárias para os produtores
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Produtor 1: 100L hoje, 80L ontem
    await testApp
      .request()
      .post('/daily-collections')
      .send(DailyCollectionFactory.build({ 
        userId: producer1Id, 
        quantity: 100,
        collectionDate: today.toISOString()
      }));

    await testApp
      .request()
      .post('/daily-collections')
      .send(DailyCollectionFactory.build({ 
        userId: producer1Id, 
        quantity: 80,
        collectionDate: yesterday.toISOString()
      }));

    // Produtor 2: 50L hoje, 60L ontem
    await testApp
      .request()
      .post('/daily-collections')
      .send(DailyCollectionFactory.build({ 
        userId: producer2Id, 
        quantity: 50,
        collectionDate: today.toISOString()
      }));

    await testApp
      .request()
      .post('/daily-collections')
      .send(DailyCollectionFactory.build({ 
        userId: producer2Id, 
        quantity: 60,
        collectionDate: yesterday.toISOString()
      }));
  });

  afterAll(async () => {
    await testApp.close();
    await teardownE2ETests();
  });

  describe('GET /associations/reports/producer-ranking', () => {
    it('deve retornar ranking de produtores ordenado por produção total', async () => {
      const response = await testApp
        .request()
        .get('/associations/reports/producer-ranking')
        .set('Authorization', `Bearer ${associationToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      // Verificar que está ordenado (produtor 1 com 180L total deve ser o primeiro)
      expect(response.body[0].rank).toBe(1);
      expect(response.body[0].totalProduction).toBeGreaterThan(response.body[1].totalProduction);
      expect(response.body[1].rank).toBe(2);

      // Verificar estrutura do DTO
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('totalProduction');
      expect(response.body[0]).toHaveProperty('animalsCount');
      expect(response.body[0]).toHaveProperty('avgProductionPerDay');
      expect(response.body[0]).toHaveProperty('rank');
    });

    it('deve filtrar ranking por data de início', async () => {
      const today = new Date();
      const response = await testApp
        .request()
        .get(`/associations/reports/producer-ranking?startDate=${today.toISOString()}`)
        .set('Authorization', `Bearer ${associationToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      
      // Verificar que considerou apenas coletas de hoje
      const producer1 = response.body.find((p: any) => p.id === producer1Id);
      expect(producer1).toBeDefined();
      // A produção deve ser aproximadamente 100L (apenas hoje)
      expect(producer1.totalProduction).toBeGreaterThanOrEqual(90);
      expect(producer1.totalProduction).toBeLessThanOrEqual(110);
    });

    it('deve retornar 401 sem autenticação', async () => {
      await testApp
        .request()
        .get('/associations/reports/producer-ranking')
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('deve retornar array vazio se não houver produtores', async () => {
      // Criar nova associação sem produtores
      const newAssociation = AssociationFactory.build();
      await testApp.request().post('/associations').send(newAssociation);

      const loginResponse = await testApp
        .request()
        .post('/auth/login')
        .send({
          email: newAssociation.email,
          password: newAssociation.password,
        });

      const newToken = loginResponse.body.access_token;

      const response = await testApp
        .request()
        .get('/associations/reports/producer-ranking')
        .set('Authorization', `Bearer ${newToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });

  describe('GET /associations/reports/monthly', () => {
    it('deve retornar relatório mensal agregado', async () => {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      const response = await testApp
        .request()
        .get(`/associations/reports/monthly?year=${year}&month=${month}`)
        .set('Authorization', `Bearer ${associationToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('month');
      expect(response.body).toHaveProperty('totalProduction');
      expect(response.body).toHaveProperty('totalProducers');
      expect(response.body).toHaveProperty('averagePerProducer');
      expect(response.body).toHaveProperty('totalAnimals');
      expect(response.body).toHaveProperty('totalCollections');
      expect(response.body).toHaveProperty('avgPerAnimal');

      // Verificar valores calculados
      expect(response.body.totalProducers).toBe(2);
      expect(response.body.totalAnimals).toBe(2);
      expect(response.body.totalCollections).toBe(4); // 2 produtores x 2 coletas
      
      // Total de produção deve ser 100 + 80 + 50 + 60 = 290
      expect(response.body.totalProduction).toBeGreaterThanOrEqual(280);
      expect(response.body.totalProduction).toBeLessThanOrEqual(300);
    });

    it('deve retornar 400 se parâmetros obrigatórios estiverem faltando', async () => {
      await testApp
        .request()
        .get('/associations/reports/monthly')
        .set('Authorization', `Bearer ${associationToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 400 se year estiver faltando', async () => {
      await testApp
        .request()
        .get('/associations/reports/monthly?month=12')
        .set('Authorization', `Bearer ${associationToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 400 se month estiver faltando', async () => {
      await testApp
        .request()
        .get('/associations/reports/monthly?year=2025')
        .set('Authorization', `Bearer ${associationToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('deve retornar 401 sem autenticação', async () => {
      const now = new Date();
      await testApp
        .request()
        .get(`/associations/reports/monthly?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
        .expect(HttpStatus.UNAUTHORIZED);
    });

    it('deve retornar relatório vazio para mês sem coletas', async () => {
      const response = await testApp
        .request()
        .get('/associations/reports/monthly?year=2020&month=1')
        .set('Authorization', `Bearer ${associationToken}`)
        .expect(HttpStatus.OK);

      expect(response.body.totalProduction).toBe(0);
      expect(response.body.totalProducers).toBe(0);
      expect(response.body.totalCollections).toBe(0);
    });
  });

  describe('Fluxo Completo de Relatórios', () => {
    it('deve buscar ranking e relatório mensal na mesma sessão', async () => {
      // Buscar ranking
      const rankingResponse = await testApp
        .request()
        .get('/associations/reports/producer-ranking')
        .set('Authorization', `Bearer ${associationToken}`)
        .expect(HttpStatus.OK);

      expect(rankingResponse.body.length).toBeGreaterThan(0);

      // Buscar relatório mensal
      const now = new Date();
      const monthlyResponse = await testApp
        .request()
        .get(`/associations/reports/monthly?year=${now.getFullYear()}&month=${now.getMonth() + 1}`)
        .set('Authorization', `Bearer ${associationToken}`)
        .expect(HttpStatus.OK);

      expect(monthlyResponse.body.totalProducers).toBeGreaterThan(0);

      // Os números devem ser consistentes
      const activeProducersInRanking = rankingResponse.body.filter(
        (p: any) => p.totalProduction > 0
      ).length;
      
      expect(monthlyResponse.body.totalProducers).toBe(activeProducersInRanking);
    });
  });
});
