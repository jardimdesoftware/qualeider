# Mapa de Segurança — Qualeider

> Documento de referência: tudo que existe de segurança no projeto, onde está e o que faz.
> Não substitui o [`SECURITY.md`](./SECURITY.md) (política oficial de triagem/vulnerabilidades) — este aqui é um mapa prático de "o que tem e onde".
> Gerado em 2026-09-15, revisando o estado atual da branch `main`.

---

## 1. Processo / CI (governança de segurança)

Roda automaticamente no GitHub, sem precisar de nada manual no dia a dia.

| O que é | Onde está | O que faz |
|---|---|---|
| **Dependabot** | [`.github/dependabot.yml`](.github/dependabot.yml) | Abre PR toda segunda-feira 06h (America/Sao_Paulo) atualizando dependências npm do backend e frontend, imagens Docker e GitHub Actions. |
| **Trivy — Filesystem Scan** | [`.github/workflows/backend-ci.yml`](.github/workflows/backend-ci.yml) e [`.github/workflows/frontend-ci.yml`](.github/workflows/frontend-ci.yml) | Escaneia dependências do projeto. **Bloqueia o CI** (`exit-code: 1`) se achar `CRITICAL`/`HIGH` em push na `main` ou PR com base `main`. Em outros branches só reporta. |
| **Trivy — Secrets Scan** | `backend-ci.yml` (linha ~423) | Procura segredos/credenciais commitados por engano no código. Nunca bloqueia o pipeline (`exit-code: 0`), só alerta. |
| **Trivy — Config Scan** | `backend-ci.yml` (linha ~433) | Analisa `Dockerfile` e configs de CI em busca de má configuração. Mesma regra de bloqueio do FS Scan. |
| **Trivy — Docker Image Scan** | `backend-ci.yml` (linha ~605) e `frontend-ci.yml` (linha ~291) | Escaneia a imagem Docker já buildada (SO + libs do container). Mesma regra de bloqueio. |
| **Trivy — SBOM (CycloneDX)** | `backend-ci.yml` (linha ~644) | Gera a lista completa de dependências a cada push — são os commits automáticos `chore(sbom): update Trivy SBOM files` que aparecem no histórico. Arquivos ficam em [`sbom/`](./sbom). |
| **Trivy → GitHub Security (SARIF)** | mesmos workflows, steps `Upload Trivy SARIF...` | Envia os achados pra aba **Security → Code scanning** do GitHub, pra ficar visível e rastreável (não só no log do CI). |
| **`.trivyignore`** | [`backend/.trivyignore`](backend/.trivyignore), [`frontend/.trivyignore`](frontend/.trivyignore) | Lista de exceções documentadas (achados aceitos como risco, com justificativa) — auditada trimestralmente segundo o `SECURITY.md`. |
| **CodeQL** | [`.github/workflows/codeql.yml`](.github/workflows/codeql.yml) | Análise estática de código (SAST) pra JavaScript/TypeScript — roda em PRs, pushes e semanalmente, procura padrões de código vulnerável (não é só dependência, é o próprio código). |
| **Vulnerability Badge** | [`.github/workflows/vulnerability-badge.yml`](.github/workflows/vulnerability-badge.yml) | Todo dia às 12h UTC, conta os alertas abertos do Dependabot e atualiza o badge [`badges/vulnerabilidades.svg`](./badges) mostrado no README. |
| **Relato privado de vulnerabilidade** | Aba **Security → Report a vulnerability** do repo no GitHub | Canal privado pra reportar falha crítica/explorável sem abrir issue pública. |
| **Issue template de segurança** | `.github/ISSUE_TEMPLATE/seguranca.yml` | Template pra reportar fragilidades não-críticas (hardening, defesa em profundidade). |
| **Política de triagem completa** | [`SECURITY.md`](./SECURITY.md) | Documento oficial: regras de o que bloqueia release, prazos, estados de backlog (`fix-now`/`scheduled`/`accepted-risk`/`false-positive`), rotina obrigatória por sprint. |

---

## 2. Aplicação — Backend

Código que roda em toda requisição, dentro do NestJS.

