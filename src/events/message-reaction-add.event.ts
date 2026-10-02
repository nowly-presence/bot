import { VerifyService } from "@/services/verify.service";
import { Event } from "@/utils/handler/event/event.type";
import { Events } from "discord.js";

const event: Event<Events.MessageReactionAdd> = {
  name: Events.MessageReactionAdd,
  execute: async (reaction, user) => {
    if (user.bot) return;
    const message = reaction.message.partial ? await reaction.message.fetch() : reaction.message;
    if (!VerifyService.isConfiguredMessage(message)) return;
    if (reaction.emoji.id !== "1516936626926784664") return;
    await VerifyService.syncMember(message, user.id, true);
  },
};

export default event;
