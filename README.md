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
pnpm typecheck
pnpm start
```

`DISCORD_AUTO_REGISTER_COMMANDS=true` registers guild commands on startup.

## Structure

This bot follows the same file loading pattern as `bot-discord-planning-uha`:

```text
src/
  client.ts
  events/
    ready.event.ts
  commands/
    presence/
      presence.builder.ts
      presence.command.ts
    status/
      status.builder.ts
      status.command.ts
    support/
      support.builder.ts
      support.command.ts
    links/
      links.builder.ts
      links.command.ts
    lang/
      lang.builder.ts
      lang.command.ts
  utils/
    handler/
      command/
      event/
```

Commands are discovered by folder convention: each `commands/<name>` folder must contain `<name>.builder.ts` and `<name>.command.ts`.

## Commands

- `/presence query:<name-or-slug>`
- `/status`
- `/support`
- `/links`
- `/lang language:<en|fr> [scope:<me|server>]`

Language choices are stored in `.data/locales.json`, ignored by Git.
