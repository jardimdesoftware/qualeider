# Evidências de segurança — 30/09/2026

## OWASP ZAP

Varredura baseline/passiva executada contra `https://qualeider.valerialima.me`, sem ataques ativos e sem sessão autenticada.

- 39 URLs descobertas;
- 54 verificações aprovadas;
- 0 falhas classificadas pelo baseline;
- 13 categorias reportadas como aviso;
- principais sinais: CSP, HSTS e outros cabeçalhos de segurança ausentes ou incompletos.

Evidências: `zap/qualeider-zap.html`, `zap/qualeider-zap.json` e `zap/qualeider-zap.md`.

## Semgrep CE

Análise estática com configuração `auto`; arquivos `.env*`, dependências e artefatos de build foram excluídos.

- 450 arquivos analisados por 265 regras;
- 78 resultados: 2 `ERROR`, 5 `MEDIUM`, 67 `WARNING` e 4 `INFO`;
- principais itens: possível shell injection em dois workflows, Actions com referências mutáveis, possível path traversal na seleção de templates e possível H2C smuggling na configuração Nginx.

Evidências: `semgrep/qualeider-semgrep.txt`, `semgrep/qualeider-semgrep.json` e `semgrep/qualeider-semgrep.sarif`.

Os resultados representam ocorrências de regras e podem conter repetições ou falsos positivos. Uma triagem manual é necessária antes de classificá-los como vulnerabilidades confirmadas.

