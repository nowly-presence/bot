# Nowly Discord Bot

Discord bot for Nowly presence support and discovery.

## Setup

```bash
pnpm install
cp .env.example .env
```

See `.env.example` for the full list of variables. Required: `DISCORD_BOT_TOKEN`. `DISCORD_APPLICATION_ID` and `DISCORD_GUILD_ID` are needed to register guild slash commands during local dev. `DISCORD_MEMBER_ROLE_ID`, `DISCORD_SUPPORT_CHANNEL_ID`, and `DISCORD_TICKET_CATEGORY_ID` default to the production Nowly server's IDs and only need overriding for a separate dev server. `OPENAI_API_KEY` is optional - the "Fix with AI" ticket assistant degrades gracefully without it.

## Scripts

```bash
pnpm dev
pnpm typecheck
pnpm start
```

`DISCORD_AUTO_REGISTER_COMMANDS=true` registers guild commands on startup.

## Structure

```text
src/
  client.ts
  config/
    env.ts
  events/
    ready.event.ts
    error.event.ts
    guild-create.event.ts
    guild-member-add.event.ts       # applies DISCORD_MEMBER_ROLE_ID to new members
    ai-support.event.ts             # AI-assisted ticket triage
    ticket-interaction.event.ts     # ticket button/menu interactions
  commands/
    donator/
    links/
    presence/
    status/
    support/
      <name>.builder.ts
      <name>.command.ts
  services/
    ticket.service.ts
  utils/
    handler/
      command/
      event/
```

Commands are discovered by folder convention: each `commands/<name>` folder must contain `<name>.builder.ts` and `<name>.command.ts`.

## Commands

- `/presence query:<name-or-slug>` - look up a presence by name or slug
- `/status` - Nowly service status
- `/support` - open a support ticket
- `/links` - useful project links
- `/donator key:<NOWLY-XXXX-XXXX-XXXX>` - claim the Nowly donor role with a supporter key received by email
