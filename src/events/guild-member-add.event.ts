import { Event } from "@/utils/handler/event/event.type";
import { Events } from "discord.js";

const MEMBER_ROLE_ID = "1516939000605315212";

const event: Event<Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  execute: async (member) => {
    try {
      const role = await member.guild.roles.fetch(MEMBER_ROLE_ID);

      if (!role) {
        console.error(`Member role ${MEMBER_ROLE_ID} was not found`);
        return;
      }

      await member.roles.add(role, "Auto role on server join");
    } catch (error) {
      console.error(`Failed to add member role to ${member.user.tag}:`, error);
    }
  },
};

export default event;
