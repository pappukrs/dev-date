FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY packages ./packages
COPY apps ./apps

RUN rm -rf package-lock.json apps/*/package-lock.json packages/*/package-lock.json
RUN npm install
RUN npx prisma generate --schema=./apps/marketplace-service/prisma/schema.prisma

RUN npm run build --workspace=@dev-date/common
RUN npm run build --workspace=@dev-date/marketplace-service

EXPOSE 3007

CMD ["sh", "-c", "cd apps/marketplace-service && npx prisma db push --skip-generate && cd /app && npm start --workspace=@dev-date/marketplace-service"]
