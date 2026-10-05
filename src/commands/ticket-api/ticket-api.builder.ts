import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("ticket-api")
  .setDescription("Show the authenticated transcript endpoint for this ticket")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);
