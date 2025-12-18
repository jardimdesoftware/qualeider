import { setupE2ETests, teardownE2ETests } from '../setup';
import { TestApp } from '../helpers';
import { AssociationFactory, UserFactory, AnimalFactory, DailyCollectionFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

describe('E2E: Associations - Relatórios', () => {
  let testApp: TestApp;
  let associationToken: string;
  let associationId: number;
  let producer1Id: number;
  let producer2Id: number;

  // Variáveis para garantir consistência de data entre o setup e os testes
  let globalToday: Date;
  let globalYesterday: Date;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();

    // FIX: Estabelecer datas fixas no meio do dia para evitar problemas de Timezone/Borda
    globalToday = new Date();
    globalToday.setHours(12, 0, 0, 0);
    
    globalYesterday = new Date(globalToday);
    globalYesterday.setDate(globalYesterday.getDate() - 1);

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

    associationToken = loginResponse.body.data.access_token;

    // Criar Produtor 1 e pegar TOKEN
    const producer1Data = UserFactory.build({ associationId });
    const producer1Response = await testApp
      .request()
      .post('/users')
      .send(producer1Data)
      .expect(HttpStatus.CREATED);
    
    if (!producer1Response.body.data || !producer1Response.body.data.id) {
      throw new Error(`Failed to create producer1. Response: ${JSON.stringify(producer1Response.body)}`);
    }
    producer1Id = producer1Response.body.data.id;

    // FIX: Login Produtor 1 (Necessário para criar coletas!)
    const p1Login = await testApp
      .request()
      .post('/auth/login')
      .send({ email: producer1Data.email, password: producer1Data.password })
      .expect(HttpStatus.OK);
    const p1Token = p1Login.body.data.access_token;

    // Criar Produtor 2 e pegar TOKEN
    const producer2Data = UserFactory.build({ associationId });
    const producer2Response = await testApp
      .request()
      .post('/users')
      .send(producer2Data)
      .expect(HttpStatus.CREATED);
    
    if (!producer2Response.body.data || !producer2Response.body.data.id) {
      throw new Error(`Failed to create producer2. Response: ${JSON.stringify(producer2Response.body)}`);
    }
    producer2Id = producer2Response.body.data.id;

    // FIX: Login Produtor 2
    const p2Login = await testApp
      .request()
      .post('/auth/login')
      .send({ email: producer2Data.email, password: producer2Data.password })
      .expect(HttpStatus.OK);
    const p2Token = p2Login.body.data.access_token;

    // FIX: Criar animais COM AUTH
    await testApp
      .request()
      .post('/animals')
      .set('Authorization', `Bearer ${p1Token}`)
      .send(AnimalFactory.build({ userId: producer1Id }))
      .expect(HttpStatus.CREATED);
    
    await testApp
      .request()
      .post('/animals')
      .set('Authorization', `Bearer ${p2Token}`)
      .send(AnimalFactory.build({ userId: producer2Id }))
      .expect(HttpStatus.CREATED);

    // FIX: Criar coletas diárias COM AUTH
    // Produtor 1: 100L hoje, 80L ontem
    await testApp
      .request()
      .post('/daily-collections')
      .set('Authorization', `Bearer ${p1Token}`)
      .send(DailyCollectionFactory.build({ 
        userId: producer1Id,
        quantity: 100,
        collectionDate: globalToday.toISOString(),
        items: [] 
      }))
      .expect(HttpStatus.CREATED);

    await testApp
      .request()
      .post('/daily-collections')
      .set('Authorization', `Bearer ${p1Token}`)
      .send(DailyCollectionFactory.build({ 
        userId: producer1Id, 
        quantity: 80,
        collectionDate: globalYesterday.toISOString(),
        items: [] 
      }))
      .expect(HttpStatus.CREATED);

    // Produtor 2: 50L hoje, 60L ontem
    await testApp
      .request()
      .post('/daily-collections')
      .set('Authorization', `Bearer ${p2Token}`)
      .send(DailyCollectionFactory.build({ 
        userId: producer2Id, 
        quantity: 50,
        collectionDate: globalToday.toISOString(),
        items: [] 
      }))
      .expect(HttpStatus.CREATED);

    await testApp
      .request()
      .post('/daily-collections')
      .set('Authorization', `Bearer ${p2Token}`)
      .send(DailyCollectionFactory.build({ 
        userId: producer2Id, 
        quantity: 60,
        collectionDate: globalYesterday.toISOString(),
        items: [] 
      }))
      .expect(HttpStatus.CREATED);
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
      // FIX: Usar o INÍCIO do dia para o filtro
      const startOfToday = new Date(globalToday);
      startOfToday.setHours(0, 0, 0, 0);

      const response = await testApp
        .request()
        .get(`/associations/reports/producer-ranking?startDate=${startOfToday.toISOString()}`)
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

      const newToken = loginResponse.body.data.access_token;

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
      const year = globalToday.getFullYear();
      const month = globalToday.getMonth() + 1;

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
      const year = globalToday.getFullYear();
      const month = globalToday.getMonth() + 1;
      
      const monthlyResponse = await testApp
        .request()
        .get(`/associations/reports/monthly?year=${year}&month=${month}`)
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
