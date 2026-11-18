/** Gera um JWT sem assinatura válida, só para testes que decodificam o payload. */
export function fakeJwt(payload: Record<string, unknown>): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.assinatura`;
}
