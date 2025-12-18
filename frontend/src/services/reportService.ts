import { apiBase } from "./baseApi";
import { ProducerRanking, MonthlyReport } from "@/interfaces/report";

export const reportService = {
  async getProducerRanking(startDate?: string, endDate?: string): Promise<ProducerRanking[]> {
    const params = { startDate, endDate };

    const { data } = await apiBase.get<ProducerRanking[]>("/associations/reports/producer-ranking", {
      params,
    });

    return data;
  },

  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const { data } = await apiBase.get<MonthlyReport>("/associations/reports/monthly", {
      params: { year, month },
    });

    return data;
  },

  async getCurrentMonthReport(): Promise<MonthlyReport> {
    const now = new Date();
    return this.getMonthlyReport(now.getFullYear(), now.getMonth() + 1);
  },
};
