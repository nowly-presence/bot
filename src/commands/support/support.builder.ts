import { discordLocalizations, t } from "@/utils/i18n";
import { SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("support")
  .setDescription(t("en", "commands.support.description"))
  .setDescriptionLocalizations(discordLocalizations("commands.support.description"));