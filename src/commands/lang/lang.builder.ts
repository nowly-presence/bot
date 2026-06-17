import { SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("lang")
  .setDescription("Set your Nowly bot language")
  .setDescriptionLocalizations({
    fr: "Configure la langue du bot Nowly",
  })
  .addStringOption((option) =>
    option
      .setName("language")
      .setNameLocalizations({ fr: "langue" })
      .setDescription("Language")
      .setDescriptionLocalizations({ fr: "Langue" })
      .setRequired(true)
      .addChoices(
        { name: "English", value: "en" },
        { name: "Francais", value: "fr" },
      )
  )
  .addStringOption((option) =>
    option
      .setName("scope")
      .setDescription("Apply to yourself or this server")
      .setDescriptionLocalizations({ fr: "Appliquer a vous ou au serveur" })
      .setRequired(false)
      .addChoices(
        { name: "Me", value: "user" },
        { name: "Server", value: "guild" },
      )
  );
