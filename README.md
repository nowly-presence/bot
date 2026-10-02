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
| `DISCORD_MEMBER_ROLE_ID` | no | `1516939000605315212` | Role granted while a member has the verification reaction |
| `DISCORD_VERIFY_MESSAGE_ID` | no | none | ID du message de vérification dans le salon `1555552153542725742`; la réaction ✅ attribue ou retire le rôle membre |
| `DISCORD_TICKET_CATEGORY_ID` | no | `1516932920361750781` | Category new ticket channels are created under |
| `DISCORD_WELCOME_CHANNEL_ID` | no | none | Channel where welcome cards are posted. Welcome cards are disabled entirely when unset |
| `DISCORD_X_FEED_CHANNEL_ID` | no | `1553582467234136114` | Channel where new X posts are published |
| `DISCORD_BLUESKY_FEED_CHANNEL_ID` | no | none | Optional channel where new Bluesky posts are published |
| `SOCIAL_FEED_URL` | no | none | Private combined XML RSS URL containing `usernames=...` for X and optionally `bluesky=...` for Bluesky; polled every 15 seconds |
| `X_RSS_POLL_URL` | no | none | Private cache-refresh endpoint used by `/social clear` and configured daily schedules |
| `X_RSS_POLL_TOKEN` | no | none | Secret sent in the `X-RSS-Poll-Token` header; set it in the runtime environment, not in source control |
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
    social/
      social.builder.ts
      [sub-commands]/
        clear.command.ts
        post.command.ts
        schedule.command.ts
  data/
    welcome-cards.ts                # the 100 welcome cards and their rarities
  services/
    database.service.ts             # node:sqlite, persists welcome pulls
    ticket.service.ts
    welcome.service.ts              # draws and posts cards
    social-feed.service.ts          # polls X/Bluesky feeds and handles scheduled cache refreshes
  utils/
    welcome.ts                      # pack bags, sequential draw, message rendering
    handler/
      command/
      event/
