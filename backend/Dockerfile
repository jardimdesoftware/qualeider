# =============================================================================
# Dockerfile — Backend Qualeider (Hardened, Multi-arch)
# =============================================================================
# Multi-stage build com boas práticas de segurança:
# - Versões de imagem fixadas (sem :latest)
# - Usuário não-root (appuser, UID 1001)
# - dumb-init como processo PID 1
# - Mínimo de pacotes instalados
# - HEALTHCHECK embutido
# - Labels OCI padronizados
# - Suporte multi-arch: AMD64 + ARM64 (via buildx)
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Builder
# ---------------------------------------------------------------------------
FROM node:24-slim AS builder

# Argumentos de build para multi-arch (informativo)
ARG TARGETPLATFORM
ARG BUILDPLATFORM

WORKDIR /usr/appBackend

RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Copiar apenas arquivos necessários para install (cache de camada)
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY tsconfig*.json ./

ENV HUSKY=0

# Instalar dependências (inclui devDependencies para build)
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Gerar Prisma Client
RUN node node_modules/prisma/build/index.js generate

# Copiar código-fonte e compilar
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Production
# ---------------------------------------------------------------------------
FROM node:24-slim AS production

# Instalar dumb-init (init process correto para PID 1) e wget para healthcheck
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y --no-install-recommends dumb-init wget openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

# Criar usuário não-root
RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --home-dir /usr/appBackend --shell /usr/sbin/nologin appuser

WORKDIR /usr/appBackend

ENV NODE_ENV=production \
    HUSKY=0

# Copiar arquivos de dependência
COPY --chown=appuser:appgroup package.json package-lock.json ./
COPY --chown=appuser:appgroup prisma ./prisma/

# Instalar apenas dependências de produção
RUN npm ci --omit=dev --ignore-scripts && \
    npm cache clean --force && \
    rm -rf /root/.npm /tmp/*

# Gerar Prisma Client para produção
RUN node node_modules/prisma/build/index.js generate

# Copiar artefatos de build
COPY --from=builder --chown=appuser:appgroup /usr/appBackend/dist ./dist
COPY --from=builder --chown=appuser:appgroup /usr/appBackend/src/templates ./src/templates

# Remover gerenciadores de pacote do runtime; o container usa o Prisma local e o app via node.
RUN rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/lib/node_modules/corepack \
    /opt/yarn-* \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/bin/corepack \
    /usr/local/bin/yarn \
    /usr/local/bin/yarnpkg

# Mudar para usuário não-root
USER appuser

# Expor porta da aplicação
EXPOSE 3000

# Healthcheck embutido — verifica se a API responde
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Labels OCI padronizados
LABEL org.opencontainers.image.title="Qualeider Backend" \
      org.opencontainers.image.description="Backend API for Qualeider platform" \
      org.opencontainers.image.vendor="Qualeider" \
      org.opencontainers.image.licenses="UNLICENSED"

# Usar dumb-init como entrypoint (trata sinais corretamente)
ENTRYPOINT ["dumb-init", "--"]

# Executar migrations e iniciar servidor
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node dist/src/presentation/main.js"]
