import { DatabaseService } from "@/services/database.service";
import { GuildGuardService } from "@/services/guild-guard.service";
import { TicketService } from "@/services/ticket.service";
import { XFeedService } from "@/services/x-feed.service";
import { WelcomeService } from "@/services/welcome.service";
import { load as loadCommands } from "@/utils/handler/command";
import { listener, register } from "@/utils/handler/command/command";
import { Event } from "@/utils/handler/event/event.type";
import { ActivityType, type Client, Events } from "discord.js";
import { sep } from "path";

const event: Event<Events.ClientReady> = {
  name: Events.ClientReady,
  once: true,
  execute: async (client: Client<true>) => {
    console.log(
      `Connected to Discord as ${client.user.tag} (${client.user.id}) with ${client.guilds.cache.size} guild(s) cached`,
    );

    await GuildGuardService.leaveUnauthorizedGuilds(client);

    try {
      DatabaseService.connect();
      WelcomeService.restorePackets();
    } catch (error) {
      console.error("Failed to open the SQLite database, welcome cards are disabled:", error);
    }

    if (DatabaseService.isConnected()) {
      XFeedService.start(client);
    }

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

    console.log(
      `Nowly is ready: ${builders.size} command(s) loaded, welcome cards ${
        DatabaseService.isConnected() ? "enabled" : "disabled"
      }`,
    );
  },
};

export default event;
