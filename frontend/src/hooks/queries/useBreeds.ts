import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { breedService } from "@/services/breedService";
import { CreateBreedDto, UpdateBreedDto } from "@/interfaces/breed";
import { STALE_TIMES } from "@/constants/query";

export const BREEDS_KEYS = {
  all: ["breeds"] as const,
  byId: (id: number) => ["breeds", id] as const,
};

export function useBreeds() {
  return useQuery({
    queryKey: BREEDS_KEYS.all,
    queryFn: breedService.getAll,
    staleTime: STALE_TIMES.LONG,
  });
}

export function useBreed(id: number | null) {
  return useQuery({
    queryKey: BREEDS_KEYS.byId(id!),
    queryFn: () => breedService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateBreed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBreedDto) => breedService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BREEDS_KEYS.all });
    },
  });
}

export function useUpdateBreed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBreedDto }) =>
      breedService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BREEDS_KEYS.all });
    },
  });
}

export function useDeleteBreed() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => breedService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BREEDS_KEYS.all });
    },
  });
}
