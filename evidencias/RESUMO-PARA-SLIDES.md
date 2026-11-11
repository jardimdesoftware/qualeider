# Resumo para os slides

## Publicação e domínio

- Configurei o domínio `alexandrejota.me` como URL canônica do Qualeider.
- Confirmei a propagação DNS para o IP público `150.136.88.141`.
- Preparei redirecionamentos de `www` e do endereço antigo `qualact`.
- Separei os serviços na VM: EduTrace na porta interna 8080 e Qualeider na 8081.
- Corrigi o fallback do Nginx que exibia o EduTrace no domínio do Qualeider.
- Alinhei CORS, autenticação Google, health checks e documentação.
- Preparei Nginx e certificado HTTPS para os três nomes do domínio.

## Testes de carga

- Criei cenários k6 controlados para Qualeider e EduTrace.
- Limitei a carga a 10 usuários virtuais durante 1 minuto.
- Testei apenas páginas públicas, sem criar ou alterar dados.
- Defini critérios: menos de 1% de falhas, mais de 99% dos checks aprovados e
  latência p95 abaixo de 750 ms.
- Adicionei interrupção automática em caso de degradação.
- Automatizei a exportação dos resultados em JSON e a retenção por 90 dias.

## Evidências

- Captura da configuração DNS no Namecheap.
- Relatório de DNS e conectividade da VM.
- Configurações versionadas de Nginx, HTTPS e deploy.
- Artefatos JSON do k6 com requisições, falhas, checks e latência.

## Situação em 10/11/2026

- DNS: configurado e propagado.
- Código e automação: preparados e validados estaticamente.
- Roteamento incorreto identificado: o host padrão do EduTrace respondia pelo
  domínio do Qualeider.
- Correção preparada: porta exclusiva, virtual host próprio e certificado TLS.
- Teste k6 em produção: etapa seguinte após a validação do domínio.

## Resultado do deploy

- Qualeider publicado com sucesso em `https://alexandrejota.me`.
- HTTPS válido com renovação automática.
- EduTrace preservado em `https://edutrace.ruancarvalho.me`.
- Redirecionamentos `www` e `qualact` validados.

## Resultado k6 do Qualeider

- 951 requisições em aproximadamente 1 minuto.
- 317 iterações concluídas, sem interrupções.
- 0,00% de falhas.
- Latência p95 de 39 ms, muito abaixo do limite de 750 ms.
- Todos os critérios de aprovação foram atendidos.
