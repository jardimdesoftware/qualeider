import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { animalService } from '@/services/animalService';
import { Animal, CreateAnimalDto } from '@/interfaces/animal';
import { STALE_TIMES } from '@/constants/query';

export const ANIMALS_KEYS = {
  all: ['animals'] as const,
  byUser: (userId: number) => ['animals', 'user', userId] as const,
  byId: (id: number) => ['animals', id] as const,
};

export function useUserAnimals(userId: number | null) {
  return useQuery({
    queryKey: ANIMALS_KEYS.byUser(userId!),
    queryFn: () => animalService.getByUser(userId!),
    enabled: !!userId,
    staleTime: STALE_TIMES.MEDIUM,
  });
}

export function useAnimal(id: number | null) {
  return useQuery({
    queryKey: ANIMALS_KEYS.byId(id!),
    queryFn: () => animalService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateAnimal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ data, userId }: { data: Omit<CreateAnimalDto, 'userId'>, userId: number }) =>
      animalService.create(data, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ANIMALS_KEYS.byUser(variables.userId) });
    },
  });
}

export function useUpdateAnimal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number, data: Partial<CreateAnimalDto> }) =>
      animalService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANIMALS_KEYS.all });
    },
  });
}

export function useDeleteAnimal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: animalService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ANIMALS_KEYS.all });
    },
  });
}
