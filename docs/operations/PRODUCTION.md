# Produção em VM pública — QuaLeiDer

## Arquitetura

Uma VM Linux pública executa Docker Engine. O Nginx do host termina TLS para `alexandrejota.me` e encaminha para `127.0.0.1:8081`; o Nginx do Compose roteia frontend e API. A porta `8080` permanece reservada ao EduTrace na mesma VM. PostgreSQL, backend e frontend ficam apenas nas redes Docker. `www.alexandrejota.me` e `qualact.alexandrejota.me` redirecionam para a URL canônica.

## Preparação da VM

1. Crie uma VM Ubuntu LTS com IP reservado, volume persistente e regra de entrada apenas para `22/tcp` (IP administrativo), `80/tcp` e `443/tcp`.
2. Aponte o registro DNS A/AAAA do domínio para a VM.
3. Instale Docker Engine/Compose e Nginx; crie `/opt/qualeider/app` com proprietário dedicado.
4. Copie `docker-compose.prod.yml`, `docker-compose.oci.yml`, `nginx/` e um `.env.production` com permissões `0600`.
5. Instale o certificado com Certbot para os três nomes e adapte `nginx/host-nginx.example.conf`:

```bash
sudo certbot --nginx --cert-name alexandrejota.me \
  -d alexandrejota.me \
  -d www.alexandrejota.me \
  -d qualact.alexandrejota.me
sudo nginx -t
sudo systemctl reload nginx
```

O certificado deve conter os três nomes porque os aliases também recebem TLS
antes de responder com o redirecionamento para a URL canônica.

No `.env.production` da VM, mantenha o domínio canônico consistente:

```dotenv
CORS_ORIGINS=https://alexandrejota.me
GOOGLE_CALLBACK_URL=https://alexandrejota.me/api/auth/google/callback
FRONTEND_URL=https://alexandrejota.me
NEXT_PUBLIC_API_URL=/api
NGINX_HTTP_PORT=8081
```

Se o login Google estiver habilitado, cadastre a mesma `GOOGLE_CALLBACK_URL` na
configuração OAuth do provedor.

Subida inicial:

```bash
cd /opt/qualeider/app
docker compose -p qualeider --env-file .env.production \
  -f docker-compose.prod.yml -f docker-compose.oci.yml pull
docker compose -p qualeider --env-file .env.production \
  -f docker-compose.prod.yml -f docker-compose.oci.yml up -d
curl --fail https://alexandrejota.me/
curl --fail http://127.0.0.1:8081/api/health # execute dentro da VM
curl --fail --location https://alexandrejota.me/login
curl --head https://www.alexandrejota.me/
curl --head https://qualact.alexandrejota.me/
```

O workflow `deploy-oci.yml` atualiza backend/frontend por SSH com host key fixada e restaura a imagem anterior se o health check público falhar. Configure `OCI_HOST`, `OCI_USER`, `OCI_SSH_PRIVATE_KEY` e `OCI_SSH_KNOWN_HOSTS` no environment de produção do GitHub.

## Primeira publicação na VM compartilhada

1. Execute manualmente **Deploy latest images to OCI** com `component=all`. O
   workflow sincroniza os arquivos, força a porta interna `8081`, sobe toda a
   stack e valida `/api/health` pelo loopback da VM.
2. Execute **Configure Qualeider host routing**, confirme produção e informe o
   e-mail do Let's Encrypt. O workflow instala o virtual host, emite o
   certificado e valida Qualeider e EduTrace publicamente.
3. Somente depois execute **k6 production** nos dois repositórios.

O usuário SSH precisa conseguir executar `sudo -n` para Nginx/Certbot. Como
alternativa, um administrador pode executar na VM:

```bash
sudo bash /opt/qualeider/app/nginx/configure-shared-host.sh email@example.com
```

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
