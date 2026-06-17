import { discordLocalizations, t } from "@/utils/i18n";
import { SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("status")
  .setDescription(t("en", "commands.status.description"))
  .setDescriptionLocalizations(discordLocalizations("commands.status.description"));