FROM node:22.23.4-alpine3.24@sha256:fe4f6d74e20370acb04ad889077d14d0f64a9c8ea6a42bc60cddf1e844699914
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