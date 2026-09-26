import { env } from "@/config/env";
import { WelcomePacketName, WelcomeRarity } from "@/data/welcome-cards";
import { DatabaseService, WelcomePull, WelcomeSource } from "@/services/database.service";
import {
  drawWelcomeCard,
  getWelcomePacketState,
  renderWelcomeCard,
  restoreWelcomePackets,
} from "@/utils/welcome";
import { GuildMember } from "discord.js";

export type WelcomeGrantResult =
  | { status: "posted"; pull: WelcomePull }
  | { status: "already_has_card"; pull: WelcomePull }
  | { status: "disabled" }
  | { status: "failed"; pull?: WelcomePull };

const packetNames: WelcomePacketName[] = ["main", "celestial"];

class WelcomeServiceClass {
  restorePackets = (): void => {
    restoreWelcomePackets({
      main: DatabaseService.getWelcomePacket("main"),
      celestial: DatabaseService.getWelcomePacket("celestial"),
    });

    const state = getWelcomePacketState();

    console.log(
      `Welcome packets restored from SQLite: ${state.main.length} card(s) left in the main packet, ${state.celestial.length} celestial card(s) left`,
    );
  };

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

    if (!rarity) {
      this.savePackets();
    }

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

  private savePackets = (): void => {
    const state = getWelcomePacketState();

    try {
      for (const name of packetNames) {
        DatabaseService.saveWelcomePacket(name, state[name]);
      }
    } catch (error) {
      console.error("Failed to persist the welcome packets in SQLite:", error);
    }
  };
}

export const WelcomeService = new WelcomeServiceClass();
