import { SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("presence")
  .setDescription("Show details about a Nowly presence")
  .setDescriptionLocalizations({
    fr: "Affiche les details d'une presence Nowly",
  })
  .addStringOption((option) =>
    option
      .setName("query")
      .setNameLocalizations({ fr: "recherche" })
      .setDescription("Presence name or slug")
      .setDescriptionLocalizations({ fr: "Nom ou identifiant de la presence" })
      .setRequired(true)
      .setAutocomplete(true)
  );
