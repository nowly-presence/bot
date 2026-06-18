import { TicketService } from "@/services/ticket.service";
import { load as loadCommands } from "@/utils/handler/command";
import { listener, register } from "@/utils/handler/command/command";
import { Event } from "@/utils/handler/event/event.type";
import { ActivityType, type Client, Events } from "discord.js";
import { sep } from "path";

const event: Event<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute: async (client: Client<true>) => {
    const { commands, autocompletes, builders } = await loadCommands(`${__dirname}${sep}..${sep}commands`);

    listener(client, commands, autocompletes);
    await register(client, builders);

    try {
      await TicketService.ensureSupportPanel(client);
    } catch (error) {
      console.error("Failed to ensure support ticket panel:", error);
    }

    client.user.setActivity("Nowly presences", {
      type: ActivityType.Watching,
    });

    console.log("Successfully loaded Nowly Discord commands");
  },
};

export default event;