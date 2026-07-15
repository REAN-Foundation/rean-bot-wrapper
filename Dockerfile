FROM node:24-alpine3.22 AS builder

RUN apk update && apk upgrade && \
    apk add --no-cache \
        bash \
        python3 \
        chromium \
        harfbuzz \
        libsodium \
        alpine-sdk \
        openssl \
        libxml2

ADD . /app
WORKDIR /app

COPY package*.json /app/
# RUN npm install -g typescript
RUN npm cache clean --force
RUN rm -rf node_modules
# RUN npm install --no-package-lock
RUN npm ci
RUN npm run build

# RUN npm run build

FROM node:24-alpine3.22

RUN apk add --no-cache \
    bash \
    python3 \
    py3-pip \
    chromium \
    harfbuzz \
    libsodium \
    && pip3 install --break-system-packages awscli \
    && rm -rf /var/cache/apk/*

RUN apk update
RUN apk upgrade

ADD . /app
WORKDIR /app

COPY package*.json /app/
RUN npm install --production
RUN npm install pm2 -g
RUN npm install sharp
COPY --from=builder ./app/dist/ .
COPY --from=builder /app/src/libs/  src/libs
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/bin/bash", "-c", "/app/entrypoint.sh"]
# CMD ["node", "src/index.js"]
