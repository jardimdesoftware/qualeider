export function sortByNamePtBr<T extends { nome: string }>(items: T[]): T[] {
  return items.sort((a, b) =>
    a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" })
  );
}
