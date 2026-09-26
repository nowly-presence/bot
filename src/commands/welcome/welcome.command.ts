import { env } from "@/config/env";
import { WelcomePull } from "@/services/database.service";
import { WelcomeService } from "@/services/welcome.service";
import { CommandExecute } from "@/utils/handler/command";
import { getRarityEmoji, getRarityLabel, isWelcomeRarity, parseJoinedOption, renderJoinedAgo } from "@/utils/welcome";
import { Client, GuildMember, PermissionFlagsBits } from "discord.js";

const describePull = (pull: WelcomePull): string => {
  const drawnAt = Math.floor(pull.drawnAt / 1000);
  const label = `${getRarityEmoji(pull.rarity)} **${getRarityLabel(pull.rarity)}**`;

  return `card #${pull.cardId} ${label} drawn <t:${drawnAt}:R>`;
};

const channelMention = (): string => `<#${env.DISCORD_WELCOME_CHANNEL_ID}>`;

const resolveMember = async (
  client: Client<true>,
  guildId: string,
  userId: string,
): Promise<GuildMember | null> => {
  try {
    const guild = await client.guilds.fetch(guildId);
    return await guild.members.fetch(userId);
  } catch (error) {
    console.error(`Failed to resolve member ${userId} in guild ${guildId}:`, error);
    return null;
  }
};

export const execute: CommandExecute = async (command) => {
  if (!command.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    await command.reply({
      content: "You need the Manage Roles permission to use this command.",
      flags: ["Ephemeral"],
    });

    return;
  }

  if (!command.guildId) {
    await command.reply({
      content: "This command can only be used inside a server.",
      flags: ["Ephemeral"],
    });

    return;
  }

  const user = command.options.getUser("user", true);
  const member = await resolveMember(command.client, command.guildId, user.id);

  if (!member) {
    await command.reply({
      content: "That member could not be found in this server.",
      flags: ["Ephemeral"],
    });

    return;
  }

  const rarityOption = command.options.getString("rarity");
  const rarity = rarityOption && isWelcomeRarity(rarityOption) ? rarityOption : undefined;

  const joinedOption = command.options.getString("joined");
  let forcedJoinedAt: number | undefined;

  if (joinedOption) {
    const parsed = parseJoinedOption(joinedOption);

    if (parsed === null) {
      await command.reply({
        content: "I could not read that join date. Try a delay like `3d`, `12h` or `2h30m`, or a date like `2025-06-15`.",
        flags: ["Ephemeral"],
      });

      return;
    }

    forcedJoinedAt = parsed;
  }

  const result = await WelcomeService.grantWelcomeCard(member, "command", rarity, forcedJoinedAt);

  const joined = forcedJoinedAt ? ` ${renderJoinedAgo(forcedJoinedAt)}` : "";

  if (result.status === "posted") {
    await command.reply({
      content: `Gave ${describePull(result.pull)} to <@${member.id}>${joined}. Posted in ${channelMention()}.`,
      flags: ["Ephemeral"],
    });

    return;
  }

  if (result.status === "already_has_card") {
    await command.reply({
      content: `<@${member.id}> already holds ${describePull(result.pull)}. Cards are never re-rolled.`,
      flags: ["Ephemeral"],
    });

    return;
  }

  if (result.status === "restored") {
    await command.reply({
      content: `Gave ${describePull(result.pull)} back to <@${member.id}>${joined}, nobody else had drawn it. Posted in ${channelMention()}.`,
      flags: ["Ephemeral"],
    });

    return;
  }

  if (result.status === "lost") {
    await command.reply({
      content: `<@${member.id}> had ${describePull(result.pull)}, but it was drawn by someone else while they were away. No re-roll, so nothing was given.`,
      flags: ["Ephemeral"],
    });

    return;
  }

  if (result.status === "disabled") {
    await command.reply({
      content: "The welcome feature is not configured on this bot, so no card was given.",
      flags: ["Ephemeral"],
    });

    return;
  }

  if (result.pull) {
    await command.reply({
      content: `Assigned ${describePull(result.pull)} to <@${member.id}>, but the message could not be posted in ${channelMention()}. Check the bot logs.`,
      flags: ["Ephemeral"],
    });

    return;
  }

  await command.reply({
    content: "Something went wrong while granting a card. Check the bot logs.",
    flags: ["Ephemeral"],
  });
};
