import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateAssociationDto } from '@/application/dtos/associations/create-association.dto';
import { IsCnpjUniqueConstraint } from '@/common/decorators/is-cnpj-unique.decorator';
import { IsAssociationEmailUniqueConstraint } from '@/common/decorators/is-association-email-unique.decorator';

describe('CreateAssociationDto', () => {
  beforeAll(() => {
    jest.spyOn(IsCnpjUniqueConstraint.prototype, 'validate').mockResolvedValue(true);
    jest.spyOn(IsAssociationEmailUniqueConstraint.prototype, 'validate').mockResolvedValue(true);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });
  const defaultValidDto = {
      name: 'Associação Teste',
      tradeName: 'AT',
      cnpj: '12345678000190',
      email: 'contato@teste.com',
      password: 'Senha@123',
      phone: '8737211234',
      zipCode: '55155000',
      state: 'PE',
      city: 'Belo Jardim',
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      coverageArea: 'Municipal',
      presidentName: 'João da Silva',
      presidentCpf: '12345678900',
      presidentEmail: 'presidente@email.com',
      presidentPhone: '87999999999',
  };

  it('valida um DTO válido', async () => {
    const dto = plainToInstance(CreateAssociationDto, defaultValidDto);
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });


  it('detecta campos obrigatórios ausentes', async () => {
    const dto = plainToInstance(CreateAssociationDto, {});
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    const requiredFields = [
      'name',
      'cnpj',
      'email',
      'password',
      'phone',
      'state',
      'city',
      'coverageArea',
    ];
    requiredFields.forEach((field) => {
      expect(errors.some((e) => e.property === field)).toBe(true);
    });
  });

  it('valida formato de CNPJ inválido', async () => {
    const dto = plainToInstance(CreateAssociationDto, {
      name: 'Associação Teste',
      cnpj: '123',
      email: 'contato@teste.com',
      password: 'Senha@123',
      phone: '8737211234',
      zipCode: '55155000',
      state: 'PE',
      city: 'Belo Jardim',
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      coverageArea: 'Municipal',
      presidentName: 'João da Silva',
      presidentCpf: '12345678900',
      presidentEmail: 'presidente@email.com',
      presidentPhone: '87999999999',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'cnpj')).toBe(true);
  });

  it('valida formato de email inválido', async () => {
    const dto = plainToInstance(CreateAssociationDto, {
      name: 'Associação Teste',
      cnpj: '12345678000190',
      email: 'email-invalido',
      password: 'Senha@123',
      phone: '8737211234',
      zipCode: '55155000',
      state: 'PE',
      city: 'Belo Jardim',
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      coverageArea: 'Municipal',
      presidentName: 'João da Silva',
      presidentCpf: '12345678900',
      presidentEmail: 'presidente@email.com',
      presidentPhone: '87999999999',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'email')).toBe(true);
  });

  it('valida formato de senha inválida', async () => {
    const dto = plainToInstance(CreateAssociationDto, {
      name: 'Associação Teste',
      cnpj: '12345678000190',
      email: 'contato@teste.com',
      password: 'senha',
      phone: '8737211234',
      zipCode: '55155000',
      state: 'PE',
      city: 'Belo Jardim',
      street: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      coverageArea: 'Municipal',
      presidentName: 'João da Silva',
      presidentCpf: '12345678900',
      presidentEmail: 'presidente@email.com',
      presidentPhone: '87999999999',
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'password')).toBe(true);
  });
  it('transforma CNPJ removendo caracteres não numéricos', async () => {
    const dto = plainToInstance(CreateAssociationDto, {
      ...defaultValidDto,
      cnpj: '12.345.678/0001-90',
    });
    await validate(dto);
    expect(dto.cnpj).toBe('12345678000190');
  });

  it('transforma email para lowercase e trim', async () => {
    const dto = plainToInstance(CreateAssociationDto, {
      ...defaultValidDto,
      email: '  CONTATO@Teste.Com  ',
    });
    await validate(dto);
    expect(dto.email).toBe('contato@teste.com');
  });

  it('mantém o valor original se transformação receber não-string', async () => {
    const dto = plainToInstance(CreateAssociationDto, {
      ...defaultValidDto,
      cnpj: 12345678000190 as any,
      email: 123 as any,
    });
    
    await validate(dto);
    expect(dto.cnpj).toBe(12345678000190);
    expect(dto.email).toBe(123);
  });
});

