FROM node:20-alpine AS builder

WORKDIR /usr/appBackend

COPY package.json package-lock.json ./
COPY prisma ./prisma/
COPY tsconfig*.json ./

ENV HUSKY=0

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production

WORKDIR /usr/appBackend

ENV NODE_ENV=production HUSKY=0

# Instalar wget para healthcheck
RUN apk add --no-cache wget

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev --ignore-scripts \
	&& npm cache clean --force \
	&& rm -rf /root/.npm

RUN npx prisma generate

COPY --from=builder /usr/appBackend/dist ./dist

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
