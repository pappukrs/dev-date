FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY packages ./packages
COPY apps ./apps

RUN rm -rf package-lock.json apps/*/package-lock.json packages/*/package-lock.json
RUN npm install

RUN npm run build --workspace=@dev-date/common
RUN npm run build --workspace=@dev-date/api-gateway

EXPOSE 8000

CMD ["npm", "start", "--workspace=@dev-date/api-gateway"]
