import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiBase } from '@/services/baseApi';
import { collectionService } from '@/services/collectionService';
import { DailyCollection } from '@/interfaces/daily-collection';
import { STALE_TIMES } from '@/constants/query';

export const COLLECTIONS_KEYS = {
  all: ['collections'] as const,
  byUser: (userId: number) => ['collections', 'user', userId] as const,
  byAnimal: (animalId: number) => ['collections', 'animal', animalId] as const,
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
    mutationFn: ({ data, userId }: { data: any; userId: number }) =>
      collectionService.create(data, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEYS.byUser(variables.userId) });
    },
  });
}

export function useUpdateCollection(userId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<any> }) =>
      collectionService.update(id, data),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEYS.byUser(userId) });
      }
    },
  });
}

export function useDeleteCollection(userId: number | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => collectionService.remove(id),
    onSuccess: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: COLLECTIONS_KEYS.byUser(userId) });
      }
    },
  });
}

export function useAnimalCollectionHistory(animalId: number | null) {
  return useQuery({
    queryKey: COLLECTIONS_KEYS.byAnimal(animalId!),
    queryFn: () => collectionService.getHistoryByAnimal(animalId!),
    enabled: !!animalId,
    staleTime: STALE_TIMES.MEDIUM,
  });
}
