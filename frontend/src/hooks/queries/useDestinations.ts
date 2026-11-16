import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { destinationService } from "@/services/destinationService";
import { CreateDestinationDto, UpdateDestinationDto } from "@/interfaces/destination";
import { STALE_TIMES } from "@/constants/query";

export const DESTINATIONS_KEYS = {
  all: ["destinations"] as const,
  byId: (id: number) => ["destinations", id] as const,
};

export function useDestinations() {
  return useQuery({
    queryKey: DESTINATIONS_KEYS.all,
    queryFn: destinationService.getAll,
    staleTime: STALE_TIMES.LONG,
  });
}

export function useDestination(id: number | null) {
  return useQuery({
    queryKey: DESTINATIONS_KEYS.byId(id!),
    queryFn: () => destinationService.getById(id!),
    enabled: !!id,
  });
}

export function useCreateDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDestinationDto) => destinationService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DESTINATIONS_KEYS.all });
    },
  });
}

export function useUpdateDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDestinationDto }) =>
      destinationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DESTINATIONS_KEYS.all });
    },
  });
}

export function useDeleteDestination() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => destinationService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: DESTINATIONS_KEYS.all });
    },
  });
}
