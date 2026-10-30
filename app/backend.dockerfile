FROM node:22.23.4-alpine3.24@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914
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