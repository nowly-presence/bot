import { env } from "@/config/env";
import { DatabaseService } from "@/services/database.service";
import { XFeedService } from "@/services/x-feed.service";
import { CommandExecute } from "@/utils/handler/command";
import { PermissionFlagsBits } from "discord.js";

export const execute: CommandExecute = async (command) => {
  if (!command.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    await command.reply({
      content: "You need the Manage Roles permission to schedule an X feed refresh.",
      flags: ["Ephemeral"],
    });
    return;
  }

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

  if (!env.X_RSS_POLL_URL || !env.X_RSS_POLL_TOKEN) {
    await command.reply({
      content: "The schedule could not be enabled because the feed endpoint or token is missing.",
      flags: ["Ephemeral"],
    });
    return;
  }

  XFeedService.setSchedule(scheduledTime);
  await command.reply({
    content: `Feed refresh scheduled daily at **${scheduledTime} Europe/Paris**.`,
    flags: ["Ephemeral"],
  });
};
