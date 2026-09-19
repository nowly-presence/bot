import { loadEvents } from "@/utils/handler/event/event";
import { Client, GatewayIntentBits } from "discord.js";
import "dotenv/config";
import { sep } from "path";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.setMaxListeners(20);

void client.login(process.env.DISCORD_BOT_TOKEN);

void loadEvents(client, `${__dirname}${sep}events`);
