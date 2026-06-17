import { discordLocalizations, t } from "@/utils/i18n";
import { SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("presence")
  .setDescription(t("en", "commands.presence.description"))
  .setDescriptionLocalizations(discordLocalizations("commands.presence.description"))
  .addStringOption((option) =>
    option
      .setName("query")
      .setNameLocalizations(discordLocalizations("commands.presence.options.query.name"))
      .setDescription(t("en", "commands.presence.options.query.description"))
      .setDescriptionLocalizations(discordLocalizations("commands.presence.options.query.description"))
      .setRequired(true)
      .setAutocomplete(true)
  );