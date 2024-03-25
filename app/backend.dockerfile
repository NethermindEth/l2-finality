FROM node:20.11.1-alpine
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node

COPY --chown=node:node backend/package.json ./
RUN npm install

COPY --chown=node:node backend/tsconfig.json ./
COPY --chown=node:node backend/src ./src
COPY --chown=node:node shared ./src/shared
RUN npm run build

EXPOSE 8080
CMD [ "node", "./dist/index.js" ]