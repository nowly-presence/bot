import { XFeedService } from "@/services/x-feed.service";
import { CommandExecute } from "@/utils/handler/command";
import { PermissionFlagsBits } from "discord.js";

export const execute: CommandExecute = async (command) => {
  if (!command.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    await command.reply({
      content: "You need the Manage Roles permission to refresh the X feed.",
      flags: ["Ephemeral"],
    });
    return;
  }

  await command.deferReply({ flags: ["Ephemeral"] });

  try {
    const result = await XFeedService.clearCacheAndPoll(command.client);
    await command.editReply(
      `Refreshed @${result.username}: ${result.items} post(s) in the feed, ${result.posted} new post(s) sent to Discord.`,
    );
  } catch (error) {
    console.error("Manual X feed refresh failed:", error);
    await command.editReply(
      `The feed refresh failed: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
};