```

Commands are discovered by folder convention: each `commands/<name>` folder has a `<name>.builder.ts`; standalone commands also have a `<name>.command.ts`, while commands with subcommands put their handlers in `[sub-commands]/`.

On the first successful poll for each configured social network, existing posts are recorded as seen without being sent. Later polls only publish unseen posts. Manually published posts are also recorded to prevent automatic duplicates. Published messages receive the server's like and repost reactions.

## Commands

- `/presence query:<name-or-slug>` - look up a presence by name or slug
- `/status` - Nowly service status
- `/support` - open a support ticket
- `/links` - useful project links
- `/donator key:<NOWLY-XXXX-XXXX-XXXX>` - claim the Nowly donor role with a supporter key received by email
- `/welcome user:<member> [rarity:<common|rare|epic|legendary|mythic|celestial>] [joined:<3d|2025-06-15>]` - post a welcome card to a member who joined before this feature existed. Requires the Manage Roles permission (bit 28, Discord's current name for the old `MANAGE_MEMBERS`).
- `/send channel:<channel> [attachment:<file>] [color:<hex>] [embed:<true|false>]` - write a message as the bot through a modal, optionally attach a file, set an embed color, or send an embed. Embed mode adds an optional title input and displays an attached image inside the embed. Same permission as `/welcome`.
- `/social clear social:<x|bluesky>` - force-refresh the selected feed and publish any new posts. Requires Manage Roles and `X_RSS_POLL_TOKEN`.
- `/social post social:<x|bluesky> url:<url>` - manually publish a post from the selected account. It is recorded to prevent automatic duplicates. Requires Manage Roles.
- `/social schedule social:<x|bluesky> heure:<HH:MM>` - schedule a daily forced feed refresh at the selected Europe/Paris time. Requires Manage Roles. Schedules are stored in SQLite per network.
- `/card` - show your own welcome card as an embed, with the pack and rarity it came from.

## Greetings

The bot reacts with the server's wave emoji to bare greetings, so "hey everyone" gets a 👋 back while "hey, can you look at this" is left alone. Detection is word based (`src/utils/greetings.ts`) and covers the usual English, French, Spanish, Portuguese, Italian, German, Dutch, Russian, Japanese, Korean, Chinese and Arabic greetings, plus times of day and addressed groups next to them ("good morning everyone", "salut tout le monde").

## Welcome cards

When a member joins, the bot draws a card and posts it as a plain text message in `DISCORD_WELCOME_CHANNEL_ID`, prefixed with the rarity emoji of the pack it came from.

Cards live in **packs**, and a pack is just a message plus the rarity it was given in. The 103 texts are written once in `src/data/welcome-cards.ts` and every pack reuses them, so a new pack costs a distribution and a name, not another hundred messages. A card is therefore identified by its pack *and* its text, which is what lets two packs share a message without ever handing out the same card twice.

| Pack | Cards | Rarities | Artwork |
| --- | --- | --- | --- |
| Genesis | 103 | 50 common / 27 rare / 15 epic / 6 legendary / 2 mythic / 3 celestial | Nowly logo |
| Nova | 100 | 50 common / 27 rare / 15 epic / 6 legendary / 2 mythic | star |

Packs are dealt **in order**: the first one still holding a card is the active pack, and the next one takes over by itself the moment the previous one has been dealt out entirely. Genesis is therefore the first 103 arrivals, then Nova picks up the following 100. Adding a third pack is one more entry in the `welcomePacks` array, nothing else.

Nova keeps the exact same odds as Genesis but shifts the distribution by half a pack, so the texts that were common become rare and the top tiers land on texts Genesis never gave them. No text keeps the same rarity in both packs, which is what makes a Nova card feel like its own thing rather than a reskin.

There is no reshuffling: once a pack is empty it stays empty, and when every pack is empty the bot reports that no cards are left instead of recycling old ones.

Every pull is recorded in SQLite, so a member's card is final: leaving and rejoining never re-rolls it. The `user_id` primary key enforces this in the database, not just in application code. The row keeps the `pack` alongside the card id, so a card stays attached to the edition it was drawn from.

Cards already handed out before the packs existed are Genesis cards, and the migration says so: `welcome_pulls` and `welcome_vacated_pulls` gain a `pack` column defaulting to `genesis`, and the old `main` and `celestial` packets are merged into a single `genesis` packet. Nothing is reset, so a card that was already drawn is never dealt a second time.

Leaving does give the card back, though. On `guildMemberRemove` the pull moves to `welcome_vacated_pulls` and the card goes back into its pack, so the draw pool is whole again. On rejoin the bot takes that card back out of the pack: if it is still there, the member gets it (silently, a natural rejoin posts no message) and nobody else can draw it. If somebody already drew it in the meantime, the member is out, no re-roll. `/welcome` reports both cases and posts the card when the admin is the one asking.

Each pack is persisted too: `welcome_packets` stores the card ids that are still in each pack, rewritten after every draw and reloaded on startup, so a restart or a redeploy resumes the exact same packs. A failed write is logged and the draw still goes through with the in-memory pack. This is the one piece of state that requires the single replica: two bots sharing the file would consume the same packs.

Passing `rarity` to `/welcome` takes a card of that rarity out of the active pack, so admin-forced cards stay unique and never get handed to somebody else later.

When the member has been in the server for more than an hour at that point, the message ends with `(joined <t:...:R>)`, built from `member.joinedAt`, so it reads as "joined 3 days ago" and hovering shows the exact date. That covers every card given through `/welcome` and keeps real arrivals clean.

`joined` overrides it, for members whose real join date is wrong (a leave and rejoin resets it). It takes either a delay (`3d`, `12h`, `2h30m`, `1w`) or an exact date (`2025-06-15`, `15/06/2025`), pinned to midday UTC. An unreadable value or a date in the future is rejected with an error, and the time of day cannot be set.

`/card` reads the pull back and renders it as an embed: the pack and rarity in the title, the card message and the join date when the member has been here for more than an hour, the `cards/<pack>/embed_<rarity>.png` art from the CDN as the thumbnail, and the rarity colour (common `#B0B0B0`, rare `#22D3EE`, epic `#A87EF5`, legendary `#FEDB44`, mythic `#F22633`, celestial `#E4F2FF`).

## Deployment

`Dockerfile` builds the bot for Dokploy. This repository is a standalone package, so the build context is the **repository root** (where `package.json` lives) with the Dockerfile path set to `Dockerfile`. The bot is not built from the `nowly` monorepo.

State is kept in SQLite via the built-in `node:sqlite` module, so there is no native driver to install. It needs Node 22.13+ (the image uses `node:22-alpine`) and it only supports a single writer, so the bot must run as exactly one replica.

`typescript` is a runtime dependency because `@swc-node/register` requires it to hook `require`, so a `--prod` install is enough to boot the container.

Mount a volume at `/data`; the database is written to `/data/discord.sqlite`. Docker copies the image's `/data` ownership into a fresh named volume, so the non-root `node` user can write there. For a bind mount instead, run `chown 1000:1000 <host-path>`.

On startup the bot logs the node version and database path, the identity it connected as, the SQLite integrity check result, and a final ready line with the command count. A failed login is logged and exits with code 1; an unusable database is logged and only disables welcome cards.
