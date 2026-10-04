#!/usr/bin/env node
/**
 * Teste de integração do nginx/nginx.conf (nginx real em container):
 *
 *   node nginx/tests/verify-nginx.mjs
 *
 * Requer Docker. Sobe um nginx com a configuração do repositório na frente de um
 * upstream "eco" e confere: versão oculta, X-Powered-By escondido, IP real do
 * cliente repassado (e não forjável pela esquerda do X-Forwarded-For) e os
 * limites de requisição das zonas "auth" e "api", por IP.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const compose = (...args) =>
  spawnSync("docker", ["compose", "-f", join(here, "docker-compose.test.yml"), ...args], {
    stdio: "inherit",
  });

const BASE = "http://127.0.0.1:18080";
let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`${ok ? "OK  " : "FAIL"} ${label}${!ok && detail ? `  -> ${detail}` : ""}`);
  if (!ok) failures += 1;
};

const hit = (path, ip, init = {}) =>
  fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...(ip ? { "X-Forwarded-For": ip } : {}), ...(init.headers ?? {}) },
  });

const flood = async (path, ip, total) => {
  const codes = await Promise.all(Array.from({ length: total }, () => hit(path, ip).then((r) => r.status)));
  return {
    ok: codes.filter((c) => c === 200).length,
    limited: codes.filter((c) => c === 429).length,
  };
};

async function waitReady() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${BASE}/`)).status === 200) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("nginx de teste não ficou pronto");
}

try {
  if (compose("up", "-d").status !== 0) throw new Error("docker compose up falhou");
  await waitReady();

  console.log("\nCabeçalhos");
  const root = await hit("/", "198.51.100.1");
  const server = root.headers.get("server") ?? "";
  check(!/\d/.test(server) && server.length > 0, "Server sem número de versão", server);
  check(!root.headers.get("x-powered-by"), "X-Powered-By do upstream não vaza", root.headers.get("x-powered-by") ?? "");
  check(root.headers.get("x-frame-options") === "SAMEORIGIN", "X-Frame-Options mantido");
  check(root.headers.get("x-content-type-options") === "nosniff", "X-Content-Type-Options mantido");

  console.log("\nIP real do cliente");
  const seen = async (path, xff) => (await (await hit(path, xff)).json()).headers;
  const direct = await seen("/api/x", "203.0.113.7");
  check(direct["x-forwarded-for"] === "203.0.113.7", "X-Forwarded-For repassado ao backend é o IP do cliente", direct["x-forwarded-for"]);
  check(direct["x-real-ip"] === "203.0.113.7", "X-Real-IP idem", direct["x-real-ip"]);
  const forged = await seen("/api/x", "6.6.6.6, 203.0.113.7");
  check(
    forged["x-forwarded-for"] === "203.0.113.7",
    "valor forjado à esquerda do X-Forwarded-For é descartado (sem acumular a cadeia)",
    forged["x-forwarded-for"],
  );
  const noHeader = await seen("/api/x");
  check(!!noHeader["x-forwarded-for"] && !noHeader["x-forwarded-for"].includes(","), "sem X-Forwarded-For de entrada, usa o endereço da conexão", noHeader["x-forwarded-for"]);

  console.log("\nRate limit (zona auth: 30 req/min, burst 10)");
  const auth = await flood("/api/auth/login", "192.0.2.10", 60);
  check(auth.limited >= 30, "inundação em /api/auth/ é barrada com 429", JSON.stringify(auth));
  check(auth.ok >= 5 && auth.ok <= 15, "mas as primeiras requisições passam", JSON.stringify(auth));
  const otherIp = await hit("/api/auth/login", "192.0.2.11");
  check(otherIp.status === 200, "outro IP não é afetado (limite por IP real, não global)", String(otherIp.status));

  console.log("\nRate limit (zona api: 20 req/s, burst 60)");
  const api = await flood("/api/animals", "192.0.2.20", 300);
  check(api.limited >= 100, "inundação em /api é barrada com 429", JSON.stringify(api));
  check(api.ok >= 60, "o burst legítimo passa", JSON.stringify(api));
  const calm = await hit("/api/animals", "192.0.2.21");
  check(calm.status === 200, "outro IP não é afetado", String(calm.status));

  console.log("\nFrontend");
  const pages = await flood("/", "192.0.2.30", 100);
  check(pages.limited === 0, "páginas (/) não sofrem rate limit do nginx", JSON.stringify(pages));
} catch (error) {
  failures += 1;
  console.error(error);
} finally {
  compose("down", "-v");
}

console.log(failures === 0 ? "\nTudo certo." : `\n${failures} verificação(ões) falharam.`);
process.exit(failures === 0 ? 0 : 1);
