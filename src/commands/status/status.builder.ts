import { SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Show Nowly service status");