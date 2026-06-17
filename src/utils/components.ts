import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const createLinkButton = (label: string, url: string): ButtonBuilder => {
  return new ButtonBuilder()
    .setLabel(label)
    .setStyle(ButtonStyle.Link)
    .setURL(url);
};

export const createLinkRow = (
  ...buttons: ButtonBuilder[]
): ActionRowBuilder<ButtonBuilder> => {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons);
};
