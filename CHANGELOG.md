# Changelog

Todas as mudanças relevantes deste projeto são documentadas aqui.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e o versionamento adota [Semantic Versioning](https://semver.org/lang/pt-BR/).

O histórico completo e automático de cada release (com o diff de PRs
incluídos) fica nas [Releases do GitHub](https://github.com/jardimdesoftware/qualeider/releases).
Este arquivo resume as mudanças de maior impacto para quem não quer ler o
histórico de PRs inteiro.

## [Unreleased]

### Added
- Módulo de histórico de atividade do usuário (`activity-logs`): registra login,
  criação/edição de coleta diária e criação/edição de animal, consultável pelo
  ADMIN para acompanhar a atividade dos seus Vaqueiros (#295, #293).
- Suíte de testes e2e focada em segurança (autenticação, injeção, IDOR, mass
  assignment), fechando o débito técnico DT-002 (#296).
- Proteção da branch `main` (revisão obrigatória, checks obrigatórios,
  bloqueio de force-push e exclusão).
- Novo layout de autenticação (login, criar conta, recuperar senha) com painel
  de identidade institucional (#292).
- Redesign do dashboard, da tela de Funcionários e da landing page (#288, #289, #291).

### Changed
- Remoção da funcionalidade de Associação, não utilizada pelo produto (#286).
- Padronização de cores da interface, reduzindo uso excessivo de cor no texto (#287, #290).

### Fixed
- Migration do Prisma com timestamp fora de ordem, que quebraria
  `prisma migrate deploy` em produção.
- Vulnerabilidade HIGH (CVE-2026-40345) em `deepmerge-ts`, dependência
  transitiva de `@prisma/config`, corrigida via override do npm (#278).
- Duplicação de execução de testes ao rodar `npm test` sem escopo de
  `testMatch` (#294, #301).
- Build multi-arquitetura (`linux/arm64`) do backend, que falhava no
  `prisma generate` sob emulação QEMU (`CHECKPOINT_DISABLE=1`).
- Diversos bugs de regressão visual (CSS removido mas ainda referenciado,
  cores de hover desatualizadas, cores de PDF exportado).

## Releases anteriores

Consulte a [página de Releases](https://github.com/jardimdesoftware/qualeider/releases)
para o histórico de versões `v0.1.0` a `v0.4.1`, geradas automaticamente pela
esteira de CI/CD a cada merge relevante em `main`.
