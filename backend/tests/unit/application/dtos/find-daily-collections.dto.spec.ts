import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FindDailyCollectionsDto } from '@/application/dtos/daily-collections/find-daily-collections.dto';

describe('FindDailyCollectionsDto', () => {
  it('deve transformar strings numéricas em números', async () => {
    const plain = {
      userId: '456',
    };
    
    const dto = plainToInstance(FindDailyCollectionsDto, plain);
    
    expect(dto.userId).toBe(456);
    expect(typeof dto.userId).toBe('number');
  });

  it('deve validar dados válidos', async () => {
    const plain = {
      userId: 1,
      startDate: '2023-01-01',
      endDate: '2023-01-31',
    };
    
    const dto = plainToInstance(FindDailyCollectionsDto, plain);
    const errors = await validate(dto);
    
    expect(errors.length).toBe(0);
  });

  it('deve permitir que campos opcionais sejam indefinidos', async () => {
    const plain = {};
    const dto = plainToInstance(FindDailyCollectionsDto, plain);
    const errors = await validate(dto);
    
    expect(errors.length).toBe(0);
  });

  it('deve falhar na validação se os tipos estiverem incorretos', async () => {
    const plain = {
      userId: 'also-not-a-number',
      startDate: 'invalid-date',
      endDate: 'invalid-date',
    };

    const dto = plainToInstance(FindDailyCollectionsDto, plain);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const properties = errors.map(e => e.property);
    expect(properties).toContain('userId');
    expect(properties).toContain('startDate');
    expect(properties).toContain('endDate');
  });
});
