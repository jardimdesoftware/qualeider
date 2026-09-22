import { apiBase } from "./baseApi";
import {
  ActivityLog,
  ActivityLogQuery,
  PaginatedActivityLogs,
} from "@/interfaces/activity-log";

// O interceptor global de resposta (baseApi.tsx) detecta o envelope paginado
// { data, total, page, limit } e achata `response.data` para so o array,
// movendo o resto para `response._pagination` (sem totalPages/hasNextPage/
// hasPreviousPage) — por isso reconstruimos esses campos aqui.
interface ResponseWithPagination {
  data: ActivityLog[];
  _pagination?: { total: number; page: number; limit: number };
}

export const activityLogService = {
  findByUser: async (
    params: ActivityLogQuery,
  ): Promise<PaginatedActivityLogs> => {
    const response = (await apiBase.get<ActivityLog[]>("/activity-logs", {
      params,
    })) as unknown as ResponseWithPagination;

    const data = response.data;
    const page = response._pagination?.page ?? params.page ?? 1;
    const limit = response._pagination?.limit ?? params.limit ?? data.length;
    const total = response._pagination?.total ?? data.length;
    const totalPages = limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1;

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  },
};
