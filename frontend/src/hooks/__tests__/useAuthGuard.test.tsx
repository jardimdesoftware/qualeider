import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuthGuard } from "../useAuthGuard";
import { useUser } from "../useUser";
import { fakeJwt } from "@/test-utils/jwt";

const push = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

function render<T>(hook: () => T) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(hook, { wrapper }).result;
}

beforeEach(() => {
  localStorage.clear();
  push.mockClear();
});

describe("useUser", () => {
  it("decodifica o token válido", async () => {
    localStorage.setItem("authToken", fakeJwt({ sub: "9", role: "VAQUEIRO" }));
    const result = render(() => useUser());
    await waitFor(() => expect(result.current.data?.role).toBe("VAQUEIRO"));
  });

  it("token vencido é apagado", async () => {
    localStorage.setItem("authToken", fakeJwt({ sub: "9", exp: 1 }));
    const result = render(() => useUser());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(localStorage.getItem("authToken")).toBeNull();
  });

  it("token inválido é apagado", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {});
    localStorage.setItem("authToken", "lixo");
    const result = render(() => useUser());
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(localStorage.getItem("authToken")).toBeNull();
  });
});

describe("useAuthGuard", () => {
  it("devolve o id do usuário logado", async () => {
    localStorage.setItem("authToken", fakeJwt({ sub: "12" }));
    const result = render(() => useAuthGuard());
    await waitFor(() => expect(result.current.userId).toBe(12));
    expect(push).not.toHaveBeenCalled();
  });

  it("aceita sub numérico", async () => {
    localStorage.setItem("authToken", fakeJwt({ sub: 3 }));
    const result = render(() => useAuthGuard());
    await waitFor(() => expect(result.current.userId).toBe(3));
  });

  it("sem login manda para /login", async () => {
    const result = render(() => useAuthGuard());
    await waitFor(() => expect(push).toHaveBeenCalledWith("/login"));
    expect(result.current.userId).toBeNull();
  });
});
