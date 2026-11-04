# Produção em VM pública — QuaLeiDer

## Arquitetura

Uma VM Linux pública executa Docker Engine. O Nginx do host termina TLS para `qualact.alexandrejota.me` e encaminha para `127.0.0.1:8080`; o Nginx do Compose roteia frontend e API. PostgreSQL, backend e frontend ficam apenas nas redes Docker.

## Preparação da VM

1. Crie uma VM Ubuntu LTS com IP reservado, volume persistente e regra de entrada apenas para `22/tcp` (IP administrativo), `80/tcp` e `443/tcp`.
2. Aponte o registro DNS A/AAAA do domínio para a VM.
3. Instale Docker Engine/Compose e Nginx; crie `/opt/qualeider/app` com proprietário dedicado.
4. Copie `docker-compose.prod.yml`, `docker-compose.oci.yml`, `nginx/` e um `.env.production` com permissões `0600`.
5. Instale o certificado com Certbot e adapte `nginx/host-nginx.example.conf`. Valide com `nginx -t` antes de recarregar.

Subida inicial:

```bash
cd /opt/qualeider/app
docker compose -p qualeider --env-file .env.production \
  -f docker-compose.prod.yml -f docker-compose.oci.yml pull
docker compose -p qualeider --env-file .env.production \
  -f docker-compose.prod.yml -f docker-compose.oci.yml up -d
curl --fail https://qualact.alexandrejota.me/
```

O workflow `deploy-oci.yml` atualiza backend/frontend por SSH com host key fixada e restaura a imagem anterior se o health check público falhar. Configure `OCI_HOST`, `OCI_USER`, `OCI_SSH_PRIVATE_KEY` e `OCI_SSH_KNOWN_HOSTS` no environment de produção do GitHub.

## Plataforma de gerenciamento

Suba uma única instância de Portainer por VM:

```bash
docker compose -f docker-compose.management.yml up -d
ssh -L 9443:127.0.0.1:9443 usuario@vm
```

Acesse `https://localhost:9443`, troque a senha inicial e habilite MFA. A interface não é publicada na Internet.

## Observabilidade

Defina `GRAFANA_ADMIN_PASSWORD` e suba a aplicação junto ao overlay:

```bash
docker compose -p qualeider --env-file .env.production \
  -f docker-compose.prod.yml -f docker-compose.oci.yml \
  -f docker-compose.observability.yml up -d
ssh -L 3002:127.0.0.1:3002 usuario@vm
```

O Prometheus coleta métricas da API e containers, o Promtail envia logs Docker ao Loki e a instrumentação OpenTelemetry envia traces ao Tempo. Os três datasources são provisionados no Grafana. Nunca publique as portas administrativas diretamente.

## Aceite

- cobertura e gates de segurança verdes na `main`;
- `npm audit --omit=dev --audit-level=high` sem HIGH/CRITICAL;
- HTTPS válido, HTTP redirecionado e HSTS presente;
- frontend e `/api` disponíveis pelo domínio;
- targets do Prometheus `UP`, logs consultáveis no Loki e traces no Tempo;
- cenário `k6/load.js` dentro dos thresholds;
- backup e restauração do PostgreSQL testados.
