# # Use the Node.js Alpine image as a base to keep the image size small
# FROM node:20-alpine

# # Set the working directory in the container
# WORKDIR /app

# # Clone the GitHub repository
# RUN apk add --no-cache git \
#     && git clone https://github.com/cvdlinden/wiim-now-playing.git . \
#     && npm install \
#     && apk del git

# # Expose the port the app runs on (default 80, but can be adjusted if necessary)
# EXPOSE 80

# # Set the default port as an environment variable (change if needed)
# ENV PORT 80

# # Start the server
# CMD ["node", "server/index.js"]

# --- Stage 1: Builder ---
FROM node:25.8-alpine3.23 AS builder

WORKDIR /app

RUN apk add --no-cache tar curl

ARG VERSION
# Clone the GitHub repository
RUN apk add --no-cache git \
    && git clone https://github.com/cvdlinden/wiim-now-playing.git . \
    && npm install \
    && apk del git

RUN npm ci --omit=dev --no-audit --no-fund

# --- Stage 2: Runner ---
FROM node:25.8-alpine3.23 AS runner

RUN apk add --no-cache tini libcap
WORKDIR /app

COPY --from=builder /app /app
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN cd /app && rm Dockerfile docker-compose.yml docker-update.sh && rm -rf docs

ARG VERSION
ENV VERSION=$VERSION

# Grant the node binary permission to bind to privileged ports
RUN setcap cap_net_bind_service=+ep /usr/local/bin/node

RUN mkdir -p /app/data
# Security: Set ownership and switch to non-root user
RUN chown -R node:node /app
USER node

EXPOSE 80
ENV PORT=80

ENTRYPOINT ["/sbin/tini", "--", "/app/docker-entrypoint.sh"]
CMD ["node", "server/index.js"]