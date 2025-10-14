FROM node:20-alpine

WORKDIR /usr/appBackend

COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig.json ./

RUN npm install

COPY . .

RUN npx prisma generate

RUN npx nest --version

RUN npm run build

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && npm run start:prod"]