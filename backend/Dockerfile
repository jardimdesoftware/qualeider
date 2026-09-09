# =============================================================================
# Backend Qualeider - hardened multi-arch image
# =============================================================================

FROM node:24-slim AS builder

ARG TARGETPLATFORM
ARG BUILDPLATFORM

WORKDIR /usr/appBackend

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY tsconfig*.json ./

ENV HUSKY=0

RUN npm ci --ignore-scripts && \
    node node_modules/prisma/build/index.js generate && \
    npm cache clean --force

COPY . .
RUN npm run build

# Prepare production dependencies outside the final image so package managers
# and build utilities do not become part of the runtime attack surface.
FROM node:24-slim AS production-dependencies

WORKDIR /usr/appBackend

RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl ca-certificates && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma/

ENV HUSKY=0

RUN npm ci --omit=dev --ignore-scripts && \
    node node_modules/prisma/build/index.js generate && \
    npm cache clean --force && \
    rm -rf /root/.npm /tmp/*

# Distroless contains Node and only its required runtime libraries. It has no
# shell, package manager, wget, Perl or util-linux.
FROM gcr.io/distroless/nodejs24-debian13:nonroot AS production

WORKDIR /usr/appBackend

ENV NODE_ENV=production \
    HUSKY=0

COPY --from=production-dependencies --chown=nonroot:nonroot /usr/appBackend/node_modules ./node_modules
COPY --from=production-dependencies --chown=nonroot:nonroot /usr/appBackend/package.json ./package.json
COPY --from=production-dependencies --chown=nonroot:nonroot /usr/appBackend/prisma ./prisma
COPY --from=builder --chown=nonroot:nonroot /usr/appBackend/dist ./dist
COPY --from=builder --chown=nonroot:nonroot /usr/appBackend/src/templates ./src/templates
COPY --chown=nonroot:nonroot scripts ./scripts

USER nonroot:nonroot

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD ["/nodejs/bin/node", "scripts/healthcheck.mjs"]

LABEL org.opencontainers.image.title="Qualeider Backend" \
      org.opencontainers.image.description="Backend API for Qualeider platform" \
      org.opencontainers.image.vendor="Qualeider" \
      org.opencontainers.image.licenses="UNLICENSED"

# The distroless Node image already uses Node as its entrypoint.
CMD ["scripts/start-production.mjs"]
