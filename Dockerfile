FROM node:carbon-alpine

ADD bot.js /app/
ADD top.json /app/
ADD bot_token.json /app/
ADD package.json /app/

WORKDIR /app

RUN npm i

CMD node bot.js