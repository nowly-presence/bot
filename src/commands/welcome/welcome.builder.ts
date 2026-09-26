import { getRarityLabel, welcomeRarities } from "@/utils/welcome";
import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export const slashCommand = new SlashCommandBuilder()
  .setName("welcome")
  .setDescription("Give a welcome card to a member")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addUserOption((option) =>
    option
      .setName("user")
      .setDescription("Member to give a welcome card to")
      .setRequired(true)
  )
  .addStringOption((option) =>
    option
      .setName("rarity")
      .setDescription("Force a specific rarity, or leave empty for a random draw")
      .addChoices(
        ...welcomeRarities.map((rarity) => ({
          name: getRarityLabel(rarity),
          value: rarity,
        })),
      )
  )
  .addStringOption((option) =>
    option
      .setName("joined")
      .setDescription("Force the join date: a delay like 3d or 12h, or a date like 2025-06-15")
  );
