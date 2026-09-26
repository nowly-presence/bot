import { WelcomeService } from "@/services/welcome.service";
import { Event } from "@/utils/handler/event/event.type";
import { Events } from "discord.js";

const event: Event<Events.GuildMemberRemove> = {
  name: Events.GuildMemberRemove,
  execute: async (member) => {
    if (member.user.bot) {
      return;
    }

    try {
      WelcomeService.handleMemberLeave(member);
    } catch (error) {
      console.error(`Failed to release the welcome card of ${member.user.tag}:`, error);
    }
  },
};

export default event;
