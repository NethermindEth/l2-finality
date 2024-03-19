FROM node:21.7.1-alpine
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node
ENV PORT 8080
ENV NODE_ENV production

COPY --chown=node:node frontend/package.json ./
RUN yarn install --verbose

COPY --chown=node:node frontend ./
COPY --chown=node:node shared ./src/shared
RUN npm run build --verbose && rm .env.local

EXPOSE 8080
CMD ["node", ".next/standalone/server.js"]