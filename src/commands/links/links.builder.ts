import { SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("links")
  .setDescription("Show useful Nowly links")
  .setDescriptionLocalizations({
    fr: "Affiche les liens utiles de Nowly",
  });
