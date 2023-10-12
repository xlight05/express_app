FROM --platform=linux/amd64 node:18.12.1-alpine3.17

WORKDIR /usr/src/app
COPY package*.json ./

RUN npm ci --prefer-offline --no-audit --maxsockets 1

COPY . .

ENV npm_config_cache=/usr/src/app

# RUN npx eslint src
RUN npm run build

RUN chown -R 10500:10500 "/usr/src/app"

EXPOSE 3000

CMD [ "npm", "start" ]
