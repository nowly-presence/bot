# Nowly Discord Bot

Discord bot for Nowly presence support and discovery.

## Setup

```bash
pnpm install
cp .env.example .env
```

## Environment variables

Read once at startup by `src/config/env.ts`. Anything marked required throws at import, so the bot refuses to boot without it.

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DISCORD_BOT_TOKEN` | yes | - | Bot token. The bot cannot start without it |
| `DISCORD_APPLICATION_ID` | yes | - | Validated at startup only: the bot refuses to boot without it, but no code reads it. Any non-empty value works |
| `DISCORD_GUILD_ID` | yes | - | The only server the bot is allowed to stay in. `GuildGuardService` leaves every other guild, and the bot throws on startup if unset. Also scopes slash command registration to that guild instead of global |
| `DISCORD_DONATOR_ROLE_ID` | no | `1517677191234715829` | Role claimed with a supporter key via `/donator` |
| `DISCORD_MEMBER_ROLE_ID` | no | `1516939000605315212` | Role auto-added to new members on join |
| `DISCORD_SUPPORT_CHANNEL_ID` | no | `1516932454848401599` | Channel where the support ticket panel is posted |
| `DISCORD_TICKET_CATEGORY_ID` | no | `1516932920361750781` | Category new ticket channels are created under |
| `DISCORD_WELCOME_CHANNEL_ID` | no | none | Channel where welcome cards are posted. Welcome cards are disabled entirely when unset |
| `DISCORD_DB_PATH` | no | `./.data/discord.sqlite` | SQLite file. Set to `/data/discord.sqlite` in Docker |
| `DISCORD_AUTO_REGISTER_COMMANDS` | no | `true` | Registers slash commands on startup. Only the exact string `false` disables it |
| `NOWLY_API_BASE_URL` | no | `https://api.nowly.me` | Nowly API base URL. `.env.example` points it at `http://localhost:3001` for local dev |
| `NOWLY_APP_BASE_URL` | no | `https://nowly.me` | Nowly web base URL, used to build links in embeds. `.env.example` points it at `http://localhost:3000` for local dev |
| `OPENAI_API_KEY` | no | none | OpenAI key for the "Fix with AI" ticket assistant. The feature degrades gracefully when unset |

The three role and channel IDs default to the production Nowly server's IDs, so they only need overriding when running against a separate dev server. Defaults are defined in `src/config/env.ts`, not in `.env.example`.

## Scripts

```bash
pnpm dev
pnpm typecheck
pnpm start
```

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
    guild-member-add.event.ts       # applies DISCORD_MEMBER_ROLE_ID, grants the welcome card
    ai-support.event.ts             # AI-assisted ticket triage
    ticket-interaction.event.ts     # ticket button/menu interactions
  commands/
    donator/
    links/
    presence/
    status/
    support/
    welcome/
      <name>.builder.ts
      <name>.command.ts
  data/
    welcome-cards.ts                # the 100 welcome cards and their rarities
  services/
    database.service.ts             # node:sqlite, persists welcome pulls
    ticket.service.ts
    welcome.service.ts              # draws and posts cards
  utils/
    welcome.ts                      # rarity emojis, bag shuffle, message rendering
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
- `/welcome user:<member> [rarity:<common|rare|epic|legendary|mythic>]` - post a welcome card to a member who joined before this feature existed. Requires the Manage Roles permission (bit 28, Discord's current name for the old `MANAGE_MEMBERS`).

## Welcome cards

When a member joins, the bot draws one of 100 cards and posts it as a plain text message in `DISCORD_WELCOME_CHANNEL_ID`, prefixed with a rarity emoji. Cards are distributed like a real card game: the rarity is baked into each card, the draw is uniform, and the deck is shuffled into a "packet" that is consumed one card at a time and reshuffled when empty, so the same message never appears twice in a row. That yields an emergent 50% common / 27% rare / 15% epic / 6% legendary / 2% mythic split rather than a hardcoded weight table.

Every pull is recorded in SQLite, so a member's card is final: leaving and rejoining never re-rolls it. The `user_id` primary key enforces this in the database, not just in application code. A member who leaves and rejoins with the same account is therefore skipped.

The packet itself lives in memory and is reshuffled on restart, so a message can repeat across a restart. The "one card per member" rule is what is persisted.

Passing `rarity` to `/welcome` draws from that rarity's pool without consuming the packet, so admin-forced cards do not skew the natural distribution.

## Deployment

`Dockerfile` builds the bot for Dokploy. The build context must be the **monorepo root** (it copies the root workspace manifests and `apps/discord`), with the Dockerfile path set to `apps/discord/Dockerfile`.

State is kept in SQLite via the built-in `node:sqlite` module, so there is no native driver to install. It needs Node 22.13+ (the image uses `node:22-alpine`) and it only supports a single writer, so the bot must run as exactly one replica.

Mount a volume at `/data`; the database is written to `/data/discord.sqlite`. Docker copies the image's `/data` ownership into a fresh named volume, so the non-root `node` user can write there. For a bind mount instead, run `chown 1000:1000 <host-path>`.
