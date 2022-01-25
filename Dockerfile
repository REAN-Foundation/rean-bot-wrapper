FROM node:16.13.2-alpine3.15
RUN apk add bash
RUN apk add --no-cache \
        python3 \
    && rm -rf /var/cache/apk/*
RUN apk add --update alpine-sdk
RUN apk add chromium \
    harfbuzz

RUN apk update
RUN apk upgrade

ADD . /app
WORKDIR /app

COPY package*.json /app/
RUN npm install pm2 -g
RUN npm install -g typescript
RUN npm install
RUN npm run build
RUN npm install sharp
COPY src/libs/ /app/dist/src/libs/
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/bin/bash", "-c", "/app/entrypoint.sh"]
