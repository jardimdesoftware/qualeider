import { debounce, throttle } from "../debounce";
import { sortByNamePtBr } from "../sorters";
import { downloadCSV } from "../csvExport";

describe("debounce e throttle", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("debounce só chama uma vez, com os últimos argumentos", () => {
    const fn = jest.fn();
    const debounced = debounce(fn, 100);
    debounced("a");
    debounced("b");
    jest.advanceTimersByTime(99);
    expect(fn).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("b");
  });

  it("throttle ignora chamadas dentro do intervalo", () => {
    const fn = jest.fn();
    const throttled = throttle(fn, 100);
    throttled(1);
    throttled(2);
    expect(fn).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(100);
    throttled(3);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(3);
  });
});

describe("sortByNamePtBr", () => {
  it("ordena ignorando acentos e maiúsculas", () => {
    const sorted = sortByNamePtBr([
      { nome: "Óleo" },
      { nome: "abelha" },
      { nome: "Nata" },
    ]);
    expect(sorted.map((i) => i.nome)).toEqual(["abelha", "Nata", "Óleo"]);
  });
});

describe("downloadCSV", () => {
  it("gera o CSV escapando aspas, vírgulas e quebras de linha", async () => {
    let blob: Blob | undefined;
    const createObjectURL = jest.fn((b: Blob) => {
      blob = b;
      return "blob:fake";
    });
    const revokeObjectURL = jest.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = jest
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    downloadCSV("coletas.csv", [
      ["Nome", "Obs"],
      ["Mimosa", 'disse "oi", e saiu'],
      ["Linha", "a\nb"],
    ]);

    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:fake");
    const text = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(blob as Blob);
    });
    expect(text.replace(/^﻿/, "")).toBe(
      'Nome,Obs\nMimosa,"disse ""oi"", e saiu"\nLinha,"a\nb"',
    );
    click.mockRestore();
  });
});
