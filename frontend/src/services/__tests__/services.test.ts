import { apiBase } from "../baseApi";
import { animalService } from "../animalService";
import { animalSpeciesService } from "../animalSpeciesService";
import { breedService } from "../breedService";
import { destinationService } from "../destinationService";
import { allowedEmailsService } from "../allowedEmailsService";
import { collectionService } from "../collectionService";
import { reportService } from "../reportService";
import { userService } from "../userService";
import { authService } from "../authService";
import { activityLogService } from "../activityLogService";
import { fakeJwt } from "@/test-utils/jwt";

jest.mock("../baseApi", () => ({
  STORAGE_KEY: "authToken",
  apiBase: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const api = apiBase as unknown as Record<
  "get" | "post" | "put" | "patch" | "delete",
  jest.Mock
>;

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  for (const method of Object.values(api))
    method.mockResolvedValue({ data: "ok" });
});

describe.each([
  ["breeds", breedService],
  ["destinations", destinationService],
  ["animal-species", animalSpeciesService],
])("CRUD de /%s", (path, service) => {
  it("chama as rotas certas", async () => {
    await expect(service.getAll()).resolves.toBe("ok");
    expect(api.get).toHaveBeenCalledWith(`/${path}`);
    await service.getById(3);
    expect(api.get).toHaveBeenCalledWith(`/${path}/3`);
    await service.create({ name: "X" } as never);
    expect(api.post).toHaveBeenCalledWith(`/${path}`, { name: "X" });
    await service.update(3, { name: "Y" } as never);
    expect(api.put).toHaveBeenCalledWith(`/${path}/3`, { name: "Y" });
    await service.delete(3);
    expect(api.delete).toHaveBeenCalledWith(`/${path}/3`);
  });
});

describe("animalService", () => {
  it("chama as rotas de animais", async () => {
    await animalService.getByUser(5);
    expect(api.get).toHaveBeenCalledWith("/animals/user/5");
    await animalService.getProductionSummary("2026-11-01", "2026-11-30");
    expect(api.get).toHaveBeenCalledWith("/animals/production-summary", {
      params: { startDate: "2026-11-01", endDate: "2026-11-30" },
    });
    await animalService.getById(9);
    expect(api.get).toHaveBeenCalledWith("/animals/9");
    await animalService.create({ name: "Mimosa" } as never, 5);
    expect(api.post).toHaveBeenCalledWith("/animals", {
      name: "Mimosa",
      userId: 5,
    });
    await animalService.update(9, { name: "M" });
    expect(api.put).toHaveBeenCalledWith("/animals/9", { name: "M" });
    await animalService.delete(9);
    expect(api.delete).toHaveBeenCalledWith("/animals/9");
    await animalService.inativar(9);
    expect(api.patch).toHaveBeenCalledWith("/animals/9/inativar");
  });
});

describe("collectionService", () => {
  it("chama as rotas de coletas", async () => {
    await collectionService.create({ quantity: 10 } as never, 2);
    expect(api.post).toHaveBeenCalledWith("/daily-collections", {
      quantity: 10,
      userId: 2,
    });
    await collectionService.getByUser(2);
    expect(api.get).toHaveBeenCalledWith("/daily-collections/user/2");
    await collectionService.update(4, { quantity: 11 });
    expect(api.put).toHaveBeenCalledWith("/daily-collections/4", {
      quantity: 11,
    });
    await collectionService.remove(4);
    expect(api.delete).toHaveBeenCalledWith("/daily-collections/4");
    await collectionService.getHistoryByAnimal(8);
    expect(api.get).toHaveBeenCalledWith("/daily-collections/animal/8");
  });
});

describe("allowedEmailsService e reportService", () => {
  it("e-mails liberados", async () => {
    await allowedEmailsService.findAll();
    expect(api.get).toHaveBeenCalledWith("/allowed-emails");
    await allowedEmailsService.create("a@ifpe.edu.br");
    expect(api.post).toHaveBeenCalledWith("/allowed-emails", {
      email: "a@ifpe.edu.br",
    });
    await allowedEmailsService.remove(1);
    expect(api.delete).toHaveBeenCalledWith("/allowed-emails/1");
  });

  it("relatório do mês atual usa ano e mês de hoje", async () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 17));
    await reportService.getCurrentMonthReport();
    expect(api.get).toHaveBeenCalledWith("/reports/monthly", {
      params: { year: 2026, month: 11 },
    });
    jest.useRealTimers();
  });
});

