import { env } from "@/config/env";
import { TICKET_CATEGORY_ID, TicketService } from "@/services/ticket.service";
import { createTicketApiAccessKey } from "@/services/ticket-api.service";
import { createNowlyEmbed } from "@/utils/embed";
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

  if (!env.DISCORD_TICKET_API_KEY) {
    await command.reply({
      content: "The ticket transcript API is not configured. Set DISCORD_TICKET_API_KEY in the bot environment.",
      flags: ["Ephemeral"],
    });
    return;
  }

  if (!env.DISCORD_TICKET_API_PUBLIC_URL) {
    await command.reply({
      content: "Set DISCORD_TICKET_API_PUBLIC_URL to the API's publicly reachable base URL.",
      flags: ["Ephemeral"],
    });
    return;
  }

  const channel = command.channel;

  if (
    !channel ||
    channel.type !== ChannelType.GuildText ||
    channel.parentId !== TICKET_CATEGORY_ID ||
    !TicketService.isOpenTicket(channel)
  ) {
    await command.reply({
      content: "Use this command inside an open support ticket.",
      flags: ["Ephemeral"],
    });
    return;
  }

  const endpoint = `${env.DISCORD_TICKET_API_PUBLIC_URL}/api/tickets/${channel.id}.md`;
  const accessKey = createTicketApiAccessKey(channel.id);
  const embed = createNowlyEmbed(
    "Ticket transcript API",
    [
      `**Markdown endpoint:** <${endpoint}>`,
      "**Authorization:** send this HTTP header:",
      `\`Authorization: Bearer ${accessKey}\``,
      "The transcript is available while this ticket is open. Attachments and embedded media are included as URLs.",
    ].join("\n\n"),
  ).setColor(0x62d0ff);

  await command.reply({
    embeds: [embed],
    flags: ["Ephemeral"],
  });
};
