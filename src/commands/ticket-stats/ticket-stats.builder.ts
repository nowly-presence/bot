import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("ticket-stats")
  .setDescription("Show support ticket satisfaction ratings")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);
