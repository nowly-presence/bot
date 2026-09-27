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

  const attachment = command.options.getAttachment("attachment");
  const colorInput = command.options.getString("color")?.trim();
  const colorValue = colorInput?.replace(/^#/, "");

  if (colorValue && !/^[\da-f]{6}$/i.test(colorValue)) {
    await command.reply({
      content: "The color must be a hex value such as #62D0FF.",
      flags: ["Ephemeral"],
    });
    return;
  }

  const embed = command.options.getBoolean("embed") ?? false;

  if (embed && attachment && !attachment.contentType?.startsWith("image/")) {
    await command.reply({
      content: "An attachment in an embed must be an image.",
      flags: ["Ephemeral"],
    });
    return;
  }

  await command.showModal(createSendModal({
    channelId: channel.id,
    attachment: attachment ? { url: attachment.url, name: attachment.name } : undefined,
    color: colorValue ? Number.parseInt(colorValue, 16) : undefined,
    embed,
  }));
};
