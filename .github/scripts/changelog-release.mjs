#!/usr/bin/env node
// Fecha a seção [Unreleased] do CHANGELOG.md numa versão já publicada.
//
//   - O conteúdo de [Unreleased] (escrito à mão nos PRs) vira "## [X.Y.Z] - data".
//   - Os PRs da release (lista gerada pelo GitHub) entram em "### Pull requests".
//   - [Unreleased] volta vazio e os links de comparação no fim são atualizados.
//
// Uso: node changelog-release.mjs <vX.Y.Z> <vANTERIOR> <data AAAA-MM-DD> <arquivo-com-notas>
// Sai com código 0 sem mexer no arquivo se a versão já estiver no CHANGELOG.
import { readFileSync, writeFileSync } from "node:fs";

const [tag, previousTag, date, notesFile] = process.argv.slice(2);
if (!tag || !previousTag || !date || !notesFile) {
  console.error("Uso: changelog-release.mjs <vX.Y.Z> <vANTERIOR> <data> <notas>");
  process.exit(2);
}

const repoUrl = `https://github.com/${process.env.GITHUB_REPOSITORY ?? "jardimdesoftware/qualeider"}`;
const version = tag.replace(/^v/, "");
const file = "CHANGELOG.md";
const original = readFileSync(file, "utf8");
const eol = original.includes("\r\n") ? "\r\n" : "\n";
let text = original.replace(/\r\n/g, "\n");

if (text.includes(`\n## [${version}]`)) {
  console.log(`CHANGELOG já tem a seção ${version}; nada a fazer.`);
  process.exit(0);
}

const unreleasedHeader = "## [Unreleased]\n";
const start = text.indexOf(unreleasedHeader);
if (start === -1) throw new Error("CHANGELOG.md sem a seção ## [Unreleased].");
const bodyStart = start + unreleasedHeader.length;
const nextSection = text.indexOf("\n## [", bodyStart);
const bodyEnd = nextSection === -1 ? text.length : nextSection + 1;
const unreleased = text.slice(bodyStart, bodyEnd).trim();

// "* título by @autor in https://.../pull/123" -> "- título (#123)"
const prs = readFileSync(notesFile, "utf8")
  .split(/\r?\n/)
  .map((line) => line.match(/^\* (.+?) by @\S+ in \S+\/pull\/(\d+)$/))
  .filter(Boolean)
  .map(([, title, number]) => `- ${title} (#${number})`);

const parts = [`## [${version}] - ${date}`];
if (unreleased) parts.push(unreleased);
if (prs.length) parts.push(`### Pull requests\n${prs.join("\n")}`);
const section = parts.join("\n\n") + "\n\n";

text = text.slice(0, bodyStart) + "\n" + section + text.slice(bodyEnd);

// Links de comparação no fim do arquivo.
const unreleasedLink = /^\[Unreleased\]: .*$/m;
const newLinks = `[Unreleased]: ${repoUrl}/compare/${tag}...HEAD\n[${version}]: ${repoUrl}/compare/${previousTag}...${tag}`;
text = unreleasedLink.test(text)
  ? text.replace(unreleasedLink, newLinks)
  : `${text.trimEnd()}\n\n${newLinks}\n`;

writeFileSync(file, text.replace(/\n/g, eol));
console.log(`CHANGELOG atualizado com a seção ${version} (${prs.length} PRs).`);