| O que é | Onde está | O que faz |
|---|---|---|
| **Helmet** | `backend/src/presentation/main.ts` (linha ~166) | Cabeçalhos HTTP de segurança: CSP (`default-src 'self'`), HSTS, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `X-XSS-Protection: 0` (delega pro CSP), etc. |
| **CORS com allowlist** | `main.ts`, função `configureCors` | Só libera as origens listadas em `CORS_ORIGINS` (env var) + `credentials: true`. Nunca é `*` em produção (documentado no próprio `.env.example`). |
| **Rate limiting (Throttler)** | [`backend/src/common/throttler/throttler.config.ts`](backend/src/common/throttler/throttler.config.ts) | Padrão global: 10 requisições / 60s por IP em qualquer rota sem config própria. |
| **Throttle específico em rotas sensíveis** | `@Throttle(...)` em [`auth.controller.ts`](backend/src/presentation/controllers/auth.controller.ts) | `login`: 3 tentativas/60s. `forgot-password` e `reset-password`: 3/300s. `validate-reset-token`: 5/60s. `google/callback`: 5/60s. Dificulta brute-force e abuso do fluxo de recuperação de senha. |
| **JWT + Guard global** | [`jwt.strategy.ts`](backend/src/auth/jwt.strategy.ts), [`jwt-auth.guard.ts`](backend/src/application/guards/jwt-auth.guard.ts), registrado como `APP_GUARD` em `app.module.ts` | **Toda rota exige token válido por padrão.** Só libera sem token as marcadas com `@Public()` ([`public.decorator.ts`](backend/src/common/decorators/public.decorator.ts)). |
| **Hash de senha (bcrypt)** | [`bcrypt-hash.service.ts`](backend/src/infrastructure/services/bcrypt-hash.service.ts) + [`security.constants.ts`](backend/src/common/constants/security.constants.ts) | Senha nunca fica em texto puro. 10 rounds na criação de conta, 12 rounds no reset (mais caro de propósito — conta pode ter sido comprometida). |
| **Política de senha forte** | `CreateUserDto` (`backend/src/application/dtos/users/create-user.dto.ts`), regex `@Matches` | Exige maiúscula, minúscula, número e caractere especial, mínimo 8 caracteres. |
| **Validação global de entrada** | `main.ts`, `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))` | `whitelist: true` descarta qualquer campo que o DTO não declarar — protege contra mass assignment (mandar campos extras tipo `role: ADMIN` escondido no body). |
| **Autorização por papel + posse** | `assertAdmin`/`assertCanManage` em [`users.service.ts`](backend/src/application/services/users/users.service.ts) | Só ADMIN gerencia usuários, e só os que ele mesmo cadastrou (via `adminId`) ou da mesma associação — impede um Admin editar/ver conta de outra fazenda. |
| **Prisma ORM** | todo `backend/src/infrastructure/repositories/*` | Queries parametrizadas por padrão — protege contra SQL injection sem precisar escrever SQL cru. |
| **Soft delete** | `UsersService.remove()` → `userRepository.softDelete()` | Nunca apaga usuário de fato via API pública, só marca `Inactive`. |
| **Token de reset de senha** | `AuthService.forgotPassword`/`validateResetToken` (`auth.service.ts`) | Código numérico de 6 dígitos, expira em 15 min (`RESET_TOKEN_EXPIRY_MINUTES`), invalidado depois de usado. |
| **Swagger controlável** | `main.ts`, `SWAGGER_ENABLED` (env var) | Pode ser desligado em produção; quando desligado, responde **403 explícito** em `/api-docs*` em vez de deixar um 404 ambíguo. |
| **Filtros de exceção** | `HttpExceptionFilter`, `PrismaExceptionFilter` (`backend/src/common/filters/`) | Evita que erro do Prisma (ex: detalhe de query) ou stack trace vaze pra resposta da API. |
| **Login com Google — troca server-to-server** | `AuthService.handleGoogleCallback`/`getGoogleAuthUrl` (`backend/src/auth/auth.service.ts`) | O `code` do Google é troc­ado por token direto backend↔Google via `fetch`; o `GOOGLE_CLIENT_SECRET` nunca passa pelo navegador do usuário. |
| **Login com Google — allowlist de domínio/email** | `isIfpeEmail()` (`backend/src/common/utils/email-domain.util.ts`) + tabela `allowed_emails` (`AllowedEmailsController`) | Só entra quem tem email `@ifpe.edu.br` (ou subdomínio) ou foi liberado manualmente por um Admin — não é "qualquer conta Google loga". |

---

## 3. Aplicação — Frontend

| O que é | Onde está | O que faz |
|---|---|---|
| **Token em localStorage** | `frontend/src/utils/auth.ts` | Guarda o JWT no navegador; toda chamada via `apiBase` (`services/baseApi.tsx`) injeta `Authorization: Bearer <token>` automaticamente. |
| **Interceptor de 401** | `baseApi.tsx` | Detecta token inválido/expirado na resposta e loga o aviso (retorno tratado pelas telas, que redirecionam pro login). |
| **Guarda de rota por papel** | `getUserRoleFromToken()` usado em páginas como `manageUsers/page.tsx` | Páginas de Admin (ex: Funcionários) redirecionam quem não é ADMIN pro dashboard comum, mesmo que a pessoa tente acessar a URL direto. |

---

## 4. Pontos de atenção (não são falhas confirmadas, mas vale registrar)

| Ponto | Onde | Por quê vale olhar |
|---|---|---|
| **Token de reset usa `Math.random()`** | `AuthService.forgotPassword` (`auth.service.ts` ~linha 275) | `Math.random()` não é criptograficamente seguro. Baixo risco aqui porque é um código de 6 dígitos com 15 min de validade e rate limit, mas o ideal seria `crypto.randomInt()`. |
| **JWT sem refresh/revogação** | `AuthModule`, `JwtModule.registerAsync` | Token expira em 24h e não pode ser revogado antes disso — se vazar, continua válido até expirar. |
| **CSP com `unsafe-inline`/`unsafe-eval`** | `main.ts`, config do Helmet | Necessário pro Swagger UI funcionar, mas relaxa a proteção contra XSS nas outras rotas também (é global, não só no `/api-docs`). |
| **Sem MFA** | — | Login (senha ou Google) é fator único. |

---

## Como conferir tudo isso na prática

- **Alertas ativos agora**: aba *Security* do repo no GitHub → `Dependabot alerts` e `Code scanning`.
- **Rodar o Trivy localmente**: `trivy fs backend/` ou `trivy fs frontend/` (mesma ferramenta do CI).
- **Ver o SBOM atual**: pasta [`sbom/`](./sbom) na raiz do repo.
- **Testar rate limit**: bater várias vezes em `POST /api/auth/login` com senha errada — a partir da 4ª tentativa em 60s deve vir `429`.
