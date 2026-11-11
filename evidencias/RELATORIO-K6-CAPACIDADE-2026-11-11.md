# Teste k6 de capacidade do QuaLeiDer — 11/11/2026

## Como foi executado

- Alvo: `https://alexandrejota.me`.
- Cenário somente leitura nas rotas públicas `/` e `/login`.
- Primeiro teste: rampa progressiva de 10 até 200 usuários virtuais.
- Segundo teste: patamares isolados de 50, 100, 150 e 200 usuários virtuais,
  mantidos por 20 segundos cada.
- Critério de degradação: latência p95 igual ou superior a 750 ms.
- Salvaguardas: interrupção automática acima de 2% de falhas ou abaixo de 98%
  de checks aprovados.

## Resultado da rampa

- Execução: GitHub Actions `42949770381`.
- Pico: 200 usuários virtuais.
- 12.402 requisições e 4.134 iterações.
- 0% de falhas e 8.268 checks aprovados.
- Latência p95 geral: 848,47 ms.
- O sistema continuou disponível, mas apresentou degradação de latência.

## Resultado por patamar

Execução: GitHub Actions `42950627554`.

| Usuários virtuais | Latência p95 | Avaliação pelo limite de 750 ms |
|---:|---:|---|
| 50 | 279,49 ms | Dentro do limite |
| 100 | 1.264,12 ms | Sobrecarregado |
| 150 | 4.192,32 ms | Sobrecarregado |
| 200 | 6.853,90 ms | Sobrecarregado |

Foram realizadas 11.127 requisições, sem falhas e sem checks reprovados. A
degradação começa entre 50 e 100 usuários virtuais; 100 usuários já excedem o
limite de qualidade adotado. Isso não representa queda do sistema, e sim aumento
relevante do tempo de resposta nas páginas públicas testadas.

## Evidências

- `k6-capacity-run-42949770381/k6-qualeider-capacity-summary.json`.
- `k6-capacity-levels-42950627554/k6-qualeider-capacity-summary.json`.
