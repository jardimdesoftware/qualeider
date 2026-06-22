import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userService } from "@/services/userService";
import { User } from "@/interfaces/user";
import { STALE_TIMES } from "@/constants/query";

export const USER_KEYS = {
  all: ["users"] as const,
  byId: (id: number) => ["users", id] as const,
};

export function useUsers(params?: Record<string, unknown>) {
  return useQuery<User[]>({
    queryKey: [...USER_KEYS.all, params],
    queryFn: () => userService.findAll(params),
    staleTime: STALE_TIMES.MEDIUM,
  });
}

export function useUser(id: number | null) {
  return useQuery({
    queryKey: USER_KEYS.byId(id!),
    queryFn: () => userService.getById(id!),
    enabled: !!id,
    staleTime: STALE_TIMES.MEDIUM,
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<User> }) =>
      userService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.all });
      queryClient.invalidateQueries({ queryKey: USER_KEYS.byId(variables.id) });
    },
  });
}
