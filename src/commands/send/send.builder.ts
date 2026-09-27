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
  )
  .addAttachmentOption((option) =>
    option.setName("attachment").setDescription("Optional file to attach to the message or embed")
  )
  .addStringOption((option) =>
    option
      .setName("color")
      .setDescription("Optional embed color in hex format, for example #62D0FF")
      .setMinLength(6)
      .setMaxLength(7)
  )
  .addBooleanOption((option) =>
    option.setName("embed").setDescription("Send the message as an embed")
  );
