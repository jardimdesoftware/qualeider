import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inviteService } from '@/services/inviteService';
import { STALE_TIMES } from '@/constants/query';

export const INVITES_KEYS = {
  all: ['invites'] as const,
  pending: (userId: number) => ['invites', 'pending', userId] as const,
};

export function usePendingInvites(userId: number | null) {
  return useQuery({
    queryKey: INVITES_KEYS.pending(userId!),
    queryFn: () => inviteService.getUserPendingInvites(userId!),
    enabled: !!userId,
    refetchInterval: STALE_TIMES.SHORT,
    staleTime: STALE_TIMES.SHORT,
  });
}

export function useRespondInvite() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ token, response }: { token: string, response: 'Accept' | 'Decline' }) =>
      inviteService.respondToInvite(token, response),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITES_KEYS.all });
    },
  });
}
