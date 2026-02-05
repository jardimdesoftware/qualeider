import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiBase } from '@/services/baseApi';
import { collectionService } from '@/services/collectionService';
import { DailyCollection } from '@/interfaces/daily-collection';
import { STALE_TIMES } from '@/constants/query';

export const COLLECTIONS_KEYS = {
  all: ['collections'] as const,
  byUser: (userId: number) => ['collections', 'user', userId] as const,
};

export function useUserCollections(userId: number | null) {
  return useQuery({
    queryKey: COLLECTIONS_KEYS.byUser(userId!),
    queryFn: async () => {
      const headers = { Authorization: `Bearer ${localStorage.getItem('authToken')}` };
      const response = await apiBase.get(`/daily-collections/user/${userId}`, { headers });
      return response.data as DailyCollection[];
    },
    enabled: !!userId,
    staleTime: STALE_TIMES.SHORT,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ data, userId }: { data: any, userId: number }) =>
      collectionService.create(data, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEYS.byUser(variables.userId) });
    },
  });
}
