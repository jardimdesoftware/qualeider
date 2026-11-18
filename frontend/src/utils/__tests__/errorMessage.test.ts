import { getFriendlyErrorMessage } from "../errorMessage";

function axiosError(
  status?: number,
  data?: unknown,
  extra: Record<string, unknown> = {},
) {
  return {
    isAxiosError: true,
    response: status ? { status, data, headers: {} } : undefined,
    ...extra,
  };
}

describe("getFriendlyErrorMessage", () => {
  it("trata erro vazio", () => {
    expect(getFriendlyErrorMessage(null)).toBe("Ocorreu um erro inesperado.");
  });

  it("429 mostra o tempo de espera quando a API informa", () => {
    expect(getFriendlyErrorMessage(axiosError(429, { retryAfter: 30 }))).toBe(
      "Muitas tentativas. Aguarde 30 segundos e tente novamente.",
    );
    expect(
      getFriendlyErrorMessage({
        isAxiosError: true,
        response: { status: 429, data: {}, headers: { "retry-after": "12" } },
      }),
    ).toContain("12 segundos");
  });

  it("429 sem tempo usa a mensagem genérica", () => {
    expect(getFriendlyErrorMessage(axiosError(429, {}))).toBe(
      "Muitas tentativas. Aguarde um momento e tente novamente.",
    );
  });

  it("5xx nunca mostra a mensagem crua do servidor", () => {
    const msg = getFriendlyErrorMessage(
      axiosError(500, { message: "Internal server error" }),
    );
    expect(msg).toContain("Não foi possível processar");
  });

  it("4xx usa a mensagem do backend (texto ou primeira da lista)", () => {
    expect(
      getFriendlyErrorMessage(axiosError(409, { message: "Brinco já usado" })),
    ).toBe("Brinco já usado");
    expect(
      getFriendlyErrorMessage(
        axiosError(400, { message: ["nome curto", "email"] }),
      ),
    ).toBe("nome curto");
  });

  it("erro de rede", () => {
    expect(
      getFriendlyErrorMessage(
        axiosError(undefined, undefined, { code: "ERR_NETWORK" }),
      ),
    ).toContain("Não foi possível conectar");
  });

  it.each([
    [400, "Dados inválidos"],
    [401, "Email ou senha incorretos"],
    [403, "não tem permissão"],
    [404, "não encontrado"],
    [418, "comunicação com o servidor"],
  ])("status %i sem mensagem", (status, expected) => {
    expect(getFriendlyErrorMessage(axiosError(status, {}))).toContain(expected);
  });

  it("Error comum devolve a própria mensagem", () => {
    expect(getFriendlyErrorMessage(new Error("falhou"))).toBe("falhou");
  });

  it("qualquer outra coisa vira mensagem genérica", () => {
    expect(getFriendlyErrorMessage("texto")).toBe(
      "Ocorreu um erro inesperado. Tente novamente.",
    );
  });
});
