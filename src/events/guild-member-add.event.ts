import { env } from "@/config/env";
import { WelcomeService } from "@/services/welcome.service";
import { Event } from "@/utils/handler/event/event.type";
import { Events } from "discord.js";

const event: Event<Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  execute: async (member) => {
    if (member.user.bot) {
      return;
    }

    await WelcomeService.grantWelcomeCard(member, "join");

    if (!env.DISCORD_MEMBER_ROLE_ID) {
      return;
    }

    try {
      const role = await member.guild.roles.fetch(env.DISCORD_MEMBER_ROLE_ID);

      if (!role) {
        console.error(`Member role ${env.DISCORD_MEMBER_ROLE_ID} was not found`);
        return;
      }

      await member.roles.add(role, "Auto role on server join");
    } catch (error) {
      console.error(`Failed to add member role to ${member.user.tag}:`, error);
    }
  },
};

export default event;
