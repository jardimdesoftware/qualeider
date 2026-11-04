# Teste de carga básico em produção

O cenário cobre as páginas públicas mais acessadas, cresce até 10 usuários
virtuais e falha se mais de 1% das requisições falhar ou se o p95 ultrapassar
750 ms.

O alvo padrão é `https://qualeider.valerialima.me`. Execute a partir da raiz do
repositório:

```bash
docker run --rm -i grafana/k6:1.8.2 run - < k6/load.js
```

Também é possível iniciar o workflow **k6 production** manualmente no GitHub
Actions. Ele exige a confirmação `confirm_production` e usa o ambiente protegido
`production`. Não aumente VUs ou duração sem combinar uma janela de teste.
