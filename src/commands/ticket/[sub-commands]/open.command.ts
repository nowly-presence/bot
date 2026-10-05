import { OpenTicketAlreadyExistsError, TicketService } from "@/services/ticket.service";
import { CommandExecute } from "@/utils/handler/command";
import { PermissionFlagsBits } from "discord.js";

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

  const user = command.options.getUser("user", true);
  await command.deferReply({ flags: ["Ephemeral"] });

  const member = await command.guild.members.fetch(user.id).catch(() => null);

  if (!member) {
    await command.editReply({ content: "That member could not be found in this server." });
    return;
  }

  const description = command.options.getString("description") ?? "";

  try {
    const channel = await TicketService.createTicket(command.guild, member.user, description);

    await command.editReply({
      content: `Ticket opened for <@${member.id}>: <#${channel.id}>`,
    });
  } catch (error) {
    if (error instanceof OpenTicketAlreadyExistsError) {
      await command.editReply({
        content: `<@${member.id}> already has an open ticket: <#${error.channelId}>`,
      });
      return;
    }

    console.error(error);
    await command.editReply({
      content: "The ticket could not be created. Please check the bot permissions and logs.",
    });
  }
};
