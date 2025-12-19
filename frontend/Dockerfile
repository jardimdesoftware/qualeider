FROM node:20-alpine AS deps

WORKDIR /usr/appFrontend

COPY package*.json ./

RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /usr/appFrontend

COPY --from=deps /usr/appFrontend/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /usr/appFrontend

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /usr/appFrontend/.next ./.next
COPY --from=builder /usr/appFrontend/public ./public
COPY --from=builder /usr/appFrontend/next.config.ts ./next.config.ts

EXPOSE 3000

CMD ["npm", "run", "start"]
