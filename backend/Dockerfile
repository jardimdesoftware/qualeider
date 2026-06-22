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
FROM node:25.2-alpine3.21 AS builder

# Argumentos de build para multi-arch (informativo)
ARG TARGETPLATFORM
ARG BUILDPLATFORM

WORKDIR /usr/appBackend

# Copiar apenas arquivos necessários para install (cache de camada)
COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY tsconfig*.json ./

ENV HUSKY=0

# Instalar dependências (inclui devDependencies para build)
RUN npm ci --ignore-scripts && \
    npm cache clean --force

# Gerar Prisma Client
RUN npx prisma generate

# Copiar código-fonte e compilar
COPY . .
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Production
# ---------------------------------------------------------------------------
FROM node:25.2-alpine3.21 AS production

# Instalar dumb-init (init process correto para PID 1) e wget para healthcheck
RUN apk add --no-cache dumb-init wget && \
    rm -rf /var/cache/apk/*

# Criar usuário não-root
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

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
RUN npx prisma generate

# Copiar artefatos de build
COPY --from=builder --chown=appuser:appgroup /usr/appBackend/dist ./dist

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
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/presentation/main.js"]
