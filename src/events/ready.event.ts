import { type Client, Events, ActivityType } from "discord.js";
import { sep } from "path";
import { Event } from "@/utils/handler/event/event.type";
import { load as loadCommands } from "@/utils/handler/command";
import { listener, register } from "@/utils/handler/command/command";

const event: Event<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute: async (client: Client<true>) => {
    const { commands, autocompletes, builders } = await loadCommands(`${__dirname}${sep}..${sep}commands`);

    listener(client, commands, autocompletes);
    await register(client, builders);

    client.user.setActivity("Nowly presences", {
      type: ActivityType.Watching,
    });

    console.log("Successfully loaded Nowly Discord commands");
  },
};

export default event;
