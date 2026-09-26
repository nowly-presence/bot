import { CommandExecute } from "@/utils/handler/command";
import { createSendModal } from "@/utils/send";
import { PermissionFlagsBits } from "discord.js";

export const execute: CommandExecute = async (command) => {
  if (!command.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
    await command.reply({
      content: "You need the Manage Roles permission to use this command.",
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

  const target = command.options.getChannel("channel", true);

  if (!target) {
    await command.reply({
      content: "That channel cannot be used to send messages.",
      flags: ["Ephemeral"],
    });

    return;
  }

  const channel = await command.guild.channels.fetch(target.id).catch(() => null);

  if (!channel?.isSendable()) {
    await command.reply({
      content: `I cannot send messages in <#${target.id}>.`,
      flags: ["Ephemeral"],
    });

    return;
  }

  await command.showModal(createSendModal(channel.id));
};
