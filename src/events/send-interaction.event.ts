import { parseSendModalToken, takeSendRequest } from "@/utils/send";
import { Event } from "@/utils/handler/event/event.type";
import { AttachmentBuilder, EmbedBuilder, Events, PermissionFlagsBits } from "discord.js";

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

const loadAttachment = async (url: string, originalName: string): Promise<AttachmentBuilder> => {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });

  if (!response.ok) {
    throw new Error(`Attachment download failed with HTTP ${response.status}`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);

  if (contentLength > MAX_ATTACHMENT_SIZE) {
    throw new Error("The attachment exceeds the 10 MB limit");
  }

  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length > MAX_ATTACHMENT_SIZE) {
    throw new Error("The attachment exceeds the 10 MB limit");
  }

  const name = originalName.replace(/[^\w.-]/g, "_").slice(0, 100) || "attachment";

  return new AttachmentBuilder(buffer, { name });
};

const event: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  execute: async (interaction) => {
    if (!interaction.isModalSubmit()) {
      return;
    }

    const token = parseSendModalToken(interaction.customId);

    if (!token) {
      return;
    }

    const sendRequest = takeSendRequest(token);

    if (!sendRequest) {
      await interaction.reply({
        content: "This send form expired. Please run `/send` again.",
        flags: ["Ephemeral"],
      });
      return;
    }

    const content = interaction.fields.getTextInputValue("content").trim();
    const title = interaction.fields.getTextInputValue("title").trim();

    if (!interaction.guild || !interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.reply({
        content: "You need the Manage Roles permission to send messages as the bot.",
        flags: ["Ephemeral"],
      });

      return;
    }

    if (!content) {
      await interaction.reply({
        content: "The message was empty, so nothing was sent.",
        flags: ["Ephemeral"],
      });

      return;
    }

    await interaction.deferReply({ flags: ["Ephemeral"] });

    try {
      const channel = interaction.guild.channels.cache.get(sendRequest.channelId)
        ?? await interaction.guild.channels.fetch(sendRequest.channelId);

      if (!channel?.isSendable()) {
        await interaction.editReply({
          content: `I cannot send messages in <#${sendRequest.channelId}> anymore.`,
        });
        return;
      }

      const files = sendRequest.attachment
        ? [await loadAttachment(sendRequest.attachment.url, sendRequest.attachment.name)]
        : [];

      if (sendRequest.embed) {
        const embed = new EmbedBuilder();

        if (title) embed.setTitle(title);
        if (content) embed.setDescription(content);
        if (sendRequest.color !== undefined) embed.setColor(sendRequest.color);
        if (files[0]) embed.setImage(`attachment://${files[0].name}`);

        await channel.send({ embeds: [embed], files });
      } else {
        await channel.send({ content, files });
      }

      await interaction.editReply({ content: `Sent in <#${sendRequest.channelId}>.` });
    } catch (error) {
      console.error(`Failed to send a message in ${sendRequest.channelId}:`, error);
      await interaction.editReply({
        content: "The message could not be sent. Please check the bot logs.",
      });
    }
  },
};

export default event;
