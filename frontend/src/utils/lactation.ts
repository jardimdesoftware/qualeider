const MS_PER_DAY = 86_400_000;

/** "1ª cria", "2ª cria"... ("—" quando não informado). */
export function lactationLabel(n?: number | null): string {
  return n ? `${n}ª cria` : "—";
}

/** Opções do seletor de estágio de lactação (1ª a 10ª cria). */
export const LACTATION_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: lactationLabel(i + 1),
}));

/**
 * Dias desde o último parto (0 no dia do parto). `null` sem data, com data
 * inválida ou no futuro. A data do parto vem do backend como meia-noite UTC;
 * compara-se o dia do calendário, sem deixar o fuso mudar o resultado.
 */
export function daysSinceCalving(
  calvingDate?: string | null,
  today: Date = new Date(),
): number | null {
  if (!calvingDate) return null;
  const calving = new Date(calvingDate);
  if (Number.isNaN(calving.getTime())) return null;

  const start = Date.UTC(
    calving.getUTCFullYear(),
    calving.getUTCMonth(),
    calving.getUTCDate(),
  );
  const now = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const days = Math.floor((now - start) / MS_PER_DAY);
  return days < 0 ? null : days;
}

/** "2026-08-15T00:00:00.000Z" -> "2026-08-15" (valor de <input type="date">). */
export function toDateInputValue(iso?: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}
