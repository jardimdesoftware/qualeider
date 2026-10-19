import { renderHook } from "@testing-library/react";
import { useDailyCollection } from "../useDailyCollection";

describe("useDailyCollection.transformConfirmedItemsToPayload", () => {
  const transform = (items: Parameters<
    ReturnType<typeof useDailyCollection>["transformConfirmedItemsToPayload"]
  >[0]) => {
    const { result } = renderHook(() => useDailyCollection());
    return result.current.transformConfirmedItemsToPayload(items);
  };

  it("envia o teste da caneca e o CMT como resultados separados", () => {
    const payload = transform({
      1: { quantity: 10, mugTestResult: "Positivo", cmtResult: "Suspeito" },
    });

    expect(payload).toEqual([
      { animalId: 1, quantity: 10, cmtResult: "Suspeito", mugTestResult: "Positivo" },
    ]);
  });

  it("os dois testes são opcionais: sem resultado vão como null", () => {
    const payload = transform({ 2: { quantity: 7.5 } });

    expect(payload).toEqual([
      { animalId: 2, quantity: 7.5, cmtResult: null, mugTestResult: null },
    ]);
  });

  it("descarta animais sem litros", () => {
    const payload = transform({
      3: { quantity: 0, mugTestResult: "Negativo" },
      4: { quantity: 5 },
    });

    expect(payload.map((item) => item.animalId)).toEqual([4]);
  });
});
