import { SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("card")
  .setDescription("Show your welcome card")
  .setDefaultMemberPermissions(null);
