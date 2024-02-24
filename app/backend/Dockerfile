FROM node:20.11.1
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node

COPY --chown=node:node package.json ./
RUN npm install

COPY --chown=node:node tsconfig.json ./
COPY --chown=node:node src ./src
RUN npm run build

EXPOSE 8080
CMD [ "node", "./dist/index.js" ]