import { getWelcomeCard } from "@/data/welcome-cards";
import { DatabaseService } from "@/services/database.service";
import { resolveJoinedAt } from "@/services/welcome.service";
import { CommandExecute } from "@/utils/handler/command";
import { buildCardEmbed } from "@/utils/welcome";
import { GuildMember } from "discord.js";

export const execute: CommandExecute = async (command) => {
  const pull = DatabaseService.getWelcomePull(command.user.id);

  if (!pull) {
    await command.reply({
      content: "You do not have a welcome card yet. You get one the moment you join the server.",
      flags: ["Ephemeral"],
    });

    return;
  }

  const card = getWelcomeCard(pull.pack, pull.cardId);

  if (!card) {
    await command.reply({
      content: `Your card (#${pull.cardId}) is not in the card list anymore, so it cannot be shown. Please contact an administrator.`,
      flags: ["Ephemeral"],
    });

    return;
  }

  const member = command.member instanceof GuildMember ? command.member : null;

  await command.reply({
    embeds: [
      buildCardEmbed({
        userId: command.user.id,
        card,
        drawnAt: pull.drawnAt,
        joinedAt: member ? resolveJoinedAt(member) : undefined,
      }),
    ],
  });
};
