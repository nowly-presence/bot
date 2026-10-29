import { Event } from "@/utils/handler/event/event.type";
import { SUGGESTIONS_CHANNEL_ID } from "@/utils/suggestion-tags";
import { ChannelType, Events } from "discord.js";

const statusEmojis = new Map([
  ["in consideration", "<:consideration:1565363843381596322>"],
  ["approved", "<:approved:1565363841376723074>"],
  ["rejected (for now)", "<:rejected:1565363845541920940>"],
]);

const event: Event<Events.ThreadUpdate> = {
  name: Events.ThreadUpdate,
  execute: async (previous, thread) => {
    if (thread.parentId !== SUGGESTIONS_CHANNEL_ID) return;
    if (previous.appliedTags.length === thread.appliedTags.length
      && previous.appliedTags.every((id) => thread.appliedTags.includes(id))) return;

    try {
      const forum = await thread.guild.channels.fetch(SUGGESTIONS_CHANNEL_ID);

      if (forum?.type !== ChannelType.GuildForum) return;

      const tags = thread.appliedTags.map((id) => {
        const tag = forum.availableTags.find((available) => available.id === id);

        if (!tag) return null;

        const emoji = statusEmojis.get(tag.name.toLowerCase())
          ?? (tag.emoji?.id
            ? `<:${tag.emoji.name ?? "tag"}:${tag.emoji.id}>`
            : tag.emoji?.name);

        return `${emoji ? `${emoji} ` : ""}**${tag.name}**`;
      }).filter((tag) => tag !== null);

      await thread.send({
        content: tags.length
          ? `This post is now tagged as ${tags.join(", ")}.`
          : "All tags have been removed from this post.",
        allowedMentions: { parse: [] },
      });
    } catch (error) {
      console.error("Failed to announce suggestion tag changes:", error);
    }
  },
};

export default event;
