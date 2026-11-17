#!/usr/bin/env node
// Gate de dependências de produção: falha se o `npm audit` encontrar
// vulnerabilidade HIGH ou CRITICAL que não esteja em .github/audit-exceptions.json.
// Exceções vencidas (review_by no passado) também fazem o gate falhar.
//
// Uso: node .github/scripts/audit-gate.mjs <projeto>   (rodando dentro da pasta do projeto)

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const project = process.argv[2];
if (!project) {
  console.error("Uso: audit-gate.mjs <projeto>");
  process.exit(2);
}

const BLOCKING = new Set(["high", "critical"]);
const exceptionsFile = fileURLToPath(new URL("../audit-exceptions.json", import.meta.url));
const today = new Date().toISOString().slice(0, 10);

const exceptions = JSON.parse(readFileSync(exceptionsFile, "utf8")).exceptions.filter(
  (e) => e.projects.includes(project),
);

let raw;
try {
  raw = execFileSync("npm", ["audit", "--omit=dev", "--json"], {
    encoding: "utf8",
    shell: process.platform === "win32",
    maxBuffer: 64 * 1024 * 1024,
  });
} catch (error) {
  // npm audit sai com código != 0 quando acha vulnerabilidades; o JSON vem no stdout.
  raw = error.stdout;
}
const report = JSON.parse(raw);

// Os avisos de verdade são os itens de `via` que são objetos; os demais
// pacotes só herdam a vulnerabilidade por dependerem deles.
const advisories = new Map();
for (const vuln of Object.values(report.vulnerabilities ?? {})) {
  for (const via of vuln.via) {
    if (typeof via === "object" && BLOCKING.has(via.severity)) {
      const id = via.url?.split("/").pop() ?? String(via.source);
      advisories.set(id, { id, name: via.name, severity: via.severity, title: via.title });
    }
  }
}

let failed = false;
for (const advisory of advisories.values()) {
  const exception = exceptions.find((e) => e.advisory === advisory.id);
  if (!exception) {
    console.error(`::error::${advisory.severity.toUpperCase()} ${advisory.id} em ${advisory.name}: ${advisory.title}`);
    failed = true;
  } else if (exception.review_by < today) {
    console.error(`::error::A exceção de ${advisory.id} venceu em ${exception.review_by}. Revise ou atualize a dependência.`);
    failed = true;
  } else {
    console.log(`::warning::${advisory.id} em ${advisory.name} aceito até ${exception.review_by}: ${exception.reason}`);
  }
}

for (const exception of exceptions) {
  if (!advisories.has(exception.advisory)) {
    console.log(`::notice::A exceção de ${exception.advisory} não é mais necessária em ${project}; pode ser removida.`);
  }
}

if (failed) process.exit(1);
console.log(`Nenhuma vulnerabilidade HIGH/CRITICAL sem exceção em ${project}.`);
