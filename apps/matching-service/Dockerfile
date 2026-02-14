FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install
RUN npx prisma generate --schema=./apps/matching-service/prisma/schema.prisma || true

RUN npm run build --workspace=@dev-date/common
RUN npm run build --workspace=@dev-date/matching-service

EXPOSE 3004

CMD ["npm", "start", "--workspace=@dev-date/matching-service"]
