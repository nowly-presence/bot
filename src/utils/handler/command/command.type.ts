import {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Collection,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { MaybePromise } from "#/types/promise";

export type SlashCommandDefinition =
  | SlashCommandSubcommandsOnlyBuilder
  | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">;

export type CommandExecute = (command: ChatInputCommandInteraction) => MaybePromise<void>;
export type AutocompleteExecute = (interaction: AutocompleteInteraction) => MaybePromise<void>;

export type CommandsCollection = Collection<string, CommandExecute>;
export type AutocompleteCollection = Collection<string, AutocompleteExecute>;
export type BuildersCollection = Collection<string, SlashCommandDefinition>;

export type LoadedCommands = {
  commands: CommandsCollection;
  autocompletes: AutocompleteCollection;
  builders: BuildersCollection;
};
