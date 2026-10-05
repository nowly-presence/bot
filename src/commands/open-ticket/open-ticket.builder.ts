import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("open-ticket")
  .setDescription("Open a support ticket on behalf of a member")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("Member to open the ticket for")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("description")
      .setDescription("Optional context to include in the ticket")
      .setMaxLength(1500)
  );
