import { SocialFeedService, Social } from "@/services/social-feed.service";
import { CommandExecute } from "@/utils/handler/command";
import { PermissionFlagsBits } from "discord.js";

export const execute: CommandExecute = async (command) => {
  if (!command.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    await command.reply({
      content: "You need the Manage Roles permission to refresh social feeds.",
      flags: ["Ephemeral"],
    });
    return;
  }

  const social = command.options.getString("social", true) as Social;
  await command.deferReply({ flags: ["Ephemeral"] });

  try {
    const result = await SocialFeedService.clearCacheAndPoll(command.client, social);
    await command.editReply(
      `Refreshed ${social}: ${result.items} post(s) in the feed, ${result.posted} new post(s) sent to Discord.`,
    );
  } catch (error) {
    console.error(`Manual ${social} feed refresh failed:`, error);
    await command.editReply(
      `The feed refresh failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
};
