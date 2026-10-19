import { useUserAnimals } from "./useAnimals";
import { useUserCollections } from "./useCollections";

export function useUserDashboard(userId: number | null) {
  const { data: animals = [], isLoading: animalsLoading } =
    useUserAnimals(userId);
  const { data: collections = [], isLoading: collectionsLoading } =
    useUserCollections(userId);

  return {
    animals,
    collections,
    isLoading: animalsLoading || collectionsLoading,
  };
}
