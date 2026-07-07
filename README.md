# QuaLeiDer

Plataforma para gestão de produtores, animais e coletas diárias de leite.

Este repositório é um monorepo com:

- **Backend**: API REST em NestJS + Prisma + PostgreSQL
- **Frontend**: Web App em Next.js (App Router) + Tailwind CSS

![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white) ![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white) ![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white) ![PostgreSQL](https://img.shields.io/badge/postgresql-4169e1?style=for-the-badge&logo=postgresql&logoColor=white) ![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white) ![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

---

## Stack principal

| Camada | Tecnologia |
|---|---|
| Backend | Node.js 20, NestJS 10, Prisma 6 |
| Banco de dados | PostgreSQL 14 |
| Cache | Redis 7 (produção) / in-memory (dev) |
| Frontend | Next.js 15, React 19, Tailwind CSS |
| Auth | JWT (Bearer), bcrypt |
| Email | Nodemailer (SMTP) |
| Docs | Swagger em `/api-docs` |
| CI/CD | GitHub Actions + GHCR (imagens multi-arch AMD64 + ARM64) |

---

## Arquitetura (backend)

O backend segue Clean Architecture por camadas:

```
backend/src/
  domain/          # Entidades, enums e interfaces de repositório
  application/     # DTOs, casos de uso e portas (interfaces de serviço)
  infrastructure/  # Prisma (repositórios), serviços JWT/bcrypt, email
  presentation/    # Controllers NestJS, main.ts (bootstrap)
  common/          # Filtros globais, cache config, guards reutilizáveis
```

---

## Ambientes Docker

O projeto possui **quatro arquivos de compose**, cada um com um propósito específico:

| Arquivo | Ambiente | Quando usar |
|---|---|---|
| `docker-compose.dev.yml` | Desenvolvimento local | Dia a dia — backend/frontend rodam no host |
| `docker-compose.local.yml` | Simulação de produção local | Testar nginx + stack completa antes de fazer deploy |
| `docker-compose.yml` | Produção (build local) | Deploy sem CI/CD configurado, build das imagens na hora |
| `docker-compose.prod.yml` | Produção (imagens GHCR) | Deploy via pipeline — usa imagens pré-publicadas multi-arch |

---

## 🖥️ Desenvolvimento local (recomendado)

O modo de desenvolvimento usa **apenas a infra em container** (banco + redis).  
O backend e o frontend rodam no host para ter hot-reload e acesso ao debugger.

### 1. Pré-requisitos

- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ou Docker + Docker Compose

### 2. Configuração inicial

```bash
# Clone o repositório
git clone https://github.com/ifpebj-ti/qualeider.git
cd qualeider

# Configure as variáveis de ambiente
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

> Os defaults de `NEXT_PUBLIC_API_URL` e `CORS_ORIGINS` acima cobrem o fluxo
> onde backend e frontend rodam na mesma máquina. Para rodar em VM ou acessar
> pela rede local, veja a seção [🌐 Executando em VM ou rede local](#-executando-em-vm-ou-rede-local).

### 3. Suba a infra (banco + redis)

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 4. Rode o backend

```bash
cd backend
npm install
npx prisma migrate dev   # Aplica migrations e gera o Prisma Client
npm run start:dev        # Hot-reload em http://localhost:3000
```

> API Docs (Swagger): [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### 5. Rode o frontend

```bash
cd frontend
npm install
npm run dev              # Hot-reload em http://localhost:3001
```

---

## 🌐 Executando em VM ou rede local

Cenário comum: você roda backend e frontend numa máquina/VM, mas acessa pelo
navegador de **outro dispositivo** na mesma rede (outra máquina, celular, ou
a VM acessada do host). Isso exige alguns ajustes que não são necessários
quando tudo roda no mesmo host.

### `localhost`, `127.0.0.1` e IP da máquina não são a mesma coisa

- `localhost` e `127.0.0.1` só resolvem para o **próprio dispositivo** — um
  navegador rodando fora da máquina/VM nunca alcança `http://localhost:3000`
  dela, mesmo que o servidor esteja de pé.
- Para acessar de outro dispositivo, use o **IP real da máquina/VM na rede**
  (ex.: `192.168.10.85`), descoberto com `ipconfig` (Windows) ou `ip addr` /
  `hostname -I` (Linux).
- Isso também importa para `CORS_ORIGINS`: o backend valida o header `Origin`
  exatamente como o navegador o envia — se você acessa por IP, `localhost` na
  whitelist não serve, e vice-versa. Por isso os `.env.example` já trazem
  `localhost` **e** `127.0.0.1` juntos, e é preciso adicionar o IP manualmente.

### 1. Exponha frontend e backend na rede

Ambos já escutam em todas as interfaces por padrão em dev, então normalmente
não é preciso mudar nada além do firewall/rede:

- Backend: `app.listen(port, '0.0.0.0')` em [`backend/src/presentation/main.ts`](backend/src/presentation/main.ts).
- Frontend: `next dev -p 3001` também escuta em `0.0.0.0`.

Se estiver numa VM, garanta que a porta 3000 (backend) e 3001 (frontend)
estejam liberadas/encaminhadas (port forwarding ou modo bridge na config de
rede da VM).

### 2. Configure `frontend/.env.local`

```bash
# Troque pelo IP real da máquina/VM que roda o backend
NEXT_PUBLIC_API_URL=http://192.168.10.85:3000/api
```

### 3. Configure `backend/.env`

```bash
# Mantenha localhost/127.0.0.1 (útil se você também testa no mesmo host)
# e adicione o IP:porta de onde o frontend será acessado
CORS_ORIGINS="http://localhost:3001,http://127.0.0.1:3001,http://192.168.10.85:3001"
```

### 4. Valide a conectividade com `curl`

Antes de testar pelo navegador, confirme que a API responde pelo IP:

```bash
curl -i http://192.168.10.85:3000/api/health
# Esperado: HTTP/1.1 200 OK  { "status": "ok", "timestamp": "..." }
```

Se isso falhar, o problema é de rede/firewall — ainda não chegou a ser CORS
ou autenticação.

### 5. Troubleshooting: interpretando os erros

| Sintoma no DevTools | Causa provável | Onde ajustar |
|---|---|---|
| `ERR_CONNECTION_REFUSED` / `Failed to fetch` | `NEXT_PUBLIC_API_URL` aponta para host/porta errado, ou backend não está de pé/acessível pela rede | `frontend/.env.local` → `NEXT_PUBLIC_API_URL`; confirme com o `curl` acima |
| Erro de CORS / falha silenciosa no `OPTIONS` (preflight) | O `Origin` do navegador não está na whitelist do backend | `backend/.env` → `CORS_ORIGINS` (adicione o IP:porta exato usado no navegador) |
| `404 Not Found` | Faltou o prefixo `/api` na URL, ou rota não existe | Confirme que `NEXT_PUBLIC_API_URL` termina em `/api` |
| `401 Unauthorized` | Ótimo sinal — a requisição chegou até a API. Falha é de credenciais (usuário/senha), não de rede/CORS | Verifique o usuário de teste ou o fluxo de autenticação |

> **Nota de segurança**: nunca use `CORS_ORIGINS=*` para "resolver rápido" o
> problema, mesmo em dev — a API usa `credentials: true` (JWT/cookies), e
> liberar qualquer origem nesse modo expõe a aplicação a requisições forjadas
> de sites de terceiros.

---

## 📧 Comportamento de e-mail (SMTP) em desenvolvimento

Ao subir o backend sem `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` preenchidos em
`backend/.env`, você verá este aviso no log de boot:

```
SMTP configuration incomplete. Email sending will fail!
```

Isso **não impede o backend de subir** — só avisa que o envio de e-mail vai
falhar. O impacto real varia bastante por fluxo; a tabela abaixo resume o que
foi confirmado no código (`backend/src/mail/`, `backend/src/listener/`,
`backend/src/application/services/`):

| Fluxo | Funciona sem SMTP? | O que acontece quando o envio falha |
|---|---|---|
| **Login** | ✅ Sim | Não envia e-mail nenhum — login não depende de SMTP. |
| **Redefinir senha** (aplicar a nova senha com o token) | ✅ Sim | Não envia e-mail — só valida o token e atualiza a senha. |
| **Esqueci minha senha** (solicitar o link) | ⚠️ **Não** | O token **é salvo no banco** antes do envio, mas o e-mail é enviado de forma síncrona dentro da mesma requisição — se falhar, o erro sobe e a requisição HTTP retorna erro, mesmo com o token já persistido. **Não há retry nem fallback em `failed_emails` para este fluxo.** |
| **Convites** (criar/aceitar/recusar) | ✅ Sim | O convite é persistido no banco independente do e-mail. O envio roda em um listener assíncrono (`invite-email.listener.ts`) que **captura e apenas loga** a falha — sem retry, sem `failed_emails`. O e-mail simplesmente se perde silenciosamente. |
| **Notificações** | ✅ Sim | A notificação é persistida no banco independente do e-mail. O envio (`email.listener.ts`) tenta **3 vezes** (backoff de 2s e 4s) e, se todas falharem, grava o registro na tabela `failed_emails` (model `FailedEmail` no `schema.prisma`) em vez de perder o e-mail. |

> **Atenção**: a tabela `failed_emails` só recebe registros do fluxo de
> **notificações**. Convites perdidos não aparecem lá, e "esqueci minha senha"
> nem chega a tentar — ele quebra a requisição antes disso.

### Configurando o Ethereal para testar e-mails localmente

[Ethereal](https://ethereal.email) cria uma caixa de entrada fake — o e-mail
"é enviado" de verdade via SMTP, mas fica preso lá, sem chegar a ninguém.

1. Acesse [ethereal.email](https://ethereal.email) e clique em **Create Ethereal Account** (gera usuário/senha na hora, não precisa cadastro).
2. Copie o `Username` e `Password` gerados para `backend/.env`:
   ```
   SMTP_HOST="smtp.ethereal.email"
   SMTP_PORT=587
   SMTP_USER="<usuário gerado pelo Ethereal>"
   SMTP_PASSWORD="<senha gerada pelo Ethereal>"
   SMTP_FROM="noreply@qualeider.com"
   ```
3. Reinicie o backend (`npm run start:dev`) — o aviso de SMTP incompleto deve sumir do log.
4. Dispare qualquer fluxo que envie e-mail (convite, notificação, esqueci minha senha) e acesse [ethereal.email/messages](https://ethereal.email/messages) (logado com o mesmo usuário/senha) para ver o e-mail capturado.

### Inspecionando e-mails que falharam (`failed_emails`)

Hoje não existe endpoint ou tela para isso — só é possível consultar direto no banco:

```bash
cd backend
npx prisma studio   # abre uma UI em http://localhost:5555 — tabela failed_emails
```

Ou via SQL direto (`psql`, DBeaver, etc.): `SELECT * FROM failed_emails ORDER BY "createdAt" DESC;`

---

## 🔬 Simulação local de produção

Sobe **todos os serviços em container** com nginx como reverse proxy.  
Útil para validar roteamento, proxy e integração antes do deploy real.

```bash
# Configure o .env
cp .env.example .env
# Edite o NEXT_PUBLIC_API_URL para /api (nginx faz o proxy)

docker compose -f docker-compose.local.yml up --build -d
```

| URL | Serviço |
|---|---|
| `http://localhost:8080` | Frontend |
| `http://localhost:8080/api` | API REST |
| `http://localhost:8080/api-docs` | Swagger |

---

## 🚀 Deploy em produção

### Opção 1 — Build local (sem CI/CD)

```bash
# No servidor:
cp .env.example .env
# Preencha os valores reais no .env

docker compose up --build -d

# Frontend: http://<ip-servidor>:3001
# API:      http://<ip-servidor>:3000/api
```

### Opção 2 — Imagens GHCR (recomendado, via CI/CD)

As imagens são publicadas automaticamente via GitHub Actions no GHCR  
com suporte a **AMD64 e ARM64** (servidores OCI Free Tier, ARM, etc.).

```bash
# No servidor, faça login no GHCR:
echo $CR_PAT | docker login ghcr.io -u <SEU_USUARIO_GITHUB> --password-stdin

# Configure o .env com o owner e tags das imagens:
cp .env.example .env
# GHCR_OWNER=ifpebj-ti
# BACKEND_TAG=latest   (ou ex: 1.2.0)
# FRONTEND_TAG=latest

docker compose -f docker-compose.prod.yml up -d
```

#### Atualizar para nova versão

```bash
# Puxar as novas imagens:
docker compose -f docker-compose.prod.yml pull

# Recriar os containers:
docker compose -f docker-compose.prod.yml up -d
```

#### Verificar arquiteturas disponíveis

```bash
docker manifest inspect ghcr.io/ifpebj-ti/qualeider-backend:latest
```

---

## 🧪 Testes (backend)

```bash
cd backend

npm run test:unit         # Testes unitários
npm run test:integration  # Testes de integração (requer PostgreSQL)
npm run test:e2e          # Testes E2E (requer PostgreSQL)
npm run test:all          # Unit + E2E
```

---

## 🛡️ Segurança de dependências

Auditoria de vulnerabilidades (`npm audit`) do backend e frontend, com plano de
priorização e triagem: veja [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md).

---

## Estrutura de pastas

```
qualeider/
├── backend/               # API NestJS + Prisma
│   ├── src/
│   │   ├── domain/        # Entidades e interfaces
│   │   ├── application/   # Casos de uso e DTOs
│   │   ├── infrastructure/# Prisma, JWT, bcrypt
│   │   ├── presentation/  # Controllers, main.ts
│   │   └── common/        # Filtros, cache, guards
│   ├── prisma/            # schema.prisma e migrations
│   └── Dockerfile
│
├── frontend/              # App Next.js
│   ├── src/
│   │   ├── app/           # Rotas (App Router)
│   │   ├── components/    # Componentes UI
│   │   └── services/      # Integração com API
│   └── Dockerfile
│
├── nginx/
│   └── nginx.conf         # Config do reverse proxy
│
├── .github/workflows/
│   ├── backend-ci.yml     # CI/CD do backend (multi-arch)
│   └── frontend-cicd.yml  # CI/CD do frontend (multi-arch)
│
├── docker-compose.dev.yml    # 🖥️ Desenvolvimento (só infra)
├── docker-compose.local.yml  # 🔬 Simulação local (stack completa)
├── docker-compose.yml        # 🚀 Produção (build local)
└── docker-compose.prod.yml   # 🚀 Produção (imagens GHCR)
```

---

## Variáveis de ambiente

Consulte o [`.env.example`](.env.example) para a lista completa com descrições.  
Para variáveis exclusivas do backend em desenvolvimento, veja [`backend/.env.example`](backend/.env.example).

### Variáveis obrigatórias em produção

| Variável | Descrição |
|---|---|
| `POSTGRES_PASSWORD` | Senha do PostgreSQL |
| `JWT_SECRET` | Chave para assinar tokens JWT (mínimo 32 chars) |
| `REDIS_PASSWORD` | Senha do Redis |
| `SMTP_USER` / `SMTP_PASSWORD` | Credenciais de email |

---

## Contribuição

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes de contribuição.
