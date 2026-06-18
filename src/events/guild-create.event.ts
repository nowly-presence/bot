import { GuildGuardService } from "@/services/guild-guard.service";
import { Event } from "@/utils/handler/event/event.type";
import { Events } from "discord.js";

const event: Event<Events.GuildCreate> = {
  name: Events.GuildCreate,
  execute: async (guild) => {
    try {
      await GuildGuardService.leaveIfUnauthorized(guild);
    } catch (error) {
      console.error(`Failed to leave unauthorized guild ${guild.name} (${guild.id}):`, error);
    }
  },
};

export default event;