describe("userService", () => {
  it("chama as rotas de usuários", async () => {
    await userService.getById(1);
    expect(api.get).toHaveBeenCalledWith("/users/1");
    await userService.update(1, { name: "Ana" });
    expect(api.put).toHaveBeenCalledWith("/users/1", { name: "Ana" });
    await userService.createInternal({ email: "v@ifpe.edu.br" } as never);
    expect(api.post).toHaveBeenCalledWith("/users/internal", {
      email: "v@ifpe.edu.br",
    });
  });

  it("checkEmail devolve o campo exists", async () => {
    api.get.mockResolvedValueOnce({ data: { exists: true } });
    await expect(userService.checkEmail("a@b.com")).resolves.toBe(true);
    expect(api.get).toHaveBeenCalledWith("/users/check-email", {
      params: { email: "a@b.com" },
    });
  });

  it("findAll aceita lista direta, envelope paginado ou nada", async () => {
    api.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    await expect(userService.findAll()).resolves.toEqual([{ id: 1 }]);
    api.get.mockResolvedValueOnce({ data: { data: [{ id: 2 }] } });
    await expect(userService.findAll({ role: "VAQUEIRO" })).resolves.toEqual([
      { id: 2 },
    ]);
    api.get.mockResolvedValueOnce({ data: null });
    await expect(userService.findAll()).resolves.toEqual([]);
  });
});

describe("authService", () => {
  it("login salva o token e devolve o payload", async () => {
    const token = fakeJwt({ sub: "3", email: "a@ifpe.edu.br" });
    api.post.mockResolvedValueOnce({ data: { access_token: token } });
    const result = await authService.login({
      email: "a@ifpe.edu.br",
      password: "x",
    });
    expect(result.payload.sub).toBe("3");
    expect(authService.getToken()).toBe(token);
    expect(authService.isAuthenticated()).toBe(true);
    expect(authService.getPayload()?.email).toBe("a@ifpe.edu.br");
  });

  it("login sem token da API falha", async () => {
    api.post.mockResolvedValueOnce({ data: {} });
    await expect(
      authService.login({ email: "a", password: "b" }),
    ).rejects.toThrow("Token não fornecido pela API");
  });

  it("getPayload trata token ausente ou inválido, e logout limpa", () => {
    expect(authService.getPayload()).toBeNull();
    localStorage.setItem("authToken", "lixo");
    expect(authService.getPayload()).toBeNull();
    authService.logout();
    expect(authService.isAuthenticated()).toBe(false);
  });

  it("fluxo de recuperação de senha", async () => {
    await authService.sendResetCode("a@b.com");
    expect(api.post).toHaveBeenCalledWith("/auth/forgot-password", {
      email: "a@b.com",
    });
    await authService.validateResetToken("a@b.com", "123456");
    expect(api.post).toHaveBeenCalledWith("/auth/validate-reset-token", {
      email: "a@b.com",
      token: "123456",
    });
    await authService.resetPassword("a@b.com", "123456", "Nova@1234");
    expect(api.post).toHaveBeenCalledWith("/auth/reset-password", {
      email: "a@b.com",
      token: "123456",
      newPassword: "Nova@1234",
    });
  });
});

describe("activityLogService", () => {
  it("monta a paginação a partir do interceptor", async () => {
    api.get.mockResolvedValueOnce({
      data: [{ id: 1 }, { id: 2 }],
      _pagination: { total: 45, page: 2, limit: 20 },
    });
    const result = await activityLogService.findByUser({
      userId: 1,
      page: 2,
      limit: 20,
    });
    expect(result).toMatchObject({
      total: 45,
      page: 2,
      totalPages: 3,
      hasNextPage: true,
      hasPreviousPage: true,
    });
  });

  it("sem paginação usa o tamanho da lista", async () => {
    api.get.mockResolvedValueOnce({ data: [{ id: 1 }] });
    const result = await activityLogService.findByUser({ userId: 1 });
    expect(result).toMatchObject({
      total: 1,
      page: 1,
      limit: 1,
      totalPages: 1,
      hasNextPage: false,
    });
  });

  it("lista vazia ainda tem uma página", async () => {
    api.get.mockResolvedValueOnce({ data: [] });
    const result = await activityLogService.findByUser({ userId: 1 });
    expect(result.totalPages).toBe(1);
  });
});
