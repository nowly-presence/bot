import { Client } from "discord.js";
import { readdirSync } from "fs";
import { sep } from "path";
import { Event } from "./event.type";

export const loadEvents = async (client: Client, eventsFolder: string): Promise<void> => {
  const eventFiles = readdirSync(eventsFolder).filter((file) => file.endsWith(".event.ts"));

  for (const file of eventFiles) {
    const eventModule = await import(`${eventsFolder}${sep}${file}`);
    const event = eventModule.default as Event<any>;

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }

    console.log(`Event ${event.name} loaded`);
  }
};