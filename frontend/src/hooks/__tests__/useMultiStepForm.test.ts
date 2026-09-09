import { act, renderHook } from "@testing-library/react";
import {
  useMultiStepForm,
  usePersistedFormData,
  validateStepFields,
  getMissingFields,
} from "../useMultiStepForm";

jest.mock("@/utils/logger", () => ({
  logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() },
}));

import { logger } from "@/utils/logger";

describe("validateStepFields", () => {
  it("retorna true quando todos os campos obrigatorios estao preenchidos", () => {
    expect(validateStepFields({ name: "Ana", age: 10 }, ["name", "age"])).toBe(
      true,
    );
  });

  it("retorna false quando um campo obrigatorio esta ausente (undefined)", () => {
    expect(
      validateStepFields<{ name: string; age?: number }>({ name: "Ana" }, [
        "name",
        "age",
      ]),
    ).toBe(false);
  });

  it("retorna false quando um campo obrigatorio e null", () => {
    expect(
      validateStepFields({ name: "Ana", age: null }, ["name", "age"]),
    ).toBe(false);
  });

  it("retorna false quando uma string obrigatoria esta vazia", () => {
    expect(validateStepFields({ name: "" }, ["name"])).toBe(false);
  });

  it("retorna false quando uma string obrigatoria so tem espacos em branco", () => {
    expect(validateStepFields({ name: "   " }, ["name"])).toBe(false);
  });

  it("retorna false quando um array obrigatorio esta vazio", () => {
    expect(validateStepFields({ items: [] }, ["items"])).toBe(false);
  });

  it("retorna true quando nao ha campos obrigatorios", () => {
    expect(validateStepFields({}, [])).toBe(true);
  });
});

describe("getMissingFields", () => {
  it("retorna lista vazia quando nada falta", () => {
    expect(getMissingFields({ name: "Ana", age: 10 }, ["name", "age"])).toEqual(
      [],
    );
  });

  it("lista campos ausentes, vazios e com espacos em branco", () => {
    expect(
      getMissingFields({ name: "", age: undefined, city: "  " }, [
        "name",
        "age",
        "city",
      ]),
    ).toEqual(["name", "age", "city"]);
  });
});

describe("useMultiStepForm", () => {
  it("comeca no step inicial (0 por padrao)", () => {
    const { result } = renderHook(() => useMultiStepForm(3));
    expect(result.current.currentStep).toBe(0);
    expect(result.current.isFirstStep).toBe(true);
  });

  it("nextStep avanca um passo", () => {
    const { result } = renderHook(() => useMultiStepForm(3));
    act(() => result.current.nextStep());
    expect(result.current.currentStep).toBe(1);
  });

  it("nextStep NAO avanca além do último step (clamped)", () => {
    const { result } = renderHook(() => useMultiStepForm(2));
    act(() => result.current.nextStep());
    act(() => result.current.nextStep());
    act(() => result.current.nextStep());
    expect(result.current.currentStep).toBe(1);
    expect(result.current.isLastStep).toBe(true);
  });

  it("previousStep NAO retrocede abaixo de zero (clamped)", () => {
    const { result } = renderHook(() => useMultiStepForm(3));
    act(() => result.current.previousStep());
    act(() => result.current.previousStep());
    expect(result.current.currentStep).toBe(0);
  });

  it("goToStep ignora indice negativo", () => {
    const { result } = renderHook(() => useMultiStepForm(3, 1));
    act(() => result.current.goToStep(-1));
    expect(result.current.currentStep).toBe(1);
  });

  it("goToStep ignora indice maior ou igual a totalSteps", () => {
    const { result } = renderHook(() => useMultiStepForm(3, 1));
    act(() => result.current.goToStep(5));
    expect(result.current.currentStep).toBe(1);
  });

  it("reset volta para o step inicial", () => {
    const { result } = renderHook(() => useMultiStepForm(3, 1));
    act(() => result.current.goToStep(2));
    act(() => result.current.reset());
    expect(result.current.currentStep).toBe(1);
  });
});

describe("usePersistedFormData", () => {
  const KEY = "test-persisted-form";

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it("usa initialData quando nao ha nada persistido", () => {
    const { result } = renderHook(() =>
      usePersistedFormData(KEY, { name: "" }),
    );
    expect(result.current.formData).toEqual({ name: "" });
  });

  it("carrega dados validos persistidos no localStorage", () => {
    localStorage.setItem(KEY, JSON.stringify({ name: "Carlos" }));
    const { result } = renderHook(() =>
      usePersistedFormData(KEY, { name: "" }),
    );
    expect(result.current.formData).toEqual({ name: "Carlos" });
  });

  it("cai de volta pro initialData quando o JSON persistido esta corrompido", () => {
    localStorage.setItem(KEY, "{isso nao e json valido");
    const { result } = renderHook(() =>
      usePersistedFormData(KEY, { name: "default" }),
    );
    expect(result.current.formData).toEqual({ name: "default" });
    expect(logger.error).toHaveBeenCalledWith(
      "Error loading persisted form data",
      expect.anything(),
      expect.objectContaining({ storageKey: KEY }),
    );
  });

  it("updateFormData mescla e persiste no localStorage", () => {
    const { result } = renderHook(() =>
      usePersistedFormData(KEY, { name: "", age: 0 }),
    );
    act(() => result.current.updateFormData({ name: "Beatriz" }));
    expect(result.current.formData).toEqual({ name: "Beatriz", age: 0 });
    expect(JSON.parse(localStorage.getItem(KEY)!)).toEqual({
      name: "Beatriz",
      age: 0,
    });
  });

  it("nao quebra quando localStorage.setItem falha (ex: quota excedida)", () => {
    const setItemSpy = jest
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("QuotaExceededError");
      });

    const { result } = renderHook(() =>
      usePersistedFormData(KEY, { name: "" }),
    );

    expect(() =>
      act(() => result.current.updateFormData({ name: "Novo" })),
    ).not.toThrow();
    expect(result.current.formData).toEqual({ name: "Novo" });
    expect(logger.error).toHaveBeenCalledWith(
      "Error persisting form data",
      expect.anything(),
      expect.objectContaining({ storageKey: KEY }),
    );

    setItemSpy.mockRestore();
  });

  it("clearPersistedData remove do localStorage e restaura initialData", () => {
    const { result } = renderHook(() =>
      usePersistedFormData(KEY, { name: "inicial" }),
    );
    act(() => result.current.updateFormData({ name: "mudou" }));
    act(() => result.current.clearPersistedData());

    expect(result.current.formData).toEqual({ name: "inicial" });
    expect(localStorage.getItem(KEY)).toBeNull();
  });
});
