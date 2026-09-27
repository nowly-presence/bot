import { DatabaseService } from "@/services/database.service";
import { SocialFeedService, Social } from "@/services/social-feed.service";
import { CommandExecute } from "@/utils/handler/command";
import { PermissionFlagsBits } from "discord.js";

export const execute: CommandExecute = async (command) => {
  if (!command.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    await command.reply({
      content: "You need the Manage Roles permission to schedule a social feed refresh.",
      flags: ["Ephemeral"],
    });
    return;
  }

  const social = command.options.getString("social", true) as Social;
  const scheduledTime = command.options.getString("heure", true);
  const match = scheduledTime.match(/^(\d{2}):(\d{2})$/);
  const hour = match ? Number(match[1]) : -1;
  const minute = match ? Number(match[2]) : -1;

  if (!match || hour > 23 || minute > 59) {
    await command.reply({
      content: "Use a valid 24-hour time in `HH:MM` format, for example `19:30`.",
      flags: ["Ephemeral"],
    });
    return;
  }

  if (!DatabaseService.isConnected()) {
    await command.reply({
      content: "The schedule could not be saved because the database is unavailable.",
      flags: ["Ephemeral"],
    });
    return;
  }

  try {
    SocialFeedService.assertSocialConfigured(social);
  } catch (error) {
    await command.reply({
      content: error instanceof Error ? error.message : "The social network is not configured.",
      flags: ["Ephemeral"],
    });
    return;
  }

  SocialFeedService.setSchedule(social, scheduledTime);
  await command.reply({
    content: `${social} feed refresh scheduled daily at **${scheduledTime} Europe/Paris**.`,
    flags: ["Ephemeral"],
  });
};
