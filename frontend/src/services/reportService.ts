import { apiBase } from "./baseApi";
import { MonthlyReport } from "@/interfaces/report";

export const reportService = {
  async getMonthlyReport(year: number, month: number): Promise<MonthlyReport> {
    const { data } = await apiBase.get<MonthlyReport>(
      "/associations/reports/monthly",
      {
        params: { year, month },
      },
    );

    return data;
  },

  async getCurrentMonthReport(): Promise<MonthlyReport> {
    const now = new Date();
    return this.getMonthlyReport(now.getFullYear(), now.getMonth() + 1);
  },
};
