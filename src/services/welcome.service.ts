import { env } from "@/config/env";
import { WelcomeCard, WelcomePacketName, WelcomeRarity } from "@/data/welcome-cards";
import { DatabaseService, WelcomePull, WelcomeSource } from "@/services/database.service";
import {
  drawWelcomeCard,
  getWelcomeCard,
  getWelcomePacketState,
  removeCardFromPackets,
  renderWelcomeCard,
  restoreWelcomePackets,
} from "@/utils/welcome";
import { GuildMember } from "discord.js";

export type WelcomeGrantResult =
  | { status: "posted"; pull: WelcomePull }
  | { status: "restored"; pull: WelcomePull }
  | { status: "lost"; pull: WelcomePull }
  | { status: "already_has_card"; pull: WelcomePull }
  | { status: "no_cards_left" }
  | { status: "disabled" }
  | { status: "failed"; pull?: WelcomePull };

const packetNames: WelcomePacketName[] = ["main", "celestial"];

// A member joining right now does not need a join date in their welcome
// message, so it is only added for late welcomes, which is what /welcome is for.
const joinMentionThreshold = 3600;

export const resolveJoinedAt = (member: GuildMember): number | undefined => {
  if (!member.joinedAt) {
    return undefined;
  }

  const joinedAt = Math.floor(member.joinedAt.getTime() / 1000);
  const ageInSeconds = Math.floor(Date.now() / 1000) - joinedAt;

  return ageInSeconds > joinMentionThreshold ? joinedAt : undefined;
};

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

  handleMemberLeave = (member: Pick<GuildMember, "id" | "user">): void => {
    if (!DatabaseService.isConnected()) {
      return;
    }

    const pull = DatabaseService.vacateWelcomePull(member.id);

    if (!pull) {
      return;
    }

    const packet = removeCardFromPackets(pull.cardId);

    this.savePackets();

    if (!packet) {
      console.warn(
        `${member.user.tag} left, card #${pull.cardId} was not in any packet, so nobody can get it back`,
      );
      return;
    }

    console.log(
      `${member.user.tag} left, card #${pull.cardId} (${pull.rarity}) is back in the ${packet} packet`,
    );
  };

  grantWelcomeCard = async (
    member: GuildMember,
    source: WelcomeSource,
    rarity?: WelcomeRarity,
    forcedJoinedAt?: number,
  ): Promise<WelcomeGrantResult> => {
    if (!env.DISCORD_WELCOME_CHANNEL_ID || !DatabaseService.isConnected()) {
      return { status: "disabled" };
    }

    const existing = DatabaseService.getWelcomePull(member.id);

    if (existing) {
      return { status: "already_has_card", pull: existing };
    }

    const vacated = DatabaseService.getVacatedWelcomePull(member.id);

    if (vacated && !rarity) {
      return this.restoreVacatedPull(member, vacated, source === "command", forcedJoinedAt);
    }

    if (vacated) {
      DatabaseService.deleteVacatedWelcomePull(member.id);
    }

    const card = drawWelcomeCard(rarity);

    if (!card) {
      return { status: "no_cards_left" };
    }

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

    return this.post(member, card, forcedJoinedAt, { status: "posted", pull });
  };

  // A member who left and came back gets their card back when nobody else drew
  // it in the meantime. When somebody did, they are out: no re-roll. A natural
  // rejoin stays silent, /welcome posts it like any other card.
  private restoreVacatedPull = async (
    member: GuildMember,
    pull: WelcomePull,
    shouldPost: boolean,
    forcedJoinedAt?: number,
  ): Promise<WelcomeGrantResult> => {
    const packet = removeCardFromPackets(pull.cardId);

    if (!packet) {
      DatabaseService.deleteVacatedWelcomePull(member.id);

      console.log(
        `${member.user.tag} came back, but card #${pull.cardId} (${pull.rarity}) was drawn by someone else while they were gone`,
      );

      return { status: "lost", pull };
    }

    this.savePackets();
    DatabaseService.deleteVacatedWelcomePull(member.id);

    const restored: WelcomePull = { ...pull, source: shouldPost ? pull.source : "rejoin" };
    DatabaseService.insertWelcomePull(restored);

    console.log(
      `${member.user.tag} came back and got card #${restored.cardId} (${restored.rarity}) back from the ${packet} packet`,
    );

    const card = getWelcomeCard(restored.cardId);

    if (!card || !shouldPost) {
      return { status: "restored", pull: restored };
    }

    return this.post(member, card, forcedJoinedAt, { status: "restored", pull: restored });
  };

  private post = async (
    member: GuildMember,
    card: WelcomeCard,
    forcedJoinedAt: number | undefined,
    result: { status: "posted" | "restored"; pull: WelcomePull },
  ): Promise<WelcomeGrantResult> => {
    const channelId = env.DISCORD_WELCOME_CHANNEL_ID;

    if (!channelId) {
      return { status: "disabled" };
    }

    try {
      const channel = await member.guild.channels.fetch(channelId);

      if (!channel?.isSendable()) {
        console.error(`Welcome channel ${channelId} is not sendable`);
        return { status: "failed", pull: result.pull };
      }

      await channel.send(renderWelcomeCard(card, member.id, forcedJoinedAt ?? resolveJoinedAt(member)));
    } catch (error) {
      console.error(`Failed to send welcome card to ${member.user.tag}:`, error);
      return { status: "failed", pull: result.pull };
    }

    return result;
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
