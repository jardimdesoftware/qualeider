import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { allowedEmailsService } from "@/services/allowedEmailsService";
import { STALE_TIMES } from "@/constants/query";

const ALLOWED_EMAILS_KEY = ["allowed-emails"] as const;

export function useAllowedEmails() {
  return useQuery({
    queryKey: ALLOWED_EMAILS_KEY,
    queryFn: () => allowedEmailsService.findAll(),
    staleTime: STALE_TIMES.MEDIUM,
  });
}

export function useCreateAllowedEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (email: string) => allowedEmailsService.create(email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALLOWED_EMAILS_KEY });
    },
  });
}

export function useRemoveAllowedEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => allowedEmailsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALLOWED_EMAILS_KEY });
    },
  });
}
