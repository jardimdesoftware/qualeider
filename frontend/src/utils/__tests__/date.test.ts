import {
  formatDateBR,
  formatDateLongBR,
  formatDateTimeBR,
  getLocalDate,
} from "../date";

describe("date utils", () => {
  afterEach(() => jest.useRealTimers());

  it("getLocalDate devolve a data local no formato YYYY-MM-DD", () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 17, 23, 30));
    expect(getLocalDate()).toBe("2026-11-17");
  });

  it("formatDateBR aceita Date e string", () => {
    const date = new Date(2026, 0, 5, 12);
    expect(formatDateBR(date)).toBe("05/01/2026");
    expect(formatDateBR(date.toISOString())).toBe("05/01/2026");
  });

  it("formatDateLongBR escreve o mês por extenso", () => {
    expect(formatDateLongBR(new Date(2026, 2, 9, 12))).toBe(
      "09 de março de 2026",
    );
    expect(formatDateLongBR(new Date(2026, 2, 9, 12).toISOString())).toContain(
      "março",
    );
  });

  it("formatDateTimeBR junta dia, mês e hora", () => {
    const date = new Date(2026, 11, 25, 14, 30);
    expect(formatDateTimeBR(date)).toBe("25 de dezembro às 14:30");
    expect(formatDateTimeBR(date.toISOString())).toBe(
      "25 de dezembro às 14:30",
    );
  });
});
