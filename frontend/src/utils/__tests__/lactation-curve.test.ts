import { buildLactationCurve } from "../lactation-curve";

const row = (collectionDate: string, quantity: number) => ({ collectionDate, quantity });

describe("buildLactationCurve", () => {
  const calving = "2026-08-01T00:00:00.000Z";

  it("conta os dias desde o parto e ordena a curva por dia", () => {
    const curve = buildLactationCurve(calving, [
      row("2026-08-31T00:00:00.000Z", 18),
      row("2026-08-02T00:00:00.000Z", 12),
      row("2026-08-11T00:00:00.000Z", 15),
    ]);

    expect(curve.points.map((p) => p.day)).toEqual([1, 10, 30]);
    expect(curve.points.map((p) => p.liters)).toEqual([12, 15, 18]);
    expect(curve.points[0].date).toBe("2026-08-02");
  });

  it("soma as coletas do mesmo dia (1ª e 2ª ordenha)", () => {
    const curve = buildLactationCurve(calving, [
      row("2026-08-10T00:00:00.000Z", 8.25),
      row("2026-08-10T00:00:00.000Z", 6.5),
    ]);

    expect(curve.points).toHaveLength(1);
    expect(curve.points[0]).toMatchObject({ day: 9, liters: 14.75 });
  });

  it("deixa de fora coletas anteriores ao parto e conta o dia do parto como dia 0", () => {
    const curve = buildLactationCurve(calving, [
      row("2026-07-30T00:00:00.000Z", 20),
      row("2026-08-01T00:00:00.000Z", 5),
    ]);

    expect(curve.points.map((p) => p.day)).toEqual([0]);
    expect(curve.totalLiters).toBe(5);
  });

  it("acha o pico (o primeiro dia, em caso de empate)", () => {
    const curve = buildLactationCurve(calving, [
      row("2026-08-05T00:00:00.000Z", 10),
      row("2026-08-20T00:00:00.000Z", 22),
      row("2026-09-10T00:00:00.000Z", 22),
      row("2026-09-30T00:00:00.000Z", 14),
    ]);

    expect(curve.peak).toMatchObject({ day: 19, liters: 22 });
  });

  it("sem data de parto ou sem coletas não há curva", () => {
    expect(buildLactationCurve(null, [row("2026-08-05T00:00:00.000Z", 10)])).toEqual({
      points: [],
      peak: null,
      totalLiters: 0,
    });
    expect(buildLactationCurve(undefined, []).points).toEqual([]);
    expect(buildLactationCurve(calving, []).peak).toBeNull();
  });
});
