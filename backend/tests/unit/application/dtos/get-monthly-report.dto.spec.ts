import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetMonthlyReportDto } from '@/application/dtos/associations/get-monthly-report.dto';

describe('GetMonthlyReportDto', () => {
    it('deve transformar strings numéricas em números', async () => {
        const dto = plainToInstance(GetMonthlyReportDto, {
            year: '2023',
            month: '10'
        });

        await validate(dto);
        expect(typeof dto.year).toBe('number');
        expect(dto.year).toBe(2023);
        expect(typeof dto.month).toBe('number');
        expect(dto.month).toBe(10);
    });

    it('deve validar um DTO válido', async () => {
        const dto = plainToInstance(GetMonthlyReportDto, {
            year: 2023,
            month: 12
        });

        const errors = await validate(dto);
        expect(errors.length).toBe(0);
    });

    it('deve falhar se ano for inválido (menor que 1900)', async () => {
        const dto = plainToInstance(GetMonthlyReportDto, {
            year: 1899,
            month: 10
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('year');
    });

    it('deve falhar se ano for inválido (maior que 2100)', async () => {
        const dto = plainToInstance(GetMonthlyReportDto, {
            year: 2101,
            month: 10
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('year');
    });

    it('deve falhar se mês for inválido (menor que 1)', async () => {
        const dto = plainToInstance(GetMonthlyReportDto, {
            year: 2023,
            month: 0
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('month');
    });

    it('deve falhar se mês for inválido (maior que 12)', async () => {
        const dto = plainToInstance(GetMonthlyReportDto, {
            year: 2023,
            month: 13
        });

        const errors = await validate(dto);
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0].property).toBe('month');
    });
});
