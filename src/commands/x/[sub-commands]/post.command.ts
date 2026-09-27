import { XFeedService } from "@/services/x-feed.service";
import { CommandExecute } from "@/utils/handler/command";
import { PermissionFlagsBits } from "discord.js";

export const execute: CommandExecute = async (command) => {
  if (!command.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    await command.reply({
      content: "You need the Manage Roles permission to publish X posts.",
      flags: ["Ephemeral"],
    });
    return;
  }

  await command.deferReply({ flags: ["Ephemeral"] });

  try {
    await XFeedService.postManually(
      command.client,
      command.options.getString("url", true),
    );

    await command.editReply("The post was published and marked as sent.");
  } catch (error) {
    console.error("Manual X post failed:", error);
    await command.editReply(
      `The post could not be published: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
};
