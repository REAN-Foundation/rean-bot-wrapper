FROM node:24-alpine3.20 AS builder
RUN apk add bash
RUN apk add --no-cache \
        bash \
        python3 \
        make \
        g++ \
        libc6-compat \
        vips-dev \
        pkgconfig \
        chromium \
        nss \
        freetype \
        ttf-freefont \
        ca-certificates \
        dumb-init \
        && rm -rf /var/cache/apk/*
RUN apk add --update alpine-sdk
# RUN apk add chromium \
#     harfbuzz

RUN apk update
RUN apk upgrade

ADD . /app
WORKDIR /app

COPY package.json /app/
RUN npm install -g typescript
RUN npm cache clean --force
RUN rm -rf node_modules
# RUN npm install --no-package-lock
RUN npm install
RUN npm run build

# RUN npm run build

FROM node:24-alpine3.20
RUN apk add bash
RUN apk add --no-cache \
        bash \
        vips-dev \
        chromium \
        nss \
        freetype \
        ttf-freefont \
        ca-certificates \
        dumb-init \
        libc6-compat \
        && rm -rf /var/cache/apk/*
RUN apk add --update alpine-sdk
# RUN apk add chromium \
#     harfbuzz

RUN apk update
RUN apk upgrade

ADD . /app
WORKDIR /app

COPY package.json /app/
RUN npm install --production
RUN npm install pm2 -g
RUN npm install sharp
COPY --from=builder ./app/dist/ .
COPY --from=builder /app/src/libs/  src/libs
RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/bin/bash", "-c", "/app/entrypoint.sh"]
