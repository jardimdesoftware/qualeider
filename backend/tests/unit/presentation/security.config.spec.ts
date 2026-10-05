import { buildCorsOptions, isSwaggerPath } from '@/presentation/security.config';

describe('buildCorsOptions', () => {
  it('lista de origens: libera exatamente as informadas', () => {
    const { options } = buildCorsOptions('https://app.example.com,https://admin.example.com', true);

    expect(options.origin).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('normaliza espaços e barra final (um erro clássico de configuração)', () => {
    const { options } = buildCorsOptions(' https://app.example.com/ , https://admin.example.com// ', true);

    expect(options.origin).toEqual(['https://app.example.com', 'https://admin.example.com']);
  });

  it('nunca habilita credenciais (a auth é Bearer, não cookie)', () => {
    for (const [raw, prod] of [
      ['https://a.example.com', true],
      ['https://a.example.com', false],
      ['*', false],
      ['*', true],
      [undefined, true],
    ] as const) {
      expect(buildCorsOptions(raw, prod).options).not.toHaveProperty('credentials');
    }
  });

  describe('produção', () => {
    it('não adiciona localhost:3000 por conta própria', () => {
      const { options } = buildCorsOptions('https://app.example.com', true);

      expect(options.origin).not.toContain('http://localhost:3000');
    });

    it('sem CORS_ORIGINS não libera origem nenhuma (o frontend usa a mesma origem via nginx)', () => {
      expect(buildCorsOptions(undefined, true).options.origin).toBe(false);
      expect(buildCorsOptions('  ', true).options.origin).toBe(false);
    });

    it.each(['*', 'true', 'TRUE'])('curinga %p é ignorado, com aviso', (raw) => {
      const { options, warnings } = buildCorsOptions(raw, true);

      expect(options.origin).toBe(false);
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toMatch(/ignorado em produção/);
    });
  });

  describe('desenvolvimento', () => {
    it('inclui localhost:3000 para o frontend local', () => {
      expect(buildCorsOptions(undefined, false).options.origin).toEqual(['http://localhost:3000']);
      expect(buildCorsOptions('http://localhost:3001', false).options.origin).toEqual([
        'http://localhost:3001',
        'http://localhost:3000',
      ]);
    });

    it('não duplica localhost:3000 quando já listado', () => {
      const { options } = buildCorsOptions('http://localhost:3000', false);

      expect(options.origin).toEqual(['http://localhost:3000']);
    });

    it('curinga continua funcionando, sem credenciais', () => {
      const { options, warnings } = buildCorsOptions('*', false);

      expect(options.origin).toBe('*');
      expect(warnings).toEqual([]);
    });
  });
});

describe('isSwaggerPath', () => {
  it.each(['/api-docs', '/api-docs/', '/api-docs-json', '/api-docs-yaml', '/api-docs/swagger-ui-init.js'])(
    '%s é Swagger',
    (path) => expect(isSwaggerPath(path)).toBe(true),
  );

  it.each(['/', '/health', '/api/health', '/users', '/animals/api-docs'])('%s não é Swagger', (path) =>
    expect(isSwaggerPath(path)).toBe(false),
  );
});
