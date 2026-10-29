import { ApplicationCommandType, ContextMenuCommandBuilder, InteractionContextType, PermissionFlagsBits } from "discord.js";

export const SUGGESTIONS_CHANNEL_ID = "1553417113077555240";
export const SUGGESTION_TAGS_COMMAND = "Edit tags";
export const SUGGESTION_TAGS_SELECT_PREFIX = "suggestion-tags:";

export const suggestionTagsCommand = new ContextMenuCommandBuilder()
  .setName(SUGGESTION_TAGS_COMMAND)
  .setType(ApplicationCommandType.Message)
  .setContexts(InteractionContextType.Guild)
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads);
