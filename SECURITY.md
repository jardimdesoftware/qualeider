# Política de Segurança — Qualeider

> Este arquivo substitui e consolida os antigos `SECURITY_AUDIT.md` (raiz) e
> `.github/TRIVY_POLICY.md`. Relacionado às issues [#121](https://github.com/jardimdesoftware/qualeider/issues/121)
> e [#176](https://github.com/jardimdesoftware/qualeider/issues/176).
> Última atualização de triagem: 2026-08-19.

## Reportando uma vulnerabilidade

Encontrou uma vulnerabilidade crítica ou já explorável em produção? **Não abra
uma issue pública.** Use a aba **Security → Report a vulnerability** deste
repositório (GitHub Private Vulnerability Reporting) para relatar de forma
privada, com passos de reprodução e impacto estimado, até que exista uma
correção.

Para fragilidades não críticas (hardening, defesa em profundidade, findings
sem exploração trivial), use o template de issue [🔒 Segurança](.github/ISSUE_TEMPLATE/seguranca.yml).

## Alertas automatizados e triagem

Este documento registra como o Qualeider trata alertas do Dependabot, Code
Scanning e de dependências/containers. O objetivo é manter todo alerta
visível, priorizado e corrigido ou rastreado com dono definido.

### Camadas de proteção

| Camada | Ferramenta | Onde roda | Propósito |
|---|---|---|---|
| Atualização de dependências | Dependabot | `.github/dependabot.yml` | Abre PRs semanais para npm, Docker e GitHub Actions. |
| Scan de dependência/container | Trivy | CI de backend e frontend | Bloqueia achados `CRITICAL`/`HIGH` em `main` e PRs para `main`; envia SARIF para o GitHub Security. |
| Análise estática de código | CodeQL | `.github/workflows/codeql.yml` | Análise estática para JavaScript/TypeScript em PRs, pushes e semanalmente. |
| Triagem manual | Aba GitHub Security + este documento | A cada revisão de segurança | Classifica alertas remanescentes por severidade, exploração e risco de correção. |

### Regras de triagem

1. Alertas `CRITICAL`, `HIGH` ou ativamente explorados: corrigir imediatamente
   ou reverter a dependência/mudança que os introduziu.
2. Dependências de produção com impacto em rede, autenticação, parsing de
   arquivo, template rendering, banco de dados ou processamento de requisição:
   priorizar antes de achados apenas de desenvolvimento.
3. Dependências diretas antes de transitivas, a menos que o pacote transitivo
   seja explorável por um caminho em runtime.
4. Atualizações não-breaking antes de major upgrades — nunca usar
   `npm audit fix --force` sem revisar as mudanças major resultantes.
5. Achados sem correção segura disponível só são aceitos como risco quando o
   caminho de código afetado não é alcançável em produção ou a funcionalidade
   vulnerável não é usada.

### Estado atual de remediação

O backlog de alto risco original já foi fechado com as seguintes atualizações:

| Área | Risco anterior | Estado atual |
|---|---|---|
| Frontend framework | CVEs do Next.js e relacionados | `next` na major line atual usada pelo projeto (`^16.3.1`). |
| Geração de PDF | Achados críticos do `jspdf` | `jspdf` em `^4.2.1`; uso limitado a APIs de geração de relatório. |
| Backend framework | Migração NestJS 10 → 11 | Pacotes NestJS na linha 11.x. |
| Mail/templates | Backlog de `nodemailer`/templates | `nodemailer` em `^9.0.5`; `handlebars` declarado diretamente em `^4.7.9`. |
| Auth/JWT transitivo | Assinatura `jsonwebtoken`/`jws` | `jsonwebtoken` sobrescrito para `^9.0.3`. |
| Upload multipart transitivo | Achado crítico em `form-data` | `form-data` sobrescrito para `^4.0.6`. |

Como os alertas do Dependabot e do Code Scanning são visíveis apenas a quem
tem acesso ao repositório, seu conteúdo atual deve ser confirmado na aba
Security após qualquer PR relevante ser mergeado.

### Rotina obrigatória de revisão

Pelo menos uma vez por sprint, ou antes de cada release de produção:

1. Abrir `Security → Dependabot alerts`.
2. Abrir `Security → Code scanning`.
3. Para cada alerta aberto, registrar: pacote/regra, severidade, caminho
   afetado, se é runtime/dev-only/CI-only, versão de correção ou mitigação, e
   dono/PR/issue de acompanhamento.
4. Mergear primeiro os PRs seguros de minor/patch do Dependabot.
5. Para major upgrades, criar um PR focado por grupo de risco.
6. Rodar novamente CI de backend/frontend e CodeQL antes do merge.

### Política de backlog

Todo alerta não resolvido deve estar em um destes estados:

| Estado | Significado | Ação exigida |
|---|---|---|
| `fix-now` | Crítico, explorável ou alcançável em produção | Corrigir na sprint atual, antes do release. |
| `scheduled` | Importante mas exige upgrade coordenado | Linkar PR/issue com data. |
| `accepted-risk` | Não alcançável em produção ou sem correção segura | Documentar justificativa e data de revisão. |
| `false-positive` | O achado da ferramenta não se aplica a este caminho | Documentar evidência e dispensar na aba Security. |

Entradas `accepted-risk` e `false-positive` nunca devem ficar escondidas em
comentário de código — precisam de issue, nota de PR ou comentário de
dispensa na aba Security com contexto suficiente para um revisor futuro.

## Política de bloqueio do Trivy no CI

### Objetivo

Garantir que vulnerabilidades `CRITICAL` ou `HIGH` não sejam mergeadas ou
implantadas sem mitigação ou exceção aprovada.

### Severidades bloqueantes

- `CRITICAL`: bloqueia o pipeline em `main` e em PRs cujo alvo seja `main`.
- `HIGH`: bloqueia o pipeline em `main` e em PRs cujo alvo seja `main`.
- `MEDIUM` e abaixo: reportados via logs/SARIF e tratados no backlog, sem
  bloquear o pipeline por padrão.

### Comportamento técnico nos workflows

- Os workflows usam a variável `TRIVY_BLOCKING_EXIT_CODE` para falhar
  (`exit-code: 1`) apenas quando o contexto for push/dispatch em `main`, ou
  pull request com base em `main`.
- Em outros contextos (feature branches, forks, builds locais) o Trivy gera
  relatórios (`exit-code: 0`) sem bloquear o fluxo de desenvolvimento.
- Scans de filesystem, imagem Docker e configuração usam
  `severity: CRITICAL,HIGH` quando podem bloquear. `HIGH` não deve ser
  rebaixado para report-only sem exceção documentada.
- `ignore-unfixed: true` é mantido para reduzir ruído de findings sem
  correção disponível.

### Processo de exceções / allowlist

- Incluir entradas justificadas em `backend/.trivyignore` (criar
  `frontend/.trivyignore` se necessário), acompanhadas de PR com:
  justificativa técnica clara, responsável e data para reavaliação, label
  `security/exception` e aprovação de ao menos um responsável de segurança.
- Para exceções temporárias que não cabem em `.trivyignore`, abrir issue/PR
  de acompanhamento com label `security/accept-risk`.
- Se o Trivy ficar indisponível por falha externa: reexecutar o job. Se
  persistir, abrir issue `security/ci-fallback` com evidência do erro,
  rodar o scan localmente ou via workflow manual antes do merge, e registrar
  aprovação explícita no PR.

### Revisão e governança

- Auditoria trimestral do `.trivyignore` pelos responsáveis de segurança.
- Métrica: número de `CRITICAL`/`HIGH` abertos por sprint, tempo até correção
  e quantidade de exceções ativas.

### Roadmap de bloqueio

- Fase atual: bloquear `CRITICAL` e `HIGH` em `main` / PR → `main`.
- Próxima fase: avaliar bloqueio gradual de `MEDIUM` para dependências
  runtime expostas a rede, autenticação, templates, upload/processamento de
  arquivos e banco de dados.

### Recomendações operacionais

- Automatizar criação de issues a partir de findings críticos para
  rastreabilidade.
- Revisar dependências regularmente (`npm audit`, `npm update`, Dependabot).
- Priorizar correções de `CRITICAL` e `HIGH` no planejamento de sprint.

### Referências

- `.trivyignore` — uso para permitir exceções com revisão.
- Ações em CI: `.github/workflows/backend-ci.yml` e
  `.github/workflows/frontend-ci.yml`.
