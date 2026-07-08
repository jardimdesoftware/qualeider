# =============================================================================
# Dockerfile — Frontend Qualeider (Multi-arch)
# =============================================================================
# Multi-stage build para Next.js com suporte a AMD64 + ARM64 (via buildx)
# - Versões de imagem fixadas (node:20.18-alpine3.21)
# - Usuário não-root
# - Build standalone do Next.js
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Instalar dependências
# ---------------------------------------------------------------------------
FROM node:25.2-alpine3.21 AS deps

# Argumentos de build para multi-arch (informativo)
ARG TARGETPLATFORM
ARG BUILDPLATFORM

WORKDIR /usr/appFrontend

# Copiar arquivos de dependência
COPY package.json package-lock.json ./

# Instalar dependências
RUN npm ci

# ---------------------------------------------------------------------------
# Stage 2: Build da aplicação
# ---------------------------------------------------------------------------
FROM node:25.2-alpine3.21 AS builder

WORKDIR /usr/appFrontend

# Copiar dependências do stage anterior
COPY --from=deps /usr/appFrontend/node_modules ./node_modules
# Copiar o restante do código-fonte
COPY . .

# Argumentos de build em tempo de compilação
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_VERSION
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}

# Build da aplicação Next.js
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: Imagem de produção
# ---------------------------------------------------------------------------
FROM node:25.2-alpine3.21 AS runner

WORKDIR /usr/appFrontend

ENV NODE_ENV=production

# Instalar wget para o healthcheck
RUN apk add --no-cache wget && \
    rm -rf /var/cache/apk/*

# Criar usuário não-root
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Copiar servidor Next.js standalone
COPY --from=builder --chown=appuser:appgroup /usr/appFrontend/.next/standalone ./
# Copiar assets estáticos
COPY --from=builder --chown=appuser:appgroup /usr/appFrontend/.next/static ./.next/static
# Copiar arquivos públicos
COPY --from=builder --chown=appuser:appgroup /usr/appFrontend/public ./public

# Mudar para usuário não-root
USER appuser

EXPOSE 3000

# Healthcheck embutido
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Labels OCI padronizados
LABEL org.opencontainers.image.title="Qualeider Frontend" \
      org.opencontainers.image.description="Frontend Next.js for Qualeider platform" \
      org.opencontainers.image.vendor="Qualeider" \
      org.opencontainers.image.licenses="UNLICENSED"

# Executar o servidor standalone
CMD ["node", "server.js"]
