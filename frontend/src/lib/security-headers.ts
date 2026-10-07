/**
 * Headers de segurança estáticos aplicados a todas as rotas pelo next.config.ts.
 * A CSP fica em src/proxy.ts porque depende de um nonce por requisição.
 *
 * X-Frame-Options, X-Content-Type-Options e Referrer-Policy já são enviados
 * pelo nginx do projeto; aqui entram os que faltavam nas páginas.
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
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "X-XSS-Protection", value: "0" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];
