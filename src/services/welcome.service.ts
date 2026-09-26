import { env } from "@/config/env";
import { WelcomeRarity } from "@/data/welcome-cards";
import { DatabaseService, WelcomePull, WelcomeSource } from "@/services/database.service";
import { drawWelcomeCard, renderWelcomeCard } from "@/utils/welcome";
import { GuildMember } from "discord.js";

export type WelcomeGrantResult =
  | { status: "posted"; pull: WelcomePull }
  | { status: "already_has_card"; pull: WelcomePull }
  | { status: "disabled" }
  | { status: "failed"; pull?: WelcomePull };

class WelcomeServiceClass {
  grantWelcomeCard = async (
    member: GuildMember,
    source: WelcomeSource,
    rarity?: WelcomeRarity,
  ): Promise<WelcomeGrantResult> => {
    if (!env.DISCORD_WELCOME_CHANNEL_ID || !DatabaseService.isConnected()) {
      return { status: "disabled" };
    }

    const existing = DatabaseService.getWelcomePull(member.id);

    if (existing) {
      return { status: "already_has_card", pull: existing };
    }

    const card = drawWelcomeCard(rarity);
    const pull: WelcomePull = {
      userId: member.id,
      cardId: card.id,
      rarity: card.rarity,
      source,
      drawnAt: Date.now(),
    };

    if (!DatabaseService.insertWelcomePull(pull)) {
      const conflict = DatabaseService.getWelcomePull(member.id);
      return conflict ? { status: "already_has_card", pull: conflict } : { status: "failed" };
    }

    try {
      const channel = await member.guild.channels.fetch(env.DISCORD_WELCOME_CHANNEL_ID);

      if (!channel?.isSendable()) {
        console.error(`Welcome channel ${env.DISCORD_WELCOME_CHANNEL_ID} is not sendable`);
        return { status: "failed", pull };
      }

      await channel.send(renderWelcomeCard(card, member.id));
    } catch (error) {
      console.error(`Failed to send welcome card to ${member.user.tag}:`, error);
      return { status: "failed", pull };
    }

    return { status: "posted", pull };
  };
}

export const WelcomeService = new WelcomeServiceClass();
