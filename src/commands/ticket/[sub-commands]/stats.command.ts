import { DatabaseService } from "@/services/database.service";
import { createNowlyEmbed } from "@/utils/embed";
import { CommandExecute } from "@/utils/handler/command";
import { PermissionFlagsBits } from "discord.js";

const formatDuration = (durationMs: number | null): string => {
  if (durationMs === null) {
    return "N/A";
  }

  const totalMinutes = Math.floor(durationMs / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m`;
  }

  return `${Math.floor(durationMs / 1_000)}s`;
};

export const execute: CommandExecute = async (command) => {
  if (!command.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
    await command.reply({
      content: "You need the Manage Channels permission to use this command.",
      flags: ["Ephemeral"],
    });
    return;
  }

  if (!DatabaseService.isConnected()) {
    await command.reply({
      content: "Ticket rating statistics are unavailable because the database is not connected.",
      flags: ["Ephemeral"],
    });
    return;
  }

  const stats = DatabaseService.getTicketRatingStats();
  const closureStats = DatabaseService.getTicketClosureStats();
  const average = stats.average === null ? "N/A" : `${stats.average.toFixed(2)}/5`;
  const percentage = stats.average === null ? "N/A" : `${((stats.average / 5) * 100).toFixed(1)}%`;
  const positiveRate = stats.total === 0 ? "N/A" : `${((stats.positive / stats.total) * 100).toFixed(1)}%`;
  const distribution = ([5, 4, 3, 2, 1] as const)
    .map((rating) => {
      const count = stats.counts[rating];
      const share = stats.total === 0 ? "0.0%" : `${((count / stats.total) * 100).toFixed(1)}%`;
      return `**${rating}/5:** ${count} vote(s) (${share})`;
    })
    .join("\n");

  await command.reply({
    embeds: [
      createNowlyEmbed(
        "Support ticket ratings",
        `**Responses:** ${stats.total}\n**Support score:** ${average}\n**Overall score:** ${percentage}\n**Positive ratings (3–5):** ${positiveRate}\n\n${distribution}\n\n**Tickets closed:** ${closureStats.total}\n**Average resolution time:** ${formatDuration(closureStats.averageDurationMs)}`,
      ),
    ],
    flags: ["Ephemeral"],
  });
};
