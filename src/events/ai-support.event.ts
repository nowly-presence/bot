import { getAiReply } from "@/services/ai-support.service";
import { TICKET_CATEGORY_ID } from "@/services/ticket.service";
import { createNowlyEmbed } from "@/utils/embed";
import { chunkMessage } from "@/utils/format";
import { Event } from "@/utils/handler/event/event.type";
import { ChannelType, Events } from "discord.js";

const MAX_AI_MESSAGES_PER_TICKET = 15;
const EMBED_DESCRIPTION_LIMIT = 4096;
const aiMessageCounts = new Map<string, number>();

const event: Event<Events.MessageCreate> = {
  name: Events.MessageCreate,
  execute: async (message) => {
    if (message.author.bot) {
      return;
    }

    if (message.channel.type !== ChannelType.GuildText || message.channel.parentId !== TICKET_CATEGORY_ID) {
      return;
    }

    const isMentioned = message.mentions.has(message.client.user);
    let isReplyToBot = false;

    if (!isMentioned && message.reference) {
      const referenced = await message.fetchReference().catch(() => null);
      isReplyToBot = referenced?.author.id === message.client.user.id;
    }

    if (!isMentioned && !isReplyToBot) {
      return;
    }

    const channel = message.channel;
    const count = (aiMessageCounts.get(channel.id) ?? 0) + 1;
    aiMessageCounts.set(channel.id, count);

    if (count > MAX_AI_MESSAGES_PER_TICKET) {
      if (count === MAX_AI_MESSAGES_PER_TICKET + 1) {
        await channel.send({
          embeds: [createNowlyEmbed(undefined, "AI support limit reached for this ticket. A staff member will follow up.")],
        });
      }
      return;
    }

    const recentMessages = await channel.messages.fetch({ limit: 20 });
    const history = [...recentMessages.values()]
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp)
      .filter((m) => m.content.trim().length > 0)
      .map((m) => ({
        role: m.author.bot ? ("assistant" as const) : ("user" as const),
        content: m.content,
      }));

    const statusMessage = await channel.send({ embeds: [createNowlyEmbed(undefined, "🤔 Thinking...")] });

    const reply = await getAiReply(history, async (status) => {
      await statusMessage.edit({ embeds: [createNowlyEmbed(undefined, status)] }).catch(() => {});
    });

    await statusMessage.delete().catch(() => {});

    for (const chunk of chunkMessage(reply, EMBED_DESCRIPTION_LIMIT)) {
      await channel.send({ embeds: [createNowlyEmbed(undefined, chunk)] });
    }
  },
};

export default event;
