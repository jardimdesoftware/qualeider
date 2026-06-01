import { setupE2ETests, teardownE2ETests, E2E_TIMEOUT } from '../setup';
import { TestApp } from '../helpers';
import { AssociationFactory, UserFactory, AnimalFactory, DailyCollectionFactory } from '../factories';
import { HttpStatus } from '@nestjs/common';

describe('E2E: Associations - Relatórios', () => {
  let testApp: TestApp;
  let associationToken: string;
  let associationId: number;
  let producer1Id: number;
  let producer2Id: number;
  let animal1Id: number;
  let animal2Id: number;

  let globalToday: Date;
  let globalYesterday: Date;

  beforeAll(async () => {
    await setupE2ETests();
    testApp = new TestApp();
    await testApp.setup();

    globalToday = new Date();
    globalToday.setHours(12, 0, 0, 0);
    
    // Garante que globalYesterday fica no mesmo mes que globalToday e nao e data futura.
    // Se hoje e dia 1, usa a mesma data (ambas as coletas no mesmo dia, porem sao registros distintos).
    globalYesterday = new Date(globalToday);
    if (globalToday.getDate() > 1) {
      globalYesterday.setDate(globalYesterday.getDate() - 1);
    }

    const association = AssociationFactory.build();
    const createResponse = await testApp
      .request()
      .post('/associations')
      .send(association);
    
    associationId = createResponse.body.data.id;

    const loginResponse = await testApp
      .request()
      .post('/auth/login')
      .send({
        email: association.email,
        password: association.password,
      });

    associationToken = loginResponse.body.data.access_token;

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

    const p1Login = await testApp
      .request()
      .post('/auth/login')
      .send({ email: producer1Data.email, password: producer1Data.password })
      .expect(HttpStatus.OK);
    const p1Token = p1Login.body.data.access_token;

    const producer2Data = UserFactory.build({ associationId });
    const producer2Response = await testApp
      .request()
      .post('/users')
      .send(producer2Data)
      .expect(HttpStatus.CREATED);
    
    if (!producer2Response.body.data || !producer2Response.body.data.id) {
      throw new Error(`Failed to create producer2. Response: ${JSON.stringify(producer2Response.body.data)}`);
    }
    producer2Id = producer2Response.body.data.id;

    const p2Login = await testApp
      .request()
      .post('/auth/login')
      .send({ email: producer2Data.email, password: producer2Data.password })
      .expect(HttpStatus.OK);
    const p2Token = p2Login.body.data.access_token;

    const animal1Response = await testApp
      .request()
      .post('/animals')
      .set('Authorization', `Bearer ${p1Token}`)
      .send(AnimalFactory.build({ userId: producer1Id }))
      .expect(HttpStatus.CREATED);
    animal1Id = animal1Response.body.data.id;
    
    const animal2Response = await testApp
      .request()
      .post('/animals')
      .set('Authorization', `Bearer ${p2Token}`)
      .send(AnimalFactory.build({ userId: producer2Id }))
      .expect(HttpStatus.CREATED);
    animal2Id = animal2Response.body.data.id;

    await testApp
      .request()
      .post('/daily-collections')
      .set('Authorization', `Bearer ${p1Token}`)
      .send(DailyCollectionFactory.build({ 
        userId: producer1Id,
        quantity: 100,
        items: [{ animalId: animal1Id, quantity: 100 }],
        collectionDate: globalToday.toISOString().split('T')[0],
      }))
      .expect(HttpStatus.CREATED);

    await testApp
      .request()
      .post('/daily-collections')
      .set('Authorization', `Bearer ${p1Token}`)
      .send(DailyCollectionFactory.build({ 
        userId: producer1Id, 
        quantity: 80,
        items: [{ animalId: animal1Id, quantity: 80 }],
        collectionDate: globalYesterday.toISOString().split('T')[0],
      }))
      .expect(HttpStatus.CREATED);

    await testApp
      .request()
      .post('/daily-collections')
      .set('Authorization', `Bearer ${p2Token}`)
      .send(DailyCollectionFactory.build({ 
        userId: producer2Id, 
        quantity: 50,
        items: [{ animalId: animal2Id, quantity: 50 }],
        collectionDate: globalToday.toISOString().split('T')[0],
      }))
      .expect(HttpStatus.CREATED);

    await testApp
      .request()
      .post('/daily-collections')
      .set('Authorization', `Bearer ${p2Token}`)
      .send(DailyCollectionFactory.build({ 
        userId: producer2Id, 
        quantity: 60,
        items: [{ animalId: animal2Id, quantity: 60 }],
        collectionDate: globalYesterday.toISOString().split('T')[0],
      }))
      .expect(HttpStatus.CREATED);
  }, E2E_TIMEOUT);

  afterAll(async () => {
    if (testApp) await testApp.close();
    await teardownE2ETests();
  });

  describe('GET /associations/reports/producer-ranking', () => {
    it('deve retornar ranking de produtores ordenado por produção total', async () => {
      const response = await testApp
        .request()
        .get('/associations/reports/producer-ranking')
        .set('Authorization', `Bearer ${associationToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);

      expect(response.body.data[0].rank).toBe(1);
      expect(response.body.data[0].totalProduction).toBeGreaterThan(response.body.data[1].totalProduction);
      expect(response.body.data[1].rank).toBe(2);

      expect(response.body.data[0]).toHaveProperty('id');
      expect(response.body.data[0]).toHaveProperty('name');
      expect(response.body.data[0]).toHaveProperty('totalProduction');
      expect(response.body.data[0]).toHaveProperty('animalsCount');
      expect(response.body.data[0]).toHaveProperty('avgProductionPerDay');
      expect(response.body.data[0]).toHaveProperty('rank');
    });

    it('deve filtrar ranking por data de início', async () => {
      const startOfToday = new Date(globalToday);
      startOfToday.setHours(0, 0, 0, 0);

      const response = await testApp
        .request()
        .get(`/associations/reports/producer-ranking?startDate=${startOfToday.toISOString().split('T')[0]}`)
        .set('Authorization', `Bearer ${associationToken}`)
        .expect(HttpStatus.OK);

      expect(Array.isArray(response.body.data)).toBe(true);
      
      const producer1 = response.body.data.find((p: any) => p.id === producer1Id);
      expect(producer1).toBeDefined();
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

      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
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

      expect(response.body.data).toHaveProperty('month');
      expect(response.body.data).toHaveProperty('totalProduction');
      expect(response.body.data).toHaveProperty('totalProducers');
      expect(response.body.data).toHaveProperty('averagePerProducer');
      expect(response.body.data).toHaveProperty('totalAnimals');
      expect(response.body.data).toHaveProperty('totalCollections');
      expect(response.body.data).toHaveProperty('avgPerAnimal');

      expect(response.body.data.totalProducers).toBe(2);
      expect(response.body.data.totalAnimals).toBe(2);
      expect(response.body.data.totalCollections).toBe(4);
      
      expect(response.body.data.totalProduction).toBeGreaterThanOrEqual(280);
      expect(response.body.data.totalProduction).toBeLessThanOrEqual(300);
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

      expect(response.body.data.totalProduction).toBe(0);
      expect(response.body.data.totalProducers).toBe(0);
      expect(response.body.data.totalCollections).toBe(0);
    });
  });

  describe('Fluxo Completo de Relatórios', () => {
    it('deve buscar ranking e relatório mensal na mesma sessão', async () => {
      const rankingResponse = await testApp
        .request()
        .get('/associations/reports/producer-ranking')
        .set('Authorization', `Bearer ${associationToken}`)
        .expect(HttpStatus.OK);

      expect(rankingResponse.body.data.length).toBeGreaterThan(0);

      const year = globalToday.getFullYear();
      const month = globalToday.getMonth() + 1;
      
      const monthlyResponse = await testApp
        .request()
        .get(`/associations/reports/monthly?year=${year}&month=${month}`)
        .set('Authorization', `Bearer ${associationToken}`)
        .expect(HttpStatus.OK);

      expect(monthlyResponse.body.data.totalProducers).toBeGreaterThan(0);

      const activeProducersInRanking = rankingResponse.body.data.filter(
        (p: any) => p.totalProduction > 0
      ).length;
      
      expect(monthlyResponse.body.data.totalProducers).toBe(activeProducersInRanking);
    });
  });
});
