# nginx

- `nginx.conf` — proxy reverso do stack Docker (`docker-compose.local.yml` e
  `docker-compose.prod.yml`): roteia `/` para o frontend e `/api` para o backend.
  Oculta a versão, calcula o IP real do cliente (aceitando `X-Forwarded-For` só de
  proxies da rede privada/Docker), repassa esse IP ao backend sobrescrevendo o
  header, e aplica um rate limit externo por IP (zonas `auth` e `api`).
- `host-nginx.example.conf` — exemplo para o nginx **do servidor** (o que termina
  o TLS). Esse nginx não faz parte do repositório: é documentação do que aplicar
  nele (HSTS, `server_tokens off`, repasse do IP real).
- `tests/` — teste de integração do `nginx.conf` com o nginx real:

  ```bash
  node nginx/tests/verify-nginx.mjs
  ```

  Requer Docker; sobe o nginx na frente de um upstream de teste e confere versão
  oculta, `X-Powered-By` escondido, IP real não forjável e os limites por IP.
