import { apiBase } from './baseApi';
import { ProducerRanking, MonthlyReport } from '@/interfaces/report';

export const reportService = {
  async getProducerRanking(startDate?: string, endDate?: string): Promise<ProducerRanking[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString();
    const url = `/associations/reports/producer-ranking${query ? `?${query}` : ''}`;
    
    const response = await fetch(`${apiBase}${url}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar ranking de produtores');
    }

    return response.json();
  },

  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const response = await fetch(
      `${apiBase}/associations/reports/monthly?year=${year}&month=${month}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar relatório mensal');
    }

    return response.json();
  },

  async getCurrentMonthReport(): Promise<MonthlyReport> {
    const now = new Date();
    return this.getMonthlyReport(now.getFullYear(), now.getMonth() + 1);
  },
};
