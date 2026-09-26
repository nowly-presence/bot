import { isGreeting } from "@/utils/greetings";
import { Event } from "@/utils/handler/event/event.type";
import { Events } from "discord.js";

const waveEmoji = "nolo_wave:1516955354276167752";

const event: Event<Events.MessageCreate> = {
  name: Events.MessageCreate,
  execute: async (message) => {
    if (!message.inGuild() || message.author.bot || !message.content.trim()) {
      return;
    }

    if (!isGreeting(message.content)) {
      return;
    }

    try {
      await message.react(waveEmoji);
    } catch (error) {
      console.error(`Failed to wave at ${message.author.tag} in ${message.guild.name}:`, error);
    }
  },
};

export default event;
