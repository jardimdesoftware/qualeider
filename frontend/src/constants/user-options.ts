const sortWithOutroLast = (arr: string[]) =>
  [...arr].sort((a, b) => {
    if (a === "Outro") return 1;
    if (b === "Outro") return -1;
    return a.localeCompare(b, "pt-BR");
  });

export const USER_CATEGORIES_RAW = [
  "Pecuarista",
  "Cooperativa",
  "Associacao",
  "Outro",
] as const;

export const USER_CATEGORIES: string[] = sortWithOutroLast(
  USER_CATEGORIES_RAW as unknown as string[],
);

export const sortByNamePtBr = <T extends { nome: string }>(arr: T[]): T[] =>
  [...arr].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
