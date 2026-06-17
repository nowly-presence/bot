import {
  SlashCommandSubcommandBuilder,
  SlashCommandSubcommandGroupBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";
import { SlashCommandDefinition } from "./command.type";

export const haveSubcommands = (
  commandBuilder: SlashCommandDefinition,
): commandBuilder is SlashCommandSubcommandsOnlyBuilder => {
  const subCommand = commandBuilder.options.find((option) => {
    return option instanceof SlashCommandSubcommandBuilder
      || option instanceof SlashCommandSubcommandGroupBuilder;
  });

  return !!subCommand;
};

export const serializeCommandName = (
  commandName: string,
  subCommand?: string,
  subCommandGroup?: string,
): string => {
  let command = commandName;

  if (subCommandGroup) {
    command += `.${subCommandGroup}`;
  }

  if (subCommand) {
    command += `.${subCommand}`;
  }

  return command;
};
