FROM node:22-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY packages ./packages
COPY apps ./apps

RUN rm -rf package-lock.json apps/*/package-lock.json packages/*/package-lock.json
RUN npm install
RUN npx prisma generate --schema=./apps/matching-service/prisma/schema.prisma

RUN npm run build --workspace=@dev-date/common
RUN npm run build --workspace=@dev-date/matching-service

EXPOSE 3004

CMD ["sh", "-c", "npx prisma db push --schema=./apps/matching-service/prisma/schema.prisma --skip-generate && npm start --workspace=@dev-date/matching-service"]
