import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';
import { UserNotification } from '@/interfaces/notification';
import { STALE_TIMES } from '@/constants/query';

export const NOTIFICATIONS_KEYS = {
  all: ['notifications'] as const,
  user: () => ['notifications', 'user'] as const,
};

export function useUserNotifications() {
  return useQuery({
    queryKey: NOTIFICATIONS_KEYS.user(),
    queryFn: () => notificationService.getUserNotifications(),
    staleTime: STALE_TIMES.SHORT, 
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => notificationService.markAsRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_KEYS.user() });

      const previousNotifications = queryClient.getQueryData<UserNotification[]>(NOTIFICATIONS_KEYS.user());
      queryClient.setQueryData<UserNotification[]>(NOTIFICATIONS_KEYS.user(), (old) =>
        old?.map(n => n.id === id ? { ...n, read: true, readAt: new Date().toISOString() } : n)
      );

      return { previousNotifications };
    },
    onError: (_err, _id, context) => {
      if (context?.previousNotifications) {
        queryClient.setQueryData(NOTIFICATIONS_KEYS.user(), context.previousNotifications);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEYS.user() });
    },
  });
}
