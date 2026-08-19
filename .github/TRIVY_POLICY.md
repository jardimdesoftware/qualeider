## Política de Scans Trivy — Qualeider

Este documento define a política de uso do Trivy nos workflows do CI para garantir que vulnerabilidades críticas e altas sejam tratadas antes de chegar em `main`/produção.

### 1. Objetivo
- Garantir que vulnerabilidades classificadas como `CRITICAL` ou `HIGH` não sejam mergeadas/implantadas sem mitigação ou exceção aprovada.

### 2. Severidades bloqueantes
- `CRITICAL`: bloqueia o pipeline em `main` e em PRs cujo alvo seja `main`.
- `HIGH`: bloqueia o pipeline em `main` e em PRs cujo alvo seja `main`.
- `MEDIUM` e abaixo: reportados via logs/SARIF e tratados no backlog, sem bloquear o pipeline por padrão.

### 3. Comportamento técnico nos workflows
- Os workflows usam a variável `TRIVY_BLOCKING_EXIT_CODE` para falhar (`exit-code: 1`) apenas quando o contexto for:
  - push/dispatch em `main`, ou
  - pull request com base (`base`) em `main`.
- Em outros contextos (feature branches, forks, builds locais) o Trivy gera relatórios (`exit-code: 0`) para não bloquear o fluxo de desenvolvimento.
- Os scans de filesystem, imagem Docker e configuração usam `severity: CRITICAL,HIGH` quando podem bloquear. Vulnerabilidades `HIGH` não devem ser rebaixadas para `report-only` sem exceção documentada.
- `ignore-unfixed: true` é mantido para reduzir ruído de findings sem correções disponíveis.

### 4. Processo de exceções / allowlist
- Exceções são tratadas via:
  - incluir entradas justificadas em `backend/.trivyignore` (e, se o frontend precisar de allowlist, criar `frontend/.trivyignore` e apontar o workflow para ele), acompanhadas de PR que contenha:
    - justificativa técnica clara;
    - responsáveis e data para reavaliação;
    - label `security/exception` e aprovação de pelo menos um membro do time de segurança (ou reviewer responsável).
  - para exceções temporárias que não podem usar `.trivyignore`, criar issue/PR de acompanhamento com label `security/accept-risk`.
- Fallback permitido quando o Trivy indisponível por falha externa: reexecutar o job. Se a indisponibilidade persistir, abrir issue `security/ci-fallback` com evidência do erro, executar scan local ou em workflow manual antes do merge, e registrar aprovação explícita no PR.

### 5. Revisão e governança
- Auditoria trimestral da `trivyignore` por responsáveis de segurança.
- Métrica: número de `CRITICAL` e `HIGH` abertos por sprint, tempo até correção e quantidade de exceções ativas.

### 6. Como escalar bloqueio (roadmap)
- Fase atual: bloquear `CRITICAL` e `HIGH` em `main` / PR->main.
- Próxima fase: avaliar bloqueio gradual de `MEDIUM` para dependências runtime expostas a rede, autenticação, templates, upload/processamento de arquivos e banco de dados.

### 7. Recomendações operacionais
- Automatizar criação de issues a partir de findings críticos para rastreabilidade.
- Revisar dependências regularmente (`npm audit`, `npm update`, `dependabot`, etc.).
- Treinar time para priorizar correções de `CRITICAL` e `HIGH`.

### 8. Referências
- `.trivyignore` — uso para permitir exceções com revisão.
- ações em CI: `.github/workflows/backend-ci.yml` e `.github/workflows/frontend-cicd.yml`.

----
Esta política bloqueia `CRITICAL` e `HIGH` em `main` e PRs alvo `main`. Ajustes futuros devem ser feitos via PR com referência a esta política.
