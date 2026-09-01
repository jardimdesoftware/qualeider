import { renderHook, waitFor } from "@testing-library/react";
import { useRoleGuard } from "../useRoleGuard";

const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

jest.mock("@/utils/auth", () => ({
  getUserRoleFromToken: jest.fn(),
}));

import { getUserRoleFromToken } from "@/utils/auth";

describe("useRoleGuard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("libera acesso (isChecking = false) quando o role do usuario esta na lista permitida", async () => {
    (getUserRoleFromToken as jest.Mock).mockReturnValue("ADMIN");

    const { result } = renderHook(() => useRoleGuard(["ADMIN"]));

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("redireciona e mantem isChecking=true quando o role NAO esta na lista permitida", async () => {
    (getUserRoleFromToken as jest.Mock).mockReturnValue("VAQUEIRO");

    const { result } = renderHook(() => useRoleGuard(["ADMIN"]));

    await waitFor(() =>
      expect(replaceMock).toHaveBeenCalledWith("/dashboardUser"),
    );
    // isChecking nunca vira false nesse caminho - evita "flash" de conteudo restrito
    expect(result.current.isChecking).toBe(true);
  });

  it("usa o redirectTo customizado quando informado", async () => {
    (getUserRoleFromToken as jest.Mock).mockReturnValue("VAQUEIRO");

    renderHook(() => useRoleGuard(["ADMIN"], "/login"));

    await waitFor(() => expect(replaceMock).toHaveBeenCalledWith("/login"));
  });

  it("nao redireciona quando nao ha token/role (null) - guard nao cobre usuario deslogado", async () => {
    (getUserRoleFromToken as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useRoleGuard(["ADMIN"]));

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("permite qualquer um dos multiplos roles permitidos", async () => {
    (getUserRoleFromToken as jest.Mock).mockReturnValue("VAQUEIRO");

    const { result } = renderHook(() => useRoleGuard(["ADMIN", "VAQUEIRO"]));

    await waitFor(() => expect(result.current.isChecking).toBe(false));
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
