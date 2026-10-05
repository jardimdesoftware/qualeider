import { buildCsp } from "@/lib/csp";
import { securityHeaders } from "@/lib/security-headers";

const directive = (csp: string, name: string) =>
  csp
    .split("; ")
    .find((d) => d.startsWith(`${name} `))
    ?.slice(name.length + 1)
    .split(" ") ?? [];

describe("buildCsp", () => {
  const nonce = "bm9uY2U=";

  it("libera scripts só com nonce + strict-dynamic, sem unsafe-inline nem unsafe-eval em produção", () => {
    const scripts = directive(buildCsp({ nonce }), "script-src");

    expect(scripts).toEqual(["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"]);
  });

  it("só permite unsafe-eval e websocket em desenvolvimento", () => {
    const dev = buildCsp({ nonce, isDev: true });
    const prod = buildCsp({ nonce, isDev: false });

    expect(directive(dev, "script-src")).toContain("'unsafe-eval'");
    expect(directive(dev, "connect-src")).toEqual(
      expect.arrayContaining(["ws:", "wss:"]),
    );
    expect(prod).not.toContain("unsafe-eval");
    expect(prod).not.toContain("ws:");
  });

  it("mantém as origens externas que o app realmente usa (ViaCEP, IBGE, Unsplash)", () => {
    const csp = buildCsp({ nonce });

    expect(directive(csp, "connect-src")).toEqual(
      expect.arrayContaining([
        "'self'",
        "https://viacep.com.br",
        "https://servicodados.ibge.gov.br",
      ]),
    );
    expect(directive(csp, "img-src")).toContain("https://images.unsplash.com");
  });

  it("inclui a origem do Sentry só quando há DSN válido", () => {
    const withDsn = buildCsp({
      nonce,
      sentryDsn: "https://chave@o123.ingest.sentry.io/456",
    });

    expect(directive(withDsn, "connect-src")).toContain(
      "https://o123.ingest.sentry.io",
    );
    expect(buildCsp({ nonce })).not.toContain("sentry");
    expect(buildCsp({ nonce, sentryDsn: "isto-nao-e-url" })).not.toContain(
      "sentry",
    );
  });

  it("fecha vetores clássicos: object, base, form e frame-ancestors", () => {
    const csp = buildCsp({ nonce });

    expect(directive(csp, "default-src")).toEqual(["'self'"]);
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
    expect(directive(csp, "frame-ancestors")).toEqual(["'self'"]);
  });

  it("não usa upgrade-insecure-requests (quebraria o ambiente local em HTTP)", () => {
    expect(buildCsp({ nonce })).not.toContain("upgrade-insecure-requests");
  });

  it("gera um valor diferente para cada nonce", () => {
    expect(buildCsp({ nonce: "a" })).not.toBe(buildCsp({ nonce: "b" }));
  });
});

describe("securityHeaders", () => {
  const byKey = Object.fromEntries(
    securityHeaders.map((h) => [h.key, h.value]),
  );

  it("envia HSTS de 2 anos com subdomínios e sem preload", () => {
    expect(byKey["Strict-Transport-Security"]).toBe(
      "max-age=63072000; includeSubDomains",
    );
  });

  it("desliga o filtro XSS legado (X-XSS-Protection: 0), como o Helmet no backend", () => {
    expect(byKey["X-XSS-Protection"]).toBe("0");
  });

  it("restringe APIs de hardware com Permissions-Policy", () => {
    expect(byKey["Permissions-Policy"]).toContain("camera=()");
    expect(byKey["Permissions-Policy"]).toContain("microphone=()");
    expect(byKey["Permissions-Policy"]).toContain("geolocation=()");
  });
});
