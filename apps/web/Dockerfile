FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
COPY packages ./packages
COPY apps ./apps

RUN npm install

RUN npm run build --workspace=@dev-date/common
RUN npm run build --workspace=@dev-date/web

EXPOSE 3000

CMD ["npm", "start", "--workspace=@dev-date/web"]
