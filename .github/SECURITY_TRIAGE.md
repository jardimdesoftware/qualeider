# Política e Processo de Triagem de Alerts (Dependabot & Code Scanning)

Este documento define passos operacionais para triar e priorizar alerts do Dependabot e do Code Scanning do GitHub.

1) Objetivo
- Ter uma triagem contínua e priorizada dos alerts para evitar acúmulo de backlog e garantir tratamento de `CRITICAL`/`HIGH`.

2) Frequência
- Triage semanal por um responsável (rota: security champion da sprint).

3) Como coletar os alerts (comandos)
- Pré-requisito: `gh` CLI autenticada com permissões de leitura em `security_events` e `repo`.

Bash (Dependabot):
```
gh api -H "Accept: application/vnd.github+json" /repos/:owner/:repo/dependabot/alerts > dependabot-alerts.json
```

Bash (Code Scanning):
```
gh api -H "Accept: application/vnd.github+json" /repos/:owner/:repo/code-scanning/alerts > code-scanning-alerts.json
```

4) Classificação mínima
- Severidade (CRITICAL, HIGH, MEDIUM, LOW)
- Explorabilidade (easy, medium, hard)
- Causa raiz / pacote afetado
- Impacto (prod, staging, dev)

5) Plano incremental de correção
- Quick wins: atualizações de patch, fixes simples (1-2 dias)
- Upgrades moderados: dependências menores com testes (3-7 dias)
- Majors dedicados: breaking changes, plano de release e teste (>1 sprint)

6) Critérios de aceite
- Triage atualizada e documentada (lista com responsável e status)
- Plano priorizado com tarefas abertas (issues/prs)
- Findings `CRITICAL` e `HIGH` têm responsáveis e prazo

7) Exceções
- Justificar via issue/PR com label `security/exception` e data para reavaliação

8) Automação recomendada
- Script para gerar report semanal e abrir issue/PRs para quick-wins automaticamente (ex.: `scripts/list_alerts.sh`).

9) Referências
- `.github/dependabot.yml`
- `.github/TRIVY_POLICY.md`
- `SECURITY_AUDIT.md`

---
Adote este procedimento e registre as decisões em issues para auditoria.
