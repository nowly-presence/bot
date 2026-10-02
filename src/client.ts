// dotenv must be required before @/config/env, which validates on import.
import "dotenv/config";
import { env } from "@/config/env";
import { loadEvents } from "@/utils/handler/event/event";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import { sep } from "path";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User],
});

client.setMaxListeners(20);

console.log(
  `Starting Nowly Discord bot on node ${process.version} (database: ${env.DISCORD_DB_PATH})`,
);

client.login(env.DISCORD_BOT_TOKEN).catch((error) => {
  console.error("Discord login failed:", error);
  process.exit(1);
});

void loadEvents(client, `${__dirname}${sep}events`);
