FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY packages ./packages
COPY apps ./apps

RUN rm -rf package-lock.json apps/*/package-lock.json packages/*/package-lock.json
RUN npm install
RUN npx prisma generate --schema=./apps/reputation-service/prisma/schema.prisma

RUN npm run build --workspace=@dev-date/common
RUN npm run build --workspace=@dev-date/reputation-service

EXPOSE 3006

CMD ["sh", "-c", "cd apps/reputation-service && npx prisma db push --skip-generate && cd /app && npm start --workspace=@dev-date/reputation-service"]
