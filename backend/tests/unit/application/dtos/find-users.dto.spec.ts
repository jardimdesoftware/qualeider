import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FindUsersDto } from '@/application/dtos/users/find-users.dto';

describe('FindUsersDto', () => {
  it('deve transformar strings numéricas em números', async () => {
    const plain = {
      associationId: '123',
    };
    
    const dto = plainToInstance(FindUsersDto, plain);
    
    expect(dto.associationId).toBe(123);
    expect(typeof dto.associationId).toBe('number');
  });

  it('deve validar dados válidos', async () => {
    const plain = {
      associationId: 1,
      status: 'Active',
      emailContains: 'test',
    };
    
    const dto = plainToInstance(FindUsersDto, plain);
    const errors = await validate(dto);
    
    expect(errors.length).toBe(0);
  });

  it('deve permitir que campos opcionais sejam indefinidos', async () => {
    const plain = {};
    const dto = plainToInstance(FindUsersDto, plain);
    const errors = await validate(dto);
    
    expect(errors.length).toBe(0);
  });

  it('deve falhar na validação se os tipos estiverem incorretos', async () => {
    const plain = {
      associationId: 'not-a-number',
      status: 'InvalidStatus',
      emailContains: 123,
    };

    const dto = plainToInstance(FindUsersDto, plain);
    const errors = await validate(dto);

    expect(errors.length).toBeGreaterThan(0);
    const properties = errors.map(e => e.property);
    expect(properties).toContain('associationId');
    expect(properties).toContain('status');
    expect(properties).toContain('emailContains');
  });
});
