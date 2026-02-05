import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { associationService } from "@/services/associationService";
import { STALE_TIMES } from "@/constants/query";

export const ASSOCIATION_KEYS = {
  all: ["associations"] as const,
  details: () => [...ASSOCIATION_KEYS.all, "detail"] as const,
  detail: (id: number) => [...ASSOCIATION_KEYS.details(), id] as const,
  associates: (page: number, limit: number) => [...ASSOCIATION_KEYS.all, "associates", page, limit] as const,
  herdStats: () => [...ASSOCIATION_KEYS.all, "herdStats"] as const,
  availableProducers: () => [...ASSOCIATION_KEYS.all, "availableProducers"] as const,
};

export function useAssociation(id: number | undefined | null) {
  return useQuery({
    queryKey: ASSOCIATION_KEYS.detail(id!),
    queryFn: () => associationService.findById(id!),
    enabled: !!id,
    staleTime: STALE_TIMES.LONG,
  });
}

export function useAssociationAssociates(page = 1, limit = 10) {
  return useQuery({
    queryKey: ASSOCIATION_KEYS.associates(page, limit),
    queryFn: () => associationService.getAssociates(page, limit),
  });
}

export function useAssociationHerdStats() {
  return useQuery({
    queryKey: ASSOCIATION_KEYS.herdStats(),
    queryFn: () => associationService.getHerdStats(),
  });
}

export function useAvailableProducers() {
  return useQuery({
    queryKey: ASSOCIATION_KEYS.availableProducers(),
    queryFn: () => associationService.getAvailableProducers(),
  });
}

export function useInviteProducer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => associationService.inviteProducer(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ASSOCIATION_KEYS.availableProducers() });
      queryClient.invalidateQueries({ queryKey: ASSOCIATION_KEYS.all }); // Optionally invalidate associates list if invites affect it
    },
  });
}
