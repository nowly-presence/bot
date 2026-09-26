import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("send")
  .setDescription("Send a message as the bot in a chosen channel")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addChannelOption((option) =>
    option
      .setName("channel")
      .setDescription("Channel to send the message in")
      .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
      .setRequired(true)
  );
