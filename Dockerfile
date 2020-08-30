FROM node:12.18.3-alpine3.10

WORKDIR /app
COPY ./ /app


RUN npm install && npm ci

CMD ["npm", "start"]