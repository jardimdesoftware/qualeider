import { DailyCollection, MilkingPlace } from "@/interfaces/daily-collection";
import {
  collectionAuthors,
  filterCollections,
  sortByDateDesc,
  totalLiters,
} from "../collection-filters";

const make = (overrides: Partial<DailyCollection>): DailyCollection => ({
  id: 1,
  quantity: 10,
  collectionDate: "2026-10-10T00:00:00.000Z",
  userId: 1,
  numAnimals: 1,
  numOrdens: 1,
  rationProvided: false,
  numLactation: 1,
  milkingPlace: MilkingPlace.Curral,
  technicalAssistance: false,
  ...overrides,
});

const collections = [
  make({ id: 1, userId: 1, destinationId: 10, quantity: 10, user: { id: 1, name: "Zé" } }),
  make({ id: 2, userId: 2, destinationId: 20, quantity: 5.5, user: { id: 2, name: "Ana" } }),
  make({ id: 3, userId: 2, destinationId: 10, quantity: 4, user: { id: 2, name: "Ana" } }),
  make({ id: 4, userId: 3, destinationId: null, quantity: 1 }),
];

describe("filterCollections", () => {
  it("sem filtros devolve tudo", () => {
    expect(filterCollections(collections, { destinationId: null, userId: null })).toHaveLength(4);
  });

  it("filtra por destino", () => {
    const result = filterCollections(collections, { destinationId: 10, userId: null });
    expect(result.map((c) => c.id)).toEqual([1, 3]);
  });

  it("filtra por quem registrou", () => {
    const result = filterCollections(collections, { destinationId: null, userId: 2 });
    expect(result.map((c) => c.id)).toEqual([2, 3]);
  });

  it("combina os dois filtros", () => {
    const result = filterCollections(collections, { destinationId: 10, userId: 2 });
    expect(result.map((c) => c.id)).toEqual([3]);
  });

  it("coleta sem destino só aparece sem filtro de destino", () => {
    expect(filterCollections(collections, { destinationId: 10, userId: 3 })).toEqual([]);
  });
});

describe("collectionAuthors", () => {
  it("lista cada autor uma vez, em ordem alfabética, com nome padrão sem nome", () => {
    expect(collectionAuthors(collections)).toEqual([
      { id: 2, name: "Ana" },
      { id: 3, name: "Usuário #3" },
      { id: 1, name: "Zé" },
    ]);
  });
});

describe("sortByDateDesc e totalLiters", () => {
  it("ordena do mais recente para o mais antigo sem alterar a lista original", () => {
    const list = [
      make({ id: 1, collectionDate: "2026-10-01T00:00:00.000Z" }),
      make({ id: 2, collectionDate: "2026-10-09T00:00:00.000Z" }),
      make({ id: 3, collectionDate: "2026-10-05T00:00:00.000Z" }),
    ];

    expect(sortByDateDesc(list).map((c) => c.id)).toEqual([2, 3, 1]);
    expect(list.map((c) => c.id)).toEqual([1, 2, 3]);
  });

  it("soma os litros", () => {
    expect(totalLiters(collections)).toBeCloseTo(20.5);
    expect(totalLiters([])).toBe(0);
  });
});
