import { EmbedBuilder } from "discord.js";

export const createNowlyEmbed = (title: string, description?: string, url?: string): EmbedBuilder => {
  const embed = new EmbedBuilder()
    .setColor(0x62d0ff)
    .setTitle(title)
    .setTimestamp();

  if (description) {
    embed.setDescription(description);
  }

  if (url) {
    embed.setURL(url);
  }

  return embed;
};
