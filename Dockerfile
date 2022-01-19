FROM node:14.17-alpine
RUN apk add bash
RUN apk add --update alpine-sdk
RUN apk add chromium \
    harfbuzz
ADD . /app
WORKDIR /app

COPY package*.json /app/
RUN npm install pm2 -g
RUN npm install -g typescript
RUN npm install
RUN npm run build
RUN npm install sharp

RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/bin/bash", "-c", "/app/entrypoint.sh"]
