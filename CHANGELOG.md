# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e o versionamento adota [Semantic Versioning](https://semver.org/lang/pt-BR/).

Cada versão abaixo corresponde a uma tag `vX.Y.Z`, a uma
[Release do GitHub](https://github.com/jardimdesoftware/qualeider/releases) e às
imagens `ghcr.io/jardimdesoftware/qualeider-backend` e
`ghcr.io/jardimdesoftware/qualeider-frontend` publicadas pela esteira. A Release
traz a lista completa de PRs; aqui fica o resumo do que mudou para quem usa e
mantém o sistema.

## [Unreleased]

### Added
- Testes do frontend na esteira, com cobertura mínima de 70% na camada de
  lógica (hooks, serviços, schemas e utilitários) (#417).

### Removed
- Código do frontend sem uso desde a remoção da Associação: busca de CEP/IBGE,
  máscaras e validação de CPF/CNPJ. A CSP deixa de liberar ViaCEP e IBGE (#417).

## [0.9.0] - 2026-11-16

### Added
- Destinos do leite (cadastro) e escolha do destino ao fim da coleta.
- Tela para o admin ver as coletas registradas, com autor e destino.
- Teste da caneca separado do CMT e ordenha marcada item a item.
- Estágio de lactação (número da cria), data do último parto e curva de
  lactação na ficha da vaca.

### Changed
- Modelo único do IFPE: um admin fixo, sem cadastro público; quem entra com o
  e-mail institucional pelo Google vira vaqueiro, e todas as contas
  compartilham o mesmo rebanho (#416).

### Removed
- Recurso de Associação, por completo (backend, banco e telas) (#416).

### Fixed
- Corrida na criação das contas padrão ao subir o backend (#416).

## [0.8.0] - 2026-11-11

### Added
- Publicação no domínio próprio `alexandrejota.me` (#404).
- Testes de carga com k6 e registro dos limites de capacidade (#406, #407).

### Changed
- O sistema passa a se chamar **QuaLact** (#408).
- Endurecimento de segurança e observabilidade na infraestrutura (#394).

### Fixed
- Nginx respeita o servidor padrão que já existia no host (#405).

## [0.7.0] - 2026-10-14

### Changed
- Novo visual das telas de autenticação (#379).

### Security
- Atualização do Next.js com correção de segurança (#380).

## [0.6.0] - 2026-10-14

### Added
- Varredura DAST agendada com OWASP ZAP (#276) e evidências da varredura de
  segurança (#332).
- Script SQL para recomeçar o banco mantendo só as contas de teste (#378).

### Changed
- Limpeza única de contas na subida e reativação das contas padrão inativas
  (#371, #372).

### Fixed
- Job de Security Scan destravado com a atualização do `handlebars` (#374).

## [0.5.1] - 2026-10-07

### Added
- Deploy automático em produção na OCI após cada build da `main` (#357).

### Security
- Correção dos alertas do Dependabot (#361).

## [0.5.0] - 2026-10-05

### Added
- Varredura de segredos com gitleaks em todo o histórico (#341).
- `/.well-known/security.txt` (RFC 9116) (#337).

### Fixed
- Relatório mensal zerado, filtro de inativos e reativação de funcionário (#333).
- Funcionário que entra com Google fica ligado ao admin que liberou o e-mail (#334).
- Rate limit por usuário e por IP real, sem 429 cruzado entre usuários (#339).
- `binaryTargets` do Prisma voltam a incluir `native` para rodar localmente
  em Windows e macOS (#349).

### Security
- `state` no OAuth do Google contra CSRF de login (#335).
- HSTS, CSP com nonce e demais cabeçalhos nas páginas (#336).
- Nginx oculta a versão, usa o IP real sem forja e limita requisições (#338).
- API com CORS sem credenciais e CSP mínima, sem `unsafe-eval` (#340).
- Raças e tipos de animal só podem ser alterados por ADMIN (#343).
- Cada associação só lê e altera os próprios dados (#344).
- Atualização de dependências: TypeScript 7, nodemailer 10, brace-expansion
  (#282, #304, #308).

## [0.4.3] - 2026-09-30

### Security
- Atualização de dependências, incluindo `multer` 2.4.0 (#302, #306, #307).

## [0.4.2] - 2026-09-30

### Added
- Histórico de atividade do usuário (`activity-logs`): registra login, coletas e
  animais criados ou editados, consultável pelo ADMIN (#293, #295).
- Suíte e2e focada em segurança (autenticação, injeção, IDOR, mass
  assignment), fechando o débito técnico DT-002 (#296).
- Proteção da branch `main` (revisão e checks obrigatórios, sem force-push nem
  exclusão).

### Changed
- Novo layout de autenticação com painel institucional (#292).
- Redesign do painel inicial, dos relatórios, da tela de Funcionários e da
  landing page (#288, #289, #291).
- Cores do texto padronizadas (#287, #290).
- Remoção da Associação no frontend (#286).
- Imagem do backend em Node 25 (#277).

### Fixed
- Migration do Prisma com timestamp fora de ordem, que quebraria o
  `prisma migrate deploy` em produção.
- Testes executados em dobro ao rodar `npm test` sem escopo (#294, #301).
- Build `linux/arm64` do backend falhando no `prisma generate` sob QEMU.
- Regressões visuais (CSS removido ainda referenciado, cores de hover e do PDF).

### Security
- CVE-2026-40345 (HIGH) em `deepmerge-ts`, corrigida por override do npm (#278).
- Atualização de dependências do backend e do frontend (#279, #280).

## [0.4.1] - 2026-09-16

### Changed
- Atualização das ferramentas do frontend: TypeScript 7, ESLint 10, Jest 30 e
  Testing Library (#146, #271, #272, #273, #274) e lotes de dependências
  (#268, #269, #275).

## [0.4.0] - 2026-09-09

### Changed
- Tela inicial de login redesenhada e responsiva (#266).

## [0.3.1] - 2026-09-09

### Fixed
- Job de testes unitários falhando por cobertura de branches no `AuthService` (#265).

## [0.3.0] - 2026-09-09

### Added
- Login com Google restrito a `ifpe.edu.br`, com liberação de e-mails externos
  pelo admin (#264).

## [0.2.15] - 2026-09-09

### Changed
- Publicação da segunda imagem do endurecimento da v0.2.14 e atualização dos
  SBOMs do Trivy.

## [0.2.14] - 2026-09-09

### Security
- Imagem de produção do backend endurecida (#263).
- Atualização de dependências de desenvolvimento (#257).

## [0.2.13] - 2026-09-09

### Changed
- `jest-environment-jsdom` 30 no frontend (#250).

## [0.2.12] - 2026-09-09

### Changed
- Atualização de `@typescript-eslint`, Jest e Testing Library (#246, #248, #249).

## [0.2.11] - 2026-09-09

### Changed
- Lote de dependências de produção (#244).

## [0.2.10] - 2026-09-09

### Changed
- Node 26 na imagem do backend e novas versões das actions da CI
  (#240, #241, #242, #243, #260).

## [0.2.9] - 2026-09-09

### Changed
- `nodemailer` 9.1.1 e `docker/setup-buildx-action` 4 (#239, #261).

## [0.2.8] - 2026-09-09

### Fixed
- Tipo de mudança dos PRs de dependências detectado automaticamente (#258).
- Checks do backend estabilizados na CI (#259).

### Changed
- ESLint 10 no frontend e `fast-uri` no backend (#221, #235).

## [0.2.7] - 2026-09-09

### Changed
- Interface do painel refinada (#233).

### Fixed
- Varredura da imagem do frontend pelo digest (#251).

### Security
- Dependências vulneráveis do frontend atualizadas (#256).

## [0.2.6] - 2026-09-02

### Fixed
- Estilos do Tailwind restaurados no frontend (#232).

## [0.2.5] - 2026-09-02

### Changed
- Frontend alinhado ao padrão visual gov.br do IFPE (#231).

## [0.2.4] - 2026-09-02

### Added
- SBOM gerado pelo Trivy no deploy (#213) e deploy agendado a cada 12h (#214).
- Testes e2e negativos de autorização (IDOR) em usuários e animais (#227, #228).

### Fixed
- E2E instável de relatórios e Jest configurado no frontend (#229).
- Pipelines do backend e do frontend (#226, #230).

### Changed
- `recharts` 3 e Node 26 na imagem do frontend (#107, #195), com lotes de
  dependências (#153, #198).

## [0.2.3] - 2026-08-25

### Changed
- README simplificado (#205) e repositório reorganizado (#210).

### Fixed
- Husky, ESLint e Dependabot na CI do frontend (#211).

### Security
- Bloqueio de escalada de privilégio e IDOR em `PUT/PATCH /users/:id` (#206).

## [0.2.2] - 2026-08-19

### Security
- Trivy passa a bloquear a esteira também em vulnerabilidades HIGH (#204).

## [0.2.1] - 2026-08-18

### Added
- Templates de issue (#202).

### Changed
- Limites de tamanho padronizados nos DTOs e nos schemas de formulário (#203).

## [0.2.0] - 2026-08-18

### Changed
- Rebanho compartilhado, ajustes de autenticação e notificação por e-mail (#200).
- Redis removido: o cache passa a ser sempre em memória (#201).

### Security
- Trivy bloqueia vulnerabilidades CRITICAL na CI, com política documentada (#186).
- Correção de vulnerabilidades e atualização de dependências e actions
  (#95, #96, #98, #124, #131, #187, #188, #190, #192, #194).

## [0.1.2] - 2026-07-13

### Changed
- Documentação para rodar em VM/rede local, com várias origens de CORS e o
  comportamento do SMTP em desenvolvimento (#135, #136, #137, #141).

### Fixed
- `upgrade-insecure-requests` removido da CSP; URLs do Swagger e do health
  documentadas (#142).

### Security
- Vulnerabilidades sem quebra de compatibilidade corrigidas, com triagem
  documentada (#138).

## [0.1.1] - 2026-07-13

### Changed
- Mesmo conteúdo da v0.1.2, publicado para a outra imagem (backend/frontend).

## [0.1.0] - 2026-06-22

### Added
- Primeira versão publicada: backend NestJS + Prisma, frontend Next.js,
  imagens multi-arquitetura no GHCR.

[Unreleased]: https://github.com/jardimdesoftware/qualeider/compare/v0.9.0...HEAD
[0.9.0]: https://github.com/jardimdesoftware/qualeider/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/jardimdesoftware/qualeider/compare/v0.7.0...v0.8.0
[0.7.0]: https://github.com/jardimdesoftware/qualeider/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/jardimdesoftware/qualeider/compare/v0.5.1...v0.6.0
[0.5.1]: https://github.com/jardimdesoftware/qualeider/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/jardimdesoftware/qualeider/compare/v0.4.3...v0.5.0
[0.4.3]: https://github.com/jardimdesoftware/qualeider/compare/v0.4.2...v0.4.3
[0.4.2]: https://github.com/jardimdesoftware/qualeider/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/jardimdesoftware/qualeider/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/jardimdesoftware/qualeider/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/jardimdesoftware/qualeider/compare/v0.3.0...v0.3.1
[0.3.0]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.15...v0.3.0
[0.2.15]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.14...v0.2.15
[0.2.14]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.13...v0.2.14
[0.2.13]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.12...v0.2.13
[0.2.12]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.11...v0.2.12
[0.2.11]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.10...v0.2.11
[0.2.10]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.9...v0.2.10
[0.2.9]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.8...v0.2.9
[0.2.8]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.7...v0.2.8
[0.2.7]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.6...v0.2.7
[0.2.6]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.5...v0.2.6
[0.2.5]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.4...v0.2.5
[0.2.4]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.3...v0.2.4
[0.2.3]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.2...v0.2.3
[0.2.2]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/jardimdesoftware/qualeider/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/jardimdesoftware/qualeider/compare/v0.1.2...v0.2.0
[0.1.2]: https://github.com/jardimdesoftware/qualeider/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/jardimdesoftware/qualeider/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/jardimdesoftware/qualeider/releases/tag/v0.1.0
