# ------------------------------------------------------------------
# Dockerfile for MyPhysioTrainer (used for both development and production)
# ------------------------------------------------------------------
# Production: the image runs the code that is copied in below.
# Development: docker-compose.development.yml mounts ./src and ./public
# over the copied code and restarts the app with `node --watch`.

# Floating tag: always the latest Node.js 22 patch when built with --pull.
FROM node:22-slim

WORKDIR /app

# Install production dependencies only.
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy the application code.
COPY --chown=node:node src ./src
COPY --chown=node:node public ./public

# Create a log directory that the 'node' user can write to.
RUN mkdir -p /app/logs && chown node:node /app/logs

# Run as the non-root 'node' user.
USER node

EXPOSE 8080

CMD ["node", "src/server.js"]
