FROM node:22-alpine

# node:sqlite is unflagged since Node 22.13, so the bot needs no native driver.
RUN corepack enable && corepack prepare pnpm@11.25.0 --activate

WORKDIR /app

# This repository is the `bot` repo, so the build context is the package root
# (there is no monorepo workspace here). pnpm 11 gates dependency build scripts
# and only reads `allowBuilds` from a pnpm-workspace.yaml, which this repo does
# not ship, so it is written inside the image to let @swc/core's postinstall
# pick the alpine/musl native binding.
COPY package.json ./
RUN printf "allowBuilds:\n  '@swc/core': true\n" > pnpm-workspace.yaml \
  && pnpm install --prod --no-frozen-lockfile

COPY . .

ENV NODE_ENV=production \
    DISCORD_DB_PATH=/data/discord.sqlite

# The SQLite file lives on a mounted volume. Docker copies this directory's
# ownership into a fresh named volume, so the node user can write there. A bind
# mount instead needs `chown 1000:1000 /mounted/path` on the host.
RUN mkdir -p /data && chown -R node:node /data

VOLUME /data

EXPOSE 8787

USER node

CMD ["node", "-r", "@swc-node/register", "-r", "tsconfig-paths/register", "./src/client.ts"]
