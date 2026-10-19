import { DailyCollection } from "@/interfaces/daily-collection";

export interface CollectionFilters {
  destinationId: number | null;
  userId: number | null;
}

/** Mais recentes primeiro (pela data da coleta). */
export function sortByDateDesc(collections: DailyCollection[]): DailyCollection[] {
  return [...collections].sort(
    (a, b) =>
      new Date(b.collectionDate).getTime() - new Date(a.collectionDate).getTime(),
  );
}

/** Filtra por destino e por quem registrou; filtro nulo não restringe. */
export function filterCollections(
  collections: DailyCollection[],
  { destinationId, userId }: CollectionFilters,
): DailyCollection[] {
  return collections.filter(
    (c) =>
      (destinationId === null || c.destinationId === destinationId) &&
      (userId === null || c.userId === userId),
  );
}

/** Quem registrou coletas, sem repetir, em ordem alfabética (para o filtro). */
export function collectionAuthors(
  collections: DailyCollection[],
): { id: number; name: string }[] {
  const byId = new Map<number, string>();
  for (const c of collections) {
    byId.set(c.userId, c.user?.name ?? `Usuário #${c.userId}`);
  }
  return [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

export function totalLiters(collections: DailyCollection[]): number {
  return collections.reduce((sum, c) => sum + c.quantity, 0);
}
