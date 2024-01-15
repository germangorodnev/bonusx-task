FROM node:20.10.0

WORKDIR /usr/src/bx-file-transfer-service

COPY package.json .
COPY yarn.lock .

RUN yarn

COPY . .

CMD ["yarn", "start:dev"]
