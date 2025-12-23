import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FindAnimalsDto } from '@/application/dtos/animals/find-animals.dto';
import { AnimalType } from '@/domain/enums/enums';

describe('FindAnimalsDto', () => {
  it('deve transformar strings numéricas em números', async () => {
    const plain = {
      associationId: '123',
      userId: '456',
    };
    
    const dto = plainToInstance(FindAnimalsDto, plain);
    
    expect(dto.associationId).toBe(123);
    expect(dto.userId).toBe(456);
    expect(typeof dto.associationId).toBe('number');
    expect(typeof dto.userId).toBe('number');
  });

  it('deve validar dados válidos', async () => {
    const plain = {
      associationId: 1,
      userId: 1,
      status: 'Active',
      animalType: AnimalType.Vaca,
    };
    
    const dto = plainToInstance(FindAnimalsDto, plain);
    const errors = await validate(dto);
    
    expect(errors.length).toBe(0);
  });

  it('deve permitir que campos opcionais sejam indefinidos', async () => {
    const plain = {};
    const dto = plainToInstance(FindAnimalsDto, plain);
    const errors = await validate(dto);
    
    expect(errors.length).toBe(0);
  });

  it('deve falhar na validação se os tipos estiverem incorretos', async () => {
    const plain = {
      associationId: 'not-a-number',
      userId: 'also-not-a-number',
      status: 'InvalidStatus',
      animalType: 'InvalidType',
    };

    const dto = plainToInstance(FindAnimalsDto, plain);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const properties = errors.map(e => e.property);
    expect(properties).toContain('associationId');
    expect(properties).toContain('userId');
    expect(properties).toContain('status');
    expect(properties).toContain('animalType');
  });
});
