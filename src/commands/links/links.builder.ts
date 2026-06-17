import { discordLocalizations, t } from "@/utils/i18n";
import { SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("links")
  .setDescription(t("en", "commands.links.description"))
  .setDescriptionLocalizations(discordLocalizations("commands.links.description"));