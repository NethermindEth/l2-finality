FROM node:20.11.1-alpine
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node
ENV PORT 8080

COPY --chown=node:node frontend/package.json ./
RUN yarn install

COPY --chown=node:node frontend ./
COPY --chown=node:node shared ./src/shared
RUN npm run build && rm .env.local

EXPOSE 8080
CMD ["node", ".next/standalone/server.js"]