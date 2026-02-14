FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install
RUN npx prisma generate --schema=./apps/profile-service/prisma/schema.prisma || true

RUN npm run build --workspace=@dev-date/common
RUN npm run build --workspace=@dev-date/profile-service

EXPOSE 3002

CMD ["npm", "start", "--workspace=@dev-date/profile-service"]
