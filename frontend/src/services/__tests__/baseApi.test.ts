import type { AxiosAdapter } from "axios";
import { apiBase } from "../baseApi";
import { logger } from "@/utils/logger";

jest.mock("@/lib/sentry", () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

let lastHeaders: Record<string, unknown> = {};

function respondWith(status: number, data: unknown): AxiosAdapter {
  return async (config) => {
    lastHeaders = { ...config.headers };
    const response = { data, status, statusText: "", headers: {}, config };
    if (status >= 400) {
      throw Object.assign(new Error(`HTTP ${status}`), {
        isAxiosError: true,
        config,
        response,
      });
    }
    return response;
  };
}

describe("apiBase", () => {
  beforeEach(() => localStorage.clear());

  it("envia o token salvo no cabeçalho Authorization", async () => {
    localStorage.setItem("authToken", "abc");
    apiBase.defaults.adapter = respondWith(200, { ok: true });
    await apiBase.get("/qualquer");
    expect(lastHeaders.Authorization).toBe("Bearer abc");
  });

  it("sem token não envia Authorization", async () => {
    apiBase.defaults.adapter = respondWith(200, { ok: true });
    await apiBase.get("/qualquer");
    expect(lastHeaders.Authorization).toBeUndefined();
  });

  it("desembrulha o envelope { statusCode, message, data }", async () => {
    apiBase.defaults.adapter = respondWith(200, {
      statusCode: 200,
      message: "ok",
      data: [1, 2],
    });
    const response = await apiBase.get("/animals");
    expect(response.data).toEqual([1, 2]);
    expect((response as unknown as { _envelope: unknown })._envelope).toEqual({
      statusCode: 200,
      message: "ok",
    });
  });

  it("desembrulha a resposta paginada e guarda a paginação", async () => {
    apiBase.defaults.adapter = respondWith(200, {
      data: [{ id: 1 }],
      total: 9,
      page: 1,
      limit: 1,
    });
    const response = await apiBase.get("/users");
    expect(response.data).toEqual([{ id: 1 }]);
    expect(
      (response as unknown as { _pagination: unknown })._pagination,
    ).toEqual({
      total: 9,
      page: 1,
      limit: 1,
    });
  });

  it("resposta simples passa sem mudança", async () => {
    apiBase.defaults.adapter = respondWith(200, { exists: false });
    const response = await apiBase.get("/users/check-email");
    expect(response.data).toEqual({ exists: false });
  });

  it("401 avisa no log e repassa o erro", async () => {
    const warn = jest.spyOn(logger, "warn");
    apiBase.defaults.adapter = respondWith(401, { message: "Unauthorized" });
    await expect(apiBase.get("/users")).rejects.toMatchObject({
      response: { status: 401 },
    });
    expect(warn).toHaveBeenCalledWith("Token inválido ou expirado");
    warn.mockRestore();
  });
});
