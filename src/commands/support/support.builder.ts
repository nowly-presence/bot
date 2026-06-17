import { SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("support")
  .setDescription("Get help with Nowly")
  .setDescriptionLocalizations({
    fr: "Obtenir de l'aide avec Nowly",
  });
