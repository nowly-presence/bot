import { PermissionFlagsBits, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";

const addSocialOption = (subcommand: SlashCommandSubcommandBuilder): SlashCommandSubcommandBuilder =>
  subcommand.addStringOption((option) =>
    option
      .setName("social")
      .setDescription("Social network to manage")
      .addChoices(
        { name: "X", value: "x" },
        { name: "Bluesky", value: "bluesky" },
      )
      .setRequired(true),
  );

export const slashCommand = new SlashCommandBuilder()
  .setName("social")
  .setDescription("Manage X and Bluesky posts")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addSubcommand((subcommand) =>
    addSocialOption(subcommand.setName("clear").setDescription("Force-refresh the selected feed")),
  )
  .addSubcommand((subcommand) =>
    addSocialOption(subcommand
      .setName("post")
      .setDescription("Manually publish a post from the selected account"))
      .addStringOption((option) =>
        option
          .setName("url")
          .setDescription("URL of the post to publish")
          .setRequired(true),
      ),
  )
  .addSubcommand((subcommand) =>
    addSocialOption(subcommand
      .setName("schedule")
      .setDescription("Schedule a daily forced feed refresh"))
      .addStringOption((option) =>
        option
          .setName("heure")
          .setDescription("Time to force-refresh daily, in Europe/Paris (HH:MM)")
          .setMinLength(5)
          .setMaxLength(5)
          .setRequired(true),
      ),
  );
