FROM node:20.11.1-alpine
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
USER node
ENV PORT 8080

COPY --chown=node:node app/frontend .
# Some packages are hoisted
COPY --chown=node:node node_modules ./node_modules
# Docker doesn't support symlinks
COPY --chown=node:node app/shared ./src/shared

EXPOSE 8080
CMD ["node", ".next/standalone/server.js"]