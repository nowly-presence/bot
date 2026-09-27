import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("x")
  .setDescription("Manage the tracked X account feed")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addSubcommand((subcommand) =>
    subcommand
      .setName("clear")
      .setDescription("Force-refresh the feed cache and publish new posts"),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("post")
      .setDescription("Manually publish a post from the tracked account")
      .addStringOption((option) =>
        option
          .setName("url")
          .setDescription("URL of the X post to publish")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    subcommand
      .setName("schedule")
      .setDescription("Schedule a daily forced feed refresh")
      .addStringOption((option) =>
        option
          .setName("heure")
          .setDescription("Time to force-refresh daily, in Europe/Paris (HH:MM)")
          .setMinLength(5)
          .setMaxLength(5)
          .setRequired(true),
      ),
  );
