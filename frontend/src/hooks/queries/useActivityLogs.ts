import { useQuery } from "@tanstack/react-query";
import { activityLogService } from "@/services/activityLogService";
import { STALE_TIMES } from "@/constants/query";

export function useActivityLogs(userId: number | null, page = 1, limit = 20) {
  return useQuery({
    queryKey: ["activity-logs", userId, page, limit],
    queryFn: () =>
      activityLogService.findByUser({ userId: userId!, page, limit }),
    enabled: !!userId,
    staleTime: STALE_TIMES.SHORT,
  });
}
