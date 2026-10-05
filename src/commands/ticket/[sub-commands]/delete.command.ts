import { DatabaseService } from "@/services/database.service";
import { TicketService, TICKET_CATEGORY_ID } from "@/services/ticket.service";
import { CommandExecute } from "@/utils/handler/command";
import { ChannelType, PermissionFlagsBits } from "discord.js";

export const execute: CommandExecute = async (command) => {
  if (!command.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
    await command.reply({
      content: "You need the Manage Channels permission to use this command.",
      flags: ["Ephemeral"],
    });
    return;
  }

  if (!command.guild) {
    await command.reply({
      content: "This command can only be used inside a server.",
      flags: ["Ephemeral"],
    });
    return;
  }

  if (!DatabaseService.isConnected()) {
    await command.reply({
      content: "The database is unavailable, so ticket records cannot be safely removed.",
      flags: ["Ephemeral"],
    });
    return;
  }

  const selectedChannel = command.options.getChannel("channel", true);

  if (selectedChannel.type !== ChannelType.GuildText) {
    await command.reply({
      content: "Select a ticket channel from the configured ticket category.",
      flags: ["Ephemeral"],
    });
    return;
  }

  const keep = command.options.getBoolean("keep") ?? false;
  await command.deferReply({ flags: ["Ephemeral"] });

  const channel = await command.guild.channels.fetch(selectedChannel.id).catch(() => null);

  if (
    !channel ||
    channel.type !== ChannelType.GuildText ||
    channel.parentId !== TICKET_CATEGORY_ID ||
    !TicketService.isTicketChannel(channel)
  ) {
    await command.editReply({ content: "That ticket could not be found." });
    return;
  }

  let channelHandled = false;
  let dataPurged = false;

  try {
    const deletedData = DatabaseService.deleteTicketData(channel.id);
    const removedRecords = deletedData.ratings + deletedData.closures;
    dataPurged = true;

    if (keep) {
      await TicketService.archiveTicket(channel);
    } else {
      await TicketService.deleteTicket(channel);
    }

    channelHandled = true;
    const channelResult = keep ? `Archived <#${channel.id}>` : `Deleted **${channel.name}**`;

    await command.editReply({
      content: `${channelResult} and removed ${removedRecords} linked statistics record(s). The next ticket will use the lowest available number.`,
    });
  } catch (error) {
    console.error(`Failed to remove ticket ${channel.id}:`, error);
    await command.editReply({
      content: channelHandled
        ? "The ticket channel and its database records were removed, but the confirmation could not be sent."
        : dataPurged
          ? "Ticket statistics were removed, but the channel could not be deleted or archived. Retry the command to finish."
          : "The ticket could not be removed. Check the bot permissions and logs.",
    });
  }
};
