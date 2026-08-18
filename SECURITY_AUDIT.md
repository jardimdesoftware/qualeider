# Auditoria de Vulnerabilidades de Dependências (npm audit)

> Relacionado à issue [#121](https://github.com/jardimdesoftware/qualeider/issues/121).
> Última execução: 2026-07-06, com `npm audit` (backend e frontend, separadamente).

## Metodologia

Rodamos `npm audit --json` em `backend/` e `frontend/` isoladamente, extraímos cada
vulnerabilidade com sua severidade, se é dependência **direta** (declarada no
`package.json`) ou **transitiva**, o range vulnerável e se existe fix automático
(`fixAvailable`) — e se esse fix é **breaking** (`isSemVerMajor: true`) ou não.
Cada pacote transitivo foi rastreado com `npm ls <pacote>` até sua dependência
direta de origem, para agrupar vulnerabilidades por causa raiz em vez de tratar
cada uma isoladamente.

## Resumo executivo

| Projeto | Antes | Depois | Críticas antes → depois | Altas antes → depois |
|---|---|---|---|---|
| Backend | 81 (3 crit / 50 high / 22 mod / 6 low) | **79** (2 crit / 49 high / 22 mod / 6 low) | 3 → 2 | 50 → 49 |
| Frontend | 32 (4 crit / 9 high / 16 mod / 3 low) | **2** (0 crit / 0 high / 2 mod / 0 low) | 4 → 0 | 9 → 0 |

O frontend teve praticamente tudo resolvido nesta rodada. O backend tem a maior
parte das vulnerabilidades concentradas em **duas causas raiz** que exigem
upgrades major (breaking) e não foram aplicadas ainda — ver [Backend: pendente](#backend-pendente-requer-upgrade-major).

---

## Frontend — Corrigido nesta rodada

| Ação | Detalhe |
|---|---|
| `npm audit fix` (sem `--force`) | Resolveu 28 vulnerabilidades automaticamente (transitivas: `@opentelemetry/*`, `@sentry/*`, `ajv`, `brace-expansion`, `dompurify`, `follow-redirects`, `fast-uri`, `js-yaml`, `terser-webpack-plugin`, `uuid`, `yaml`, `axios`, `rollup`, `ws`, `lodash`, `minimatch`, `picomatch`, `serialize-javascript`, `flatted`, `eslint`/`@eslint/plugin-kit`, `@babel/core`, `jspdf-autotable`) |
| `next` 15.1.7 → **15.5.20** | Corrige **CRÍTICO** (RCE no protocolo React Flight, SSRF em middleware, bypass de autorização em middleware, DoS, entre ~15 CVEs). Mesma major (15.x) — não é breaking. Validado com `npm run build` completo (31 rotas, sem erros). |
| `jspdf` 3.0.4 → **4.2.1** | Corrige **CRÍTICO** (Path Traversal, PDF/JS injection via AcroForm, DoS via imagem maliciosa). Major bump, mas o único uso no código ([`ReportExportButton.tsx`](frontend/src/components/reports/ReportExportButton.tsx)) só usa a API básica (texto, tabela via `jspdf-autotable`, `save()`) — sem AcroForm, `addJS` ou carregamento de imagens externas, que são os vetores das CVEs. Validado com `tsc --noEmit` + `npm run build` (sem erros). |

### Frontend — Restante (2 moderate, não corrigido)

`postcss` (via `next@15.5.20` internamente, versão vendorizada `8.4.31` diferente
do `postcss@8.5.16` usado no projeto). Tentei forçar via `overrides` (`next.postcss`)
mas o npm marca a instalação como `invalid` — o Next.js vendoriza essa cópia e
resiste a overrides externos sem quebrar a instalação.

**Risco real:** baixo. É a cópia do PostCSS usada internamente pelo pipeline de
build do Next para processar o CSS do próprio projeto (Tailwind), não para
processar CSS não confiável em runtime. A vulnerabilidade é XSS via `</style>`
não escapado ao *serializar* CSS — não se aplica a esse uso.
**Ação recomendada:** aguardar uma release do Next.js que atualize sua cópia
interna do PostCSS (acompanhar `npm audit` a cada bump de `next`).

---

## Backend — Corrigido nesta rodada

| Ação | Detalhe |
|---|---|
| `overrides.form-data` → `^4.0.6` | Corrige **CRÍTICO** (dependência de teste apenas — `supertest`/`@types/superagent`, não afeta runtime). |
| `overrides.jsonwebtoken` → `^9.0.3` | Corrige **HIGH**: `jws` `<3.2.3` tinha uma falha de verificação de assinatura HMAC (CWE-347, [GHSA-869p-cjfg-cm3x](https://github.com/advisories/GHSA-869p-cjfg-cm3x)) — relevante por ser usado no fluxo de **autenticação JWT** (`@nestjs/jwt`, `passport-jwt`). Mesma major do `jsonwebtoken` (9.0.2 → 9.0.3), não é breaking. |

Ambas validadas com `tsc --noEmit` e `npm run test:unit` (537 testes, 100% passando).

## Backend — Pendente (requer upgrade major)

As **79 vulnerabilidades restantes** (2 crítico, 49 high, 22 moderate, 6 low)
não são 79 problemas independentes — colapsam em **dois clusters**, cada um
resolvido por um único upgrade coordenado:

### Cluster 1 — E-mail (`@nestjs-modules/mailer` + `nodemailer`)

Responsável por ~34 entradas: as **2 críticas restantes** (`handlebars`,
`liquidjs`), ~30 dos `high` (toda a família `mjml-*`, `mailparser`,
`html-minifier`, `js-cookie`, `editorconfig`, `linkify-it` — todos vêm de dentro
de `mjml`, que é dependência do `@nestjs-modules/mailer`).

- `@nestjs-modules/mailer@2.0.2` → precisa de versão que exija `nodemailer >= 8.0.5`.
- `nodemailer@^6.10.0` → fix requer **9.0.3** (major, `isSemVerMajor: true`).
- **Por que não foi feito agora:** `npm audit fix` falhou com `ERESOLVE` porque
  os dois precisam subir juntos, e é uma dependência usada em **envio de e-mail
  de convite e redefinição de senha** — merece upgrade dedicado com testes de
  integração/e2e rodando (o CI já cobre `test:integration`/`test:e2e` para o
  fluxo de e-mail), não um bump às pressas.
- **Próximo passo:** PR isolado bumpando `nodemailer` → `^9.0.3` e
  `@nestjs-modules/mailer` → última versão compatível, rodando toda a suíte
  (unit + integration + e2e) antes de mergear.

### Cluster 2 — Framework NestJS 10 → 11

Responsável pelo restante: praticamente todo o `moderate` (`@nestjs/core`,
`@nestjs/common`, `@nestjs/config`, `@nestjs/swagger`, `@nestjs/testing`,
`@nestjs/schedule`, `@nestjs/event-emitter`, `@nestjs/cache-manager`,
`@nestjs/schematics`, `@angular-devkit/*`) e vários `high` que dependem de um
`@nestjs/platform-express` mais novo (`express`, `multer`, `path-to-regexp`,
`body-parser`, `qs`) ou de `@nestjs/swagger`/`@nestjs/schematics` mais novos
(`lodash`, `ajv`, `js-yaml`, `picomatch`). Os `low` restantes são ferramentas de
dev (`@nestjs/cli`, `webpack`, `inquirer`, `babel`, etc.) do mesmo ecossistema.

- Upgrade de **framework inteiro** (NestJS 10.x → 11.x) — o maior risco de
  regressão do backlog, dado que o backend tem autenticação, guards e
  decorators que podem ter mudanças de API entre majors.
- **Próximo passo:** PR dedicado, feito com calma: atualizar todos os
  `@nestjs/*` juntos (não um de cada vez, para evitar incompatibilidade entre
  eles), rodar `test:unit` + `test:integration` + `test:e2e` + build Docker
  completo, e revisar o [changelog de migração oficial do NestJS 11](https://docs.nestjs.com/migration-guide)
  antes de mergear.

---

## Processo recomendado para futuras atualizações

1. Rodar `npm audit` (backend e frontend, separadamente) a cada sprint ou antes
   de cada release — os números deste documento ficam desatualizados rápido.
2. Ao ver um `fixAvailable` com `isSemVerMajor: false`, aplicar direto (é
   seguro por definição do npm) e validar com `tsc --noEmit` + testes.
3. Ao ver `isSemVerMajor: true`, **não** rodar `npm audit fix --force` direto:
   rastrear com `npm ls <pacote>` até a dependência direta de origem, agrupar
   por causa raiz (várias vulnerabilidades geralmente vêm do mesmo pacote
   desatualizado) e tratar como upgrade dedicado com PR e testes próprios.
4. Aproveitar os PRs do Dependabot já configurados (`.github/dependabot.yml`)
   como ponto de partida para esses upgrades — eles já isolam pacote por
   pacote, o que facilita revisar breaking changes individualmente.
5. Revisar/atualizar este documento a cada rodada de auditoria.

## Sub-tarefas sugeridas (issues filhas de #121)

- [ ] `nodemailer` + `@nestjs-modules/mailer` major upgrade (resolve cluster de e-mail: 2 crit + ~30 high)
- [ ] NestJS 10 → 11 (core, common, platform-express, config, swagger, testing, schedule, event-emitter, cache-manager, schematics, cli)
- [ ] Acompanhar release do Next.js que atualize o `postcss` vendorizado internamente
