FROM node:22-alpine

# node:sqlite is unflagged since Node 22.13, so the bot needs no native driver.
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

WORKDIR /app

# Manifests only, so the dependency layer survives source-only changes.
# pnpm-workspace.yaml carries the allowBuilds entry required by @swc/core.
COPY package.json pnpm-workspace.yaml .npmrc ./
COPY apps/discord/package.json apps/discord/package.json

RUN pnpm install --filter @nowly/discord --prod --no-frozen-lockfile

COPY apps/discord ./apps/discord

WORKDIR /app/apps/discord

ENV NODE_ENV=production \
    DISCORD_DB_PATH=/data/discord.sqlite

# The SQLite file lives on a mounted volume. Docker copies this directory's
# ownership into a fresh named volume, so the node user can write there. A bind
# mount instead needs `chown 1000:1000 /mounted/path` on the host.
RUN mkdir -p /data && chown -R node:node /data /app/apps/discord

VOLUME /data

USER node

CMD ["node", "-r", "@swc-node/register", "-r", "tsconfig-paths/register", "./src/client.ts"]
