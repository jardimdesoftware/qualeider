import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { animalSpeciesService } from '@/services/animalSpeciesService';
import { CreateAnimalSpeciesDto, UpdateAnimalSpeciesDto } from '@/interfaces/animalSpecies';
import { STALE_TIMES } from '@/constants/query';

export const ANIMAL_SPECIES_KEYS = {
  all: ['animalSpecies'] as const,
  byId: (id: number) => ['animalSpecies', id] as const,
};

export function useAnimalSpecies() {
  return useQuery({
    queryKey: ANIMAL_SPECIES_KEYS.all,
    queryFn: animalSpeciesService.getAll,
    staleTime: STALE_TIMES.LONG,
  });
}

export function useCreateAnimalSpecies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAnimalSpeciesDto) => animalSpeciesService.create(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ANIMAL_SPECIES_KEYS.all }),
  });
}

export function useUpdateAnimalSpecies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateAnimalSpeciesDto }) =>
      animalSpeciesService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ANIMAL_SPECIES_KEYS.all }),
  });
}

export function useDeleteAnimalSpecies() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => animalSpeciesService.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ANIMAL_SPECIES_KEYS.all }),
  });
}
