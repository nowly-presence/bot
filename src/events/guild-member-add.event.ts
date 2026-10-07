import { env } from "@/config/env";
import { welcomePacks } from "@/data/welcome-cards";
import { renderWelcomeMessage } from "@/utils/welcome";
import { WelcomeService } from "@/services/welcome.service";
import { Event } from "@/utils/handler/event/event.type";
import { Events } from "discord.js";

const event: Event<Events.GuildMemberAdd> = {
  name: Events.GuildMemberAdd,
  execute: async (member) => {
    if (member.user.bot) {
      return;
    }

    try {
      if (!env.DISCORD_WELCOME_CHANNEL_ID) {
        throw new Error("DISCORD_WELCOME_CHANNEL_ID is missing");
      }

      const channel = await member.guild.channels.fetch(env.DISCORD_WELCOME_CHANNEL_ID);
      if (!channel?.isSendable()) {
        throw new Error(`Welcome channel ${env.DISCORD_WELCOME_CHANNEL_ID} is not sendable`);
      }

      const messages = welcomePacks[0].cards;
      const card = messages[Math.floor(Math.random() * messages.length)];
      await channel.send(renderWelcomeMessage(card.message, member.id));
    } catch (error) {
      console.error(`Failed to send welcome message to ${member.user.tag}:`, error);
    }

    try {
      await WelcomeService.grantWelcomeCard(member, "join", undefined, undefined, false);
    } catch (error) {
      console.error(`Failed to assign welcome card to ${member.user.tag}:`, error);
    }
  },
};

export default event;
