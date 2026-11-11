# Relatório de evidências — 10/11/2026

## Objetivo

Publicar o Qualeider em `https://alexandrejota.me` e preparar testes k6
controlados em produção para Qualeider e EduTrace.

## Evidências coletadas

- A captura do Namecheap mostra os registros `A` de `@` e `www` apontando para
  `150.136.88.141`.
- A consulta DNS confirmou o registro A de `alexandrejota.me` e de
  `qualact.alexandrejota.me` para `150.136.88.141`; `www.alexandrejota.me` é um
  CNAME para o domínio raiz.
- `edutrace.ruancarvalho.me` também resolve para `150.136.88.141`.
- Os testes TCP para `150.136.88.141` nas portas 22, 80 e 443 falharam.
- As requisições HTTPS para Qualeider e EduTrace falharam por conexão recusada
  ou indisponível. Portanto, a VM/rede é o bloqueio atual, não o DNS.
- Em uma validação posterior pelo navegador do responsável, `alexandrejota.me`
  exibiu o login do EduTrace sem mudar a URL da barra. Isso prova que não era um
  redirecionamento DNS/HTTP: o Nginx estava usando o virtual host padrão do
  EduTrace para um nome ainda sem bloco próprio.
- O navegador também marcou a conexão como “Não seguro”, compatível com o
  certificado do EduTrace sendo apresentado para `alexandrejota.me`.
- Os dois `docker-compose` usavam `127.0.0.1:8080`, o que impediria as duas
  aplicações de coexistirem na mesma VM.

## Alterações preparadas

- URL canônica do Qualeider alterada para `https://alexandrejota.me`.
- CORS, callback Google, URL do frontend, health checks, ZAP, README e
  `security.txt` alinhados ao novo domínio.
- Nginx do host preparado para servir o domínio raiz e redirecionar `www` e
  `qualact` para a URL canônica.
- Porta interna do Qualeider alterada para `127.0.0.1:8081`; o EduTrace continua
  isolado em `127.0.0.1:8080`.
- Virtual host padrão de bloqueio adicionado para impedir que domínios sem
  configuração sejam entregues por outra aplicação da VM.
- Instrução Certbot preparada para certificado SAN com os três nomes.
- Testes k6 de Qualeider e EduTrace limitados a 10 VUs, somente leitura e com
  interrupção automática quando os thresholds falham.
- Resultado completo dos testes exportado em JSON e armazenado por 90 dias nos
  artefatos do GitHub Actions.
- Script único criado para validar disponibilidade e executar os dois testes:
  `scripts/run-production-load-tests.ps1`.
- Workflow de primeira publicação preparado para subir toda a stack na porta
  8081 antes do health check público.
- Workflow manual de roteamento preparado para instalar Nginx, emitir o
  certificado Let's Encrypt e confirmar que o EduTrace continua funcionando.

## Validações executadas

- Sintaxe JavaScript dos dois cenários k6: aprovada com `node --check`.
- Teste E2E de CORS/CSP: não executado até o fim porque o PostgreSQL de teste
  local não existe; a falha ocorreu na inicialização do Prisma, antes das
  asserções.
- Execução k6: não iniciada, pois ambas as aplicações estão indisponíveis e o
  Docker Desktop local não está em execução.

## Evidências finais pendentes

Após aplicar a nova stack e a configuração Nginx/TLS na VM:

1. Capturar resposta HTTP 200 de `https://alexandrejota.me/` e `/api/health`.
2. Capturar redirecionamento 301 de `www` e `qualact` para o domínio raiz.
3. Executar o script k6 em uma janela combinada.
4. Anexar `k6-qualeider-summary.json` e `k6-edutrace-summary.json` aos slides.

Nenhum resultado de carga foi inventado: os JSONs só serão produzidos por uma
execução real contra os serviços disponíveis.

## Atualização após o deploy — 10/11/2026

- A stack completa do Qualeider foi publicada em `127.0.0.1:8081` e respondeu
  ao health check interno.
- O certificado Let's Encrypt foi emitido para `alexandrejota.me`,
  `www.alexandrejota.me` e `qualact.alexandrejota.me`, com expiração em
  09/02/2027 e renovação automática configurada pelo Certbot.
- `https://alexandrejota.me` passou a entregar o Qualeider e redirecionar para
  `/login`.
- `www` e `qualact` passaram a redirecionar para o domínio raiz.
- `https://edutrace.ruancarvalho.me` permaneceu respondendo pelo EduTrace.
- O endpoint `/api/health` continua intencionalmente restrito à rede interna;
  a verificação pública foi ajustada para validar a página de login.

## Resultado k6 — Qualeider

- Execução com artefato: GitHub Actions `42946387352`, em 10/11/2026.
- Carga: rampa controlada até 10 usuários virtuais durante 1 minuto.
- Duração efetiva: 60,7 segundos.
- Iterações concluídas: 274, sem interrupções.
- Requisições HTTP: 822.
- Taxa de falhas: 0,00%.
- Checks: 548 aprovados, 0 reprovados (100%).
- Latência p95: 123,03 ms, abaixo do limite de 750 ms.
- Resultado: aprovado em todos os thresholds.
- Artefato JSON preservado pelo GitHub Actions por 90 dias e baixado em
  `evidencias/k6-run-42946387352/k6-qualeider-summary.json`.
- Uma execução anterior (`42946108261`) também foi aprovada, com 951 requisições,
  0,00% de falhas e p95 de 39 ms; ela identificou e permitiu corrigir a permissão
  de escrita do artefato no volume Docker.

## Resultado k6 — EduTrace

- Execução com artefato: GitHub Actions `42947026028`, em 10/11/2026.
- Carga: rampa controlada até 10 usuários virtuais durante 1 minuto.
- Duração efetiva: 60,04 segundos.
- Iterações concluídas: 322, sem interrupções.
- Requisições HTTP: 644.
- Taxa de falhas: 0,00%.
- Checks: 644 aprovados, 0 reprovados (100%).
- Latência p95: 24,30 ms, abaixo do limite de 750 ms.
- Resultado: aprovado em todos os thresholds.
- Artefato JSON preservado pelo GitHub Actions por 90 dias e baixado em
  `edutrace/evidencias/k6-run-42947026028/k6-edutrace-summary.json`.
