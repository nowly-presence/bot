import { Event } from "@/utils/handler/event/event.type";
import { SUGGESTIONS_CHANNEL_ID, SUGGESTION_TAGS_COMMAND, SUGGESTION_TAGS_SELECT_PREFIX } from "@/utils/suggestion-tags";
import { ActionRowBuilder, ChannelType, Events, PermissionFlagsBits, StringSelectMenuBuilder } from "discord.js";

const event: Event<Events.InteractionCreate> = {
  name: Events.InteractionCreate,
  execute: async (interaction) => {
    const isCommand = interaction.isMessageContextMenuCommand()
      && interaction.commandName === SUGGESTION_TAGS_COMMAND;
    const isSelect = interaction.isStringSelectMenu()
      && interaction.customId.startsWith(SUGGESTION_TAGS_SELECT_PREFIX);

    if (!isCommand && !isSelect) return;
    if (!interaction.isMessageContextMenuCommand() && !interaction.isStringSelectMenu()) return;

    await interaction.deferReply({ flags: ["Ephemeral"] });

    try {
      if (!interaction.guild || !interaction.memberPermissions?.has(PermissionFlagsBits.ManageThreads)) {
        await interaction.editReply("You need the Manage Threads permission to edit suggestion tags.");
        return;
      }

      const threadId = interaction.isStringSelectMenu()
        ? interaction.customId.slice(SUGGESTION_TAGS_SELECT_PREFIX.length)
        : interaction.targetMessage.channelId;
      const thread = await interaction.guild.channels.fetch(threadId);

      if (!thread?.isThread() || thread.parentId !== SUGGESTIONS_CHANNEL_ID) {
        await interaction.editReply(`Use this action on a message inside a post in <#${SUGGESTIONS_CHANNEL_ID}>.`);
        return;
      }

      const forum = await interaction.guild.channels.fetch(SUGGESTIONS_CHANNEL_ID);

      if (forum?.type !== ChannelType.GuildForum) {
        await interaction.editReply("The suggestions forum is unavailable.");
        return;
      }

      if (!thread.permissionsFor(interaction.user)?.has(PermissionFlagsBits.ManageThreads)) {
        await interaction.editReply("You need the Manage Threads permission in this forum.");
        return;
      }

      if (interaction.isStringSelectMenu()) {
        if (interaction.values.length > 5 || interaction.values.some((id) => !forum.availableTags.some((tag) => tag.id === id))) {
          await interaction.editReply("The available tags have changed. Please open the menu again.");
          return;
        }

        await thread.setAppliedTags(interaction.values, `Suggestion tags updated by ${interaction.user.tag}`);
        await interaction.editReply(`Tags updated for <#${thread.id}>.`);
        await interaction.message.edit({ components: [] });
        return;
      }

      if (!forum.availableTags.length) {
        await interaction.editReply("This forum has no available tags.");
        return;
      }

      const select = new StringSelectMenuBuilder()
        .setCustomId(`${SUGGESTION_TAGS_SELECT_PREFIX}${thread.id}`)
        .setPlaceholder("Select the tags for this suggestion")
        .setMinValues(0)
        .setMaxValues(Math.min(5, forum.availableTags.length))
        .addOptions(forum.availableTags.map((tag) => ({
          label: tag.name,
          value: tag.id,
          default: thread.appliedTags.includes(tag.id),
          ...(tag.emoji?.id
            ? { emoji: { id: tag.emoji.id } }
            : tag.emoji?.name ? { emoji: { name: tag.emoji.name } } : {}),
        })));

      await interaction.editReply({
        content: `Edit tags for <#${thread.id}>. Clear the selection to remove all tags.`,
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
      });
    } catch (error) {
      console.error("Failed to edit suggestion tags:", error);
      await interaction.editReply("Unable to edit the tags. Check that the bot has the Manage Threads permission and try again.");
    }
  },
};

export default event;
