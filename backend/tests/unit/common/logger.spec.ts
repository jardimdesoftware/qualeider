import { sanitizeData } from '@/common/logger/logger.config';

describe('Logger Sanitization Logic', () => {
  
  it('deve mascarar chaves sensíveis no primeiro nível', () => {
    const input = {
      name: 'Marcelo',
      password: '123',
      email: 'marcelo@teste.com'
    };
    
    const result = sanitizeData(input);
    
    expect(result.password).toBe('***[REDACTED]***');
    expect(result.name).toBe('Marcelo'); // Garante que não estragou o resto
  });

  it('deve mascarar chaves sensíveis em objetos aninhados (recursividade)', () => {
    const input = {
      user: {
        profile: {
          password: 'password1234',
          address: 'Rua X'
        }
      }
    };

    const result = sanitizeData(input);

    expect(result.user.profile.password).toBe('***[REDACTED]***');
    expect(result.user.profile.address).toBe('Rua X');
  });

  it('deve mascarar chaves sensíveis dentro de arrays', () => {
    const input = {
      users: [
        { id: 1, token: 'abc-123' },
        { id: 2, token: 'xyz-987' }
      ]
    };

    const result = sanitizeData(input);

    expect(result.users[0].token).toBe('***[REDACTED]***');
    expect(result.users[1].token).toBe('***[REDACTED]***');
    expect(result.users[0].id).toBe(1);
  });

  it('deve lidar com inputs que não são objetos (strings, null, undefined)', () => {
    expect(sanitizeData('apenas uma string')).toBe('apenas uma string');
    expect(sanitizeData(null)).toBe(null);
    expect(sanitizeData(undefined)).toBe(undefined);
  });
});