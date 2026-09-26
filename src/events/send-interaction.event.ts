import { parseSendModalChannelId } from "@/utils/send";
import { Event } from "@/utils/handler/event/event.type";
import { Events, PermissionFlagsBits } from "discord.js";

const event: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  execute: async (interaction) => {
    if (!interaction.isModalSubmit()) {
      return;
    }

    const channelId = parseSendModalChannelId(interaction.customId);

    if (!channelId) {
      return;
    }

    const content = interaction.fields.getTextInputValue("content").trim();

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
      const channel = interaction.guild.channels.cache.get(channelId)
        ?? await interaction.guild.channels.fetch(channelId);

      if (!channel?.isSendable()) {
        await interaction.editReply({
          content: `I cannot send messages in <#${channelId}> anymore.`,
        });
        return;
      }

      await channel.send(content);
      await interaction.editReply({ content: `Sent in <#${channelId}>.` });
    } catch (error) {
      console.error(`Failed to send a message in ${channelId}:`, error);
      await interaction.editReply({
        content: "The message could not be sent. Please check the bot logs.",
      });
    }
  },
};

export default event;
