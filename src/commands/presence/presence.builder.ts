import { SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("presence")
  .setDescription("Show details about a Nowly presence")
  .addStringOption((option) =>
    option
      .setName("query")
      .setDescription("Presence name or slug")
      .setRequired(true)
      .setAutocomplete(true)
  );