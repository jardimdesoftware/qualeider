## Política de Scans Trivy — Qualeider

Este documento define a política de uso do Trivy nos workflows do CI para garantir que vulnerabilidades críticas sejam tratadas antes de chegar em `main`/produção.

### 1. Objetivo
- Garantir que vulnerabilidades classificadas como `CRITICAL` não sejam mergeadas/implantadas sem mitigação ou exceção aprovada.

### 2. Severidades bloqueantes
- `CRITICAL`: bloqueia o pipeline em `main` e em PRs cujo alvo seja `main` (política inicial).
- `HIGH`: monitorado e reportado; poderá ser promovido a bloqueante numa fase posterior, após avaliação do backlog.

### 3. Comportamento técnico nos workflows
- Os workflows usam a variável `TRIVY_EXIT_ON_CRITICAL` para falhar (`exit-code: 1`) apenas quando o contexto for:
  - push/dispatch em `main`, ou
  - pull request com base (`base`) em `main`.
- Em outros contextos (feature branches, forks, builds locais) o Trivy gera relatórios (`exit-code: 0`) para não bloquear o fluxo de desenvolvimento.
- `ignore-unfixed: true` é mantido para reduzir ruído de findings sem correções disponíveis.

### 4. Processo de exceções / allowlist
- Exceções são tratadas via:
  - incluir entradas justificadas em `backend/.trivyignore` (e, se o frontend precisar de allowlist, criar `frontend/.trivyignore` e apontar o workflow para ele), acompanhadas de PR que contenha:
    - justificativa técnica clara;
    - responsáveis e data para reavaliação;
    - label `security/exception` e aprovação de pelo menos um membro do time de segurança (ou reviewer responsável).
  - para exceções temporárias que não podem usar `.trivyignore`, criar issue/PR de acompanhamento com label `security/accept-risk`.

### 5. Revisão e governança
- Auditoria trimestral da `trivyignore` por responsáveis de segurança.
- Métrica: número de `CRITICAL` abertos por sprint; se backlog alto, avançar plano para bloquear também `HIGH` gradualmente.

### 6. Como escalar bloqueio (roadmap)
- Fase 1 (atual): bloquear `CRITICAL` em `main` / PR->main.
- Fase 2 (após redução de backlog): avaliar bloqueio de `HIGH` com janelas de exceção controladas.

### 7. Recomendações operacionais
- Automatizar criação de issues a partir de findings críticos para rastreabilidade.
- Revisar dependências regularmente (`npm audit`, `npm update`, `dependabot`, etc.).
- Treinar time para priorizar correções de `CRITICAL`.

### 8. Referências
- `.trivyignore` — uso para permitir exceções com revisão.
- ações em CI: `.github/workflows/backend-ci.yml` e `.github/workflows/frontend-cicd.yml`.

----
Esta política foi aplicada inicialmente por automação para bloquear `CRITICAL` em `main` e PRs alvo `main`. Ajustes futuros devem ser feitos via PR com referência a esta política.
