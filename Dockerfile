FROM node:22

WORKDIR /usr/src/app

COPY package*.json ./
COPY tsconfig.json ./
RUN npm install
COPY /src ./src

RUN npm run build

EXPOSE 9999

CMD ["npm", "start"]