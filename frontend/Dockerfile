# 1. Install dependencies only when needed
FROM node:20-alpine AS deps
WORKDIR /usr/appFrontend

# Copy package.json and lock file
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# 2. Rebuild the source code only when needed
FROM node:20-alpine AS builder
WORKDIR /usr/appFrontend

# Copy dependencies from the 'deps' stage
COPY --from=deps /usr/appFrontend/node_modules ./node_modules
# Copy the rest of the source code
COPY . .

# Set build-time arguments
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# Build the Next.js application
RUN npm run build

# 3. Production image, copy all the files and run next
FROM node:20-alpine AS runner
WORKDIR /usr/appFrontend

ENV NODE_ENV=production

# Necessário para o healthcheck (docker-compose usa wget)
RUN apk add --no-cache wget

# Instalar wget para o healthcheck do Docker
RUN apk add --no-cache wget

# Copy the standalone Next.js server
COPY --from=builder /usr/appFrontend/.next/standalone ./
# Copy the static assets
COPY --from=builder /usr/appFrontend/.next/static ./.next/static
# Copy the public assets
COPY --from=builder /usr/appFrontend/public ./public

EXPOSE 3000

# Run the standalone server
CMD ["node", "server.js"]
