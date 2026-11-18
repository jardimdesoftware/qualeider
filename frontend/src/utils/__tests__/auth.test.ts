import {
  clearAuthToken,
  decodeToken,
  getAuthToken,
  getUserIdFromToken,
  getUserRoleFromToken,
  isAuthenticated,
  setAuthToken,
} from "../auth";
import { fakeJwt } from "@/test-utils/jwt";

jest.mock("@/lib/sentry", () => ({
  addBreadcrumb: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

describe("utils/auth", () => {
  beforeEach(() => localStorage.clear());

  it("sem token, nada está autenticado", () => {
    expect(getAuthToken()).toBeNull();
    expect(getUserRoleFromToken()).toBeNull();
    expect(getUserIdFromToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("lê papel e id do token salvo", () => {
    setAuthToken(fakeJwt({ sub: "42", role: "ADMIN" }));
    expect(getAuthToken()).not.toBeNull();
    expect(getUserRoleFromToken()).toBe("ADMIN");
    expect(getUserIdFromToken()).toBe(42);
    expect(isAuthenticated()).toBe(true);
  });

  it("aceita sub numérico e token sem papel", () => {
    setAuthToken(fakeJwt({ sub: 7 }));
    expect(getUserIdFromToken()).toBe(7);
    expect(getUserRoleFromToken()).toBeNull();
  });

  it("token inválido não autentica", () => {
    setAuthToken("lixo");
    expect(decodeToken("lixo")).toBeNull();
    expect(getUserIdFromToken()).toBeNull();
    expect(isAuthenticated()).toBe(false);
  });

  it("clearAuthToken remove o token", () => {
    setAuthToken(fakeJwt({ sub: 1 }));
    clearAuthToken();
    expect(getAuthToken()).toBeNull();
  });
});
