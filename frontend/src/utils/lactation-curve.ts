const MS_PER_DAY = 86_400_000;

export interface CurvePoint {
  /** Dias desde o parto (0 = dia do parto). */
  day: number;
  /** Litros da vaca nesse dia (soma das ordenhas). */
  liters: number;
  /** Data da coleta, YYYY-MM-DD. */
  date: string;
}

export interface LactationCurve {
  points: CurvePoint[];
  /** Dia de maior produção (o primeiro, se houver empate); null sem pontos. */
  peak: CurvePoint | null;
  totalLiters: number;
}

export interface CollectionRow {
  collectionDate: string;
  quantity: number;
}

function utcDay(isoDate: string): number {
  return Date.UTC(
    Number(isoDate.slice(0, 4)),
    Number(isoDate.slice(5, 7)) - 1,
    Number(isoDate.slice(8, 10)),
  );
}

/**
 * Curva de lactação de uma vaca: produção diária (litros) por dias desde o
 * último parto. Coletas do mesmo dia somam (1ª e 2ª ordenha); coletas antes do
 * parto ficam de fora, porque pertencem à lactação anterior.
 */
export function buildLactationCurve(
  calvingDate: string | null | undefined,
  history: CollectionRow[],
): LactationCurve {
  if (!calvingDate) return { points: [], peak: null, totalLiters: 0 };

  const calving = utcDay(calvingDate);
  const byDate = new Map<string, number>();
  for (const row of history) {
    const date = row.collectionDate.slice(0, 10);
    byDate.set(date, (byDate.get(date) ?? 0) + row.quantity);
  }

  const points: CurvePoint[] = [...byDate.entries()]
    .map(([date, liters]) => ({
      date,
      liters: Math.round(liters * 100) / 100,
      day: Math.round((utcDay(date) - calving) / MS_PER_DAY),
    }))
    .filter((point) => point.day >= 0)
    .sort((a, b) => a.day - b.day);

  const peak = points.reduce<CurvePoint | null>(
    (best, point) => (best === null || point.liters > best.liters ? point : best),
    null,
  );
  const totalLiters = points.reduce((sum, point) => sum + point.liters, 0);

  return { points, peak, totalLiters };
}
