FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install

RUN npm run build --workspace=@dev-date/common
RUN npm run build --workspace=@dev-date/auth-service

EXPOSE 3001

CMD ["npm", "start", "--workspace=@dev-date/auth-service"]
