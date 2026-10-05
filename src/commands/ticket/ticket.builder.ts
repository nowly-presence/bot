import { ChannelType, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("Manage support tickets")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("open")
      .setDescription("Open a support ticket on behalf of a member")
      .addUserOption((option) =>
        option
          .setName("user")
          .setDescription("Member to open the ticket for")
          .setRequired(true),
      )
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("Optional context to include in the ticket")
          .setMaxLength(1500),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("stats")
      .setDescription("Show ticket ratings and resolution-time statistics"),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("api")
      .setDescription("Show the authenticated transcript endpoint for this ticket"),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("delete")
      .setDescription("Remove a ticket and its stored data")
      .addChannelOption((option) =>
        option
          .setName("channel")
          .setDescription("Ticket channel to remove")
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(true),
      )
      .addBooleanOption((option) =>
        option
          .setName("keep")
          .setDescription("Keep and archive the channel instead of deleting it (defaults to false)")
          .setRequired(false),
      ),
  );
