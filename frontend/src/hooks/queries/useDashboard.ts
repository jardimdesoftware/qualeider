import { useUserAnimals } from './useAnimals';
import { useUserCollections } from './useCollections';
import { usePendingInvites } from './useInvites';

export function useUserDashboard(userId: number | null) {
  const { data: animals = [], isLoading: animalsLoading } = useUserAnimals(userId);
  const { data: collections = [], isLoading: collectionsLoading } = useUserCollections(userId);
  const { data: invites = [] } = usePendingInvites(userId);

  return {
    animals,
    collections,
    invites,
    isLoading: animalsLoading || collectionsLoading,
  };
}
