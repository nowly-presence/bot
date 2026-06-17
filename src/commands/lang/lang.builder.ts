import { SlashCommandBuilder } from "discord.js";
import { discordLocalizations, t } from "@/utils/i18n";

export const slashCommand = new SlashCommandBuilder()
  .setName("lang")
  .setDescription(t("en", "commands.lang.description"))
  .setDescriptionLocalizations(discordLocalizations("commands.lang.description"))
  .addStringOption((option) =>
    option
      .setName("language")
      .setNameLocalizations(discordLocalizations("commands.lang.options.language.name"))
      .setDescription(t("en", "commands.lang.options.language.description"))
      .setDescriptionLocalizations(discordLocalizations("commands.lang.options.language.description"))
      .setRequired(true)
      .addChoices(
        {
          name: t("en", "commands.lang.choices.english"),
          name_localizations: discordLocalizations("commands.lang.choices.english"),
          value: "en",
        },
        {
          name: t("en", "commands.lang.choices.french"),
          name_localizations: discordLocalizations("commands.lang.choices.french"),
          value: "fr",
        },
        {
          name: t("en", "commands.lang.choices.spanish"),
          name_localizations: discordLocalizations("commands.lang.choices.spanish"),
          value: "es",
        },
      )
  )
  .addStringOption((option) =>
    option
      .setName("scope")
      .setNameLocalizations(discordLocalizations("commands.lang.options.scope.name"))
      .setDescription(t("en", "commands.lang.options.scope.description"))
      .setDescriptionLocalizations(discordLocalizations("commands.lang.options.scope.description"))
      .setRequired(false)
      .addChoices(
        {
          name: t("en", "commands.lang.choices.me"),
          name_localizations: discordLocalizations("commands.lang.choices.me"),
          value: "user",
        },
        {
          name: t("en", "commands.lang.choices.server"),
          name_localizations: discordLocalizations("commands.lang.choices.server"),
          value: "guild",
        },
      )
  );
