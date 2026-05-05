FROM node:22-bookworm-slim AS base

WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages/database/package.json packages/database/package.json
RUN npm install --workspace @closr/worker --include-workspace-root

COPY apps/worker apps/worker
COPY packages packages

WORKDIR /app/apps/worker
RUN npm run build

CMD ["npm", "run", "start"]
