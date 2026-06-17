import "dotenv/config";

import { Client, GatewayIntentBits } from "discord.js";
import { sep } from "path";
import { loadEvents } from "@/utils/handler/event/event";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

client.setMaxListeners(20);

void client.login(process.env.DISCORD_BOT_TOKEN);

void loadEvents(client, `${__dirname}${sep}events`);
