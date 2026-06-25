import { SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("donator")
  .setDescription("Claim the Nowly donor role with your supporter key")
  .addStringOption((option) =>
    option
      .setName("key")
      .setDescription("Your NOWLY-XXXX-XXXX-XXXX supporter key received by email")
      .setRequired(true),
  );
