import { SocialFeedService, Social } from "@/services/social-feed.service";
import { CommandExecute } from "@/utils/handler/command";
import { PermissionFlagsBits } from "discord.js";

export const execute: CommandExecute = async (command) => {
  if (!command.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    await command.reply({
      content: "You need the Manage Roles permission to publish social posts.",
      flags: ["Ephemeral"],
    });
    return;
  }

  const social = command.options.getString("social", true) as Social;
  await command.deferReply({ flags: ["Ephemeral"] });

  try {
    await SocialFeedService.postManually(
      command.client,
      social,
      command.options.getString("url", true),
    );
    await command.editReply("The post was published and marked as sent.");
  } catch (error) {
    console.error(`Manual ${social} post failed:`, error);
    await command.editReply(
      `The post could not be published: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
};
