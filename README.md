# Nowly Discord Bot

Discord bot for Nowly presence support and discovery.

## Setup

```bash
pnpm install
cp .env.example .env
```

Fill `DISCORD_BOT_TOKEN` with a Discord bot token.

## Scripts

```bash
pnpm dev
pnpm register
pnpm typecheck
pnpm start
```

`DISCORD_AUTO_REGISTER_COMMANDS=true` registers guild commands on startup.
