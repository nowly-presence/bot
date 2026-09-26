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
- `/welcome user:<member> [rarity:<common|rare|epic|legendary|mythic|celestial>] [joined:<3d|2025-06-15>]` - post a welcome card to a member who joined before this feature existed. Requires the Manage Roles permission (bit 28, Discord's current name for the old `MANAGE_MEMBERS`).
- `/send channel:<channel>` - write a message as the bot through a modal. Same permission as `/welcome`.
- `/card` - show your own welcome card as an embed, coloured by rarity, with the card the next natural draw will hand out as a teaser.

## Greetings

The bot reacts with the server's wave emoji to bare greetings, so "hey everyone" gets a 👋 back while "hey, can you look at this" is left alone. Detection is word based (`src/utils/greetings.ts`) and covers the usual English, French, Spanish, Portuguese, Italian, German, Dutch, Russian, Japanese, Korean, Chinese and Arabic greetings, plus times of day and addressed groups next to them ("good morning everyone", "salut tout le monde").

## Welcome cards

When a member joins, the bot draws one of 103 cards and posts it as a plain text message in `DISCORD_WELCOME_CHANNEL_ID`, prefixed with a rarity emoji. Cards are distributed like a real card game: the rarity is baked into each card, the draw is uniform, and the deck is shuffled into a "packet" that is consumed one card at a time and reshuffled when empty, so the same message never appears twice in a row. That yields an emergent 50% common / 27% rare / 15% epic / 6% legendary / 2% mythic split rather than a hardcoded weight table.

Celestial is the exception: 0.1% is below what a packet can express (a single celestial card in a hundred is a whole percent), so the three celestial cards are kept out of the main packet and drawn from their own packet on a per-draw roll (`celestialDrawRate` in `src/utils/welcome.ts`). That second packet is consumed like the first one, so a celestial message cannot come up again before all three have been pulled, roughly 3000 arrivals. A celestial hit does not consume a main packet card, so the split above stays intact.

Every pull is recorded in SQLite, so a member's card is final: leaving and rejoining never re-rolls it. The `user_id` primary key enforces this in the database, not just in application code.

Leaving does give the card back, though. On `guildMemberRemove` the pull moves to `welcome_vacated_pulls` and the card is spliced back into the packet it came from, so the draw pool is whole again. On rejoin the bot looks for that card: if it is still in a packet, the member gets it back (silently, a natural rejoin posts no message) and nobody else can draw it. If somebody already drew it in the meantime, the member is out, no re-roll. `/welcome` reports both cases and posts the card when the admin is the one asking.

Both packets are persisted too: `welcome_packets` stores the card ids that are still in each packet, rewritten after every natural draw and reloaded on startup, so a restart or a redeploy resumes the exact same packets. A failed write is logged and the draw still goes through with the in-memory packet. This is the one piece of state that requires the single replica: two bots sharing the file would consume the same packets.

Passing `rarity` to `/welcome` draws from that rarity's pool without consuming the packet, so admin-forced cards do not skew the natural distribution.

When the member has been in the server for more than an hour at that point, the message ends with `(joined <t:...:R>)`, built from `member.joinedAt`, so it reads as "joined 3 days ago" and hovering shows the exact date. That covers every card given through `/welcome` and keeps real arrivals clean.

`joined` overrides it, for members whose real join date is wrong (a leave and rejoin resets it). It takes either a delay (`3d`, `12h`, `2h30m`, `1w`) or an exact date (`2025-06-15`, `15/06/2025`), pinned to midday UTC. An unreadable value or a date in the future is rejected with an error, and the time of day cannot be set.

`/card` reads the pull back and renders it as an embed, so the collection is usable outside the welcome channel: the card message, the join date when the member has been here for more than an hour, when it was drawn, and how many cards of each rarity the server has drawn so far, with the member's own rarity in bold. It shows how rare the card actually is, which is more useful than spoiling the next draw.

## Deployment

`Dockerfile` builds the bot for Dokploy. This repository is a standalone package, so the build context is the **repository root** (where `package.json` lives) with the Dockerfile path set to `Dockerfile`. The bot is not built from the `nowly` monorepo.

State is kept in SQLite via the built-in `node:sqlite` module, so there is no native driver to install. It needs Node 22.13+ (the image uses `node:22-alpine`) and it only supports a single writer, so the bot must run as exactly one replica.

`typescript` is a runtime dependency because `@swc-node/register` requires it to hook `require`, so a `--prod` install is enough to boot the container.

Mount a volume at `/data`; the database is written to `/data/discord.sqlite`. Docker copies the image's `/data` ownership into a fresh named volume, so the non-root `node` user can write there. For a bind mount instead, run `chown 1000:1000 <host-path>`.

On startup the bot logs the node version and database path, the identity it connected as, the SQLite integrity check result, and a final ready line with the command count. A failed login is logged and exits with code 1; an unusable database is logged and only disables welcome cards.
