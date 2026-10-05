#!/usr/bin/env node
/**
 * Verificação ponta a ponta dos headers de segurança de uma instância em
 * execução (local, staging ou produção):
 *
 *   node scripts/verify-security-headers.mjs https://qualeider.valerialima.me
 *   node scripts/verify-security-headers.mjs http://localhost:8080
 *
 * Sai com código 1 se algum requisito falhar. Para HTTP (ambiente local), o
 * HSTS é checado igual: o navegador o ignora fora de HTTPS, mas o header deve
 * estar presente para que o ambiente se comporte como produção.
 */
const base = (process.argv[2] ?? "http://localhost:8080").replace(/\/$/, "");

let failures = 0;
const check = (ok, label, detail = "") => {
  console.log(`${ok ? "OK  " : "FAIL"} ${label}${!ok && detail ? `  -> ${detail}` : ""}`);
  if (!ok) failures += 1;
};

const get = async (path, init = {}) =>
  fetch(`${base}${path}`, { redirect: "manual", ...init });

const csp = (res) => res.headers.get("content-security-policy") ?? "";
const directive = (policy, name) =>
  (policy.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) ?? "")
    .slice(name.length + 1)
    .split(/\s+/)
    .filter(Boolean);

console.log(`Verificando ${base}\n`);

for (const path of ["/", "/login", "/createAccount"]) {
  const res = await get(path);
  const h = (name) => res.headers.get(name);
  console.log(`\n${path} (HTTP ${res.status})`);

  check(res.status >= 200 && res.status < 400, "responde sem erro (2xx/3xx)", String(res.status));
  check(
    /max-age=(\d{8,})/.test(h("strict-transport-security") ?? "") &&
      (h("strict-transport-security") ?? "").includes("includeSubDomains"),
    "Strict-Transport-Security com max-age longo e includeSubDomains",
    h("strict-transport-security") ?? "ausente",
  );
  check(csp(res) !== "", "Content-Security-Policy presente");
  check(
    !/unsafe-eval/.test(csp(res)),
    "CSP sem 'unsafe-eval'",
  );
  const scripts = directive(csp(res), "script-src");
  check(
    scripts.some((s) => s.startsWith("'nonce-")) && !scripts.includes("'unsafe-inline'"),
    "script-src com nonce e sem 'unsafe-inline'",
    scripts.join(" "),
  );
  check(directive(csp(res), "object-src").join() === "'none'", "object-src 'none'");
  check(directive(csp(res), "frame-ancestors").length > 0, "frame-ancestors definido");
  check(h("x-xss-protection") === "0", "X-XSS-Protection: 0", h("x-xss-protection") ?? "ausente");
  check(!!h("permissions-policy"), "Permissions-Policy presente");
  check(h("x-content-type-options") === "nosniff", "X-Content-Type-Options: nosniff");
  check(!!h("x-frame-options"), "X-Frame-Options presente");
  check(!!h("referrer-policy"), "Referrer-Policy presente");
  check(!h("x-powered-by"), "sem X-Powered-By", h("x-powered-by") ?? "");
  check(
    !/nginx\/\d/i.test(h("server") ?? ""),
    "header Server sem número de versão",
    h("server") ?? "",
  );

  // O nonce da CSP deve aparecer nos scripts inline devolvidos no HTML.
  const body = await res.text();
  const nonce = scripts.find((s) => s.startsWith("'nonce-"))?.slice(7, -1);
  check(
    !!nonce && body.includes(`nonce="${nonce}"`),
    "HTML usa o mesmo nonce da CSP nos scripts",
  );
}

const a = csp(await get("/login"));
const b = csp(await get("/login"));
check(a !== "" && a !== b, "nonce diferente a cada requisição");

const sec = await get("/.well-known/security.txt");
if (sec.status === 404) {
  console.log("\n(info) /.well-known/security.txt ainda não publicado nesta instância");
} else {
  const text = await sec.text();
  check(sec.status === 200 && /^Contact:/m.test(text), "security.txt com Contact");
  check(/^Expires:/m.test(text), "security.txt com Expires (obrigatório na RFC 9116)");
}

console.log(failures === 0 ? "\nTudo certo." : `\n${failures} verificação(ões) falharam.`);
process.exit(failures === 0 ? 0 : 1);
