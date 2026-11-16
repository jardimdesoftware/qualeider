import {
  LACTATION_OPTIONS,
  daysSinceCalving,
  lactationLabel,
  toDateInputValue,
} from "../lactation";

describe("lactationLabel", () => {
  it("mostra 1ª cria, 2ª cria...", () => {
    expect(lactationLabel(1)).toBe("1ª cria");
    expect(lactationLabel(2)).toBe("2ª cria");
  });

  it("devolve traço quando não informado", () => {
    expect(lactationLabel(null)).toBe("—");
    expect(lactationLabel(undefined)).toBe("—");
  });

  it("oferece 10 opções no seletor, da 1ª à 10ª cria", () => {
    expect(LACTATION_OPTIONS).toHaveLength(10);
    expect(LACTATION_OPTIONS[0]).toEqual({ value: "1", label: "1ª cria" });
    expect(LACTATION_OPTIONS[9]).toEqual({ value: "10", label: "10ª cria" });
  });
});

describe("daysSinceCalving", () => {
  const today = new Date(2026, 9, 19); // 19/10/2026 (mês é 0-based)

  it("conta os dias desde o parto", () => {
    expect(daysSinceCalving("2026-10-09T00:00:00.000Z", today)).toBe(10);
    expect(daysSinceCalving("2026-08-15T00:00:00.000Z", today)).toBe(65);
  });

  it("é 0 no dia do parto", () => {
    expect(daysSinceCalving("2026-10-19T00:00:00.000Z", today)).toBe(0);
  });

  it("devolve null sem data, com data inválida ou no futuro", () => {
    expect(daysSinceCalving(null, today)).toBeNull();
    expect(daysSinceCalving(undefined, today)).toBeNull();
    expect(daysSinceCalving("não é data", today)).toBeNull();
    expect(daysSinceCalving("2026-10-20T00:00:00.000Z", today)).toBeNull();
  });
});

describe("toDateInputValue", () => {
  it("corta a data ISO para o formato do input de data", () => {
    expect(toDateInputValue("2026-08-15T00:00:00.000Z")).toBe("2026-08-15");
  });

  it("devolve vazio sem data", () => {
    expect(toDateInputValue(null)).toBe("");
    expect(toDateInputValue(undefined)).toBe("");
  });
});
