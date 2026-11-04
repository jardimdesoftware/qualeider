/**
 * Headers de segurança estáticos aplicados a todas as rotas pelo next.config.ts.
 * A CSP fica em src/proxy.ts porque depende de um nonce por requisição.
 *
 * Os headers também são enviados pelo nginx do projeto. Mantê-los no Next.js
 * protege execuções diretas e ambientes que não usam esse proxy; o nginx
 * remove os valores do upstream antes de aplicar uma única cópia.
 *
 * - HSTS sem `preload`: entrar na lista de preload é um compromisso difícil de
 *   desfazer e vale para o domínio inteiro, então fica como decisão explícita
 *   do dono do domínio.
 * - X-XSS-Protection: 0 (e não "1; mode=block"): o filtro XSS legado dos
 *   navegadores foi removido por introduzir vulnerabilidades próprias; a
 *   proteção real é a CSP. É o valor recomendado pela OWASP e o mesmo que o
 *   Helmet usa no backend.
 */
export const securityHeaders = [
  // Fallback estrito para respostas que não passam pelo proxy com nonce
  // (robots.txt, sitemap.xml, 404s e assets). Nas páginas HTML, src/proxy.ts
  // substitui este valor pela política completa com nonce por requisição.
  {
    key: "Content-Security-Policy",
    value:
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-XSS-Protection", value: "0" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];
