import { env } from "@/config/env";
import { getWelcomeCard, WelcomeCard, WelcomeRarity, welcomePackNames } from "@/data/welcome-cards";
import { DatabaseService, WelcomePull, WelcomeSource } from "@/services/database.service";
import {
  claimCardFromPack,
  drawWelcomeCard,
  getCurrentPack,
  getWelcomePacketState,
  renderWelcomeCard,
  restoreWelcomePackets,
  returnCardToPack,
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
    const state = restoreWelcomePackets(
      Object.fromEntries(
        welcomePackNames.map((name) => [name, DatabaseService.getWelcomePacket(name)]),
      ),
    );

    const remaining = getWelcomePacketState();
    const summary = welcomePackNames
      .map((name) => `${name}: ${remaining[name].length}`)
      .join(", ");

    console.log(`Welcome packs restored from SQLite: ${summary}`);
  };

  handleMemberLeave = (member: Pick<GuildMember, "id" | "user">): void => {
    if (!DatabaseService.isConnected()) {
      return;
    }

    const pull = DatabaseService.vacateWelcomePull(member.id);

    if (!pull) {
      return;
    }

    const card = getWelcomeCard(pull.pack, pull.cardId);

    this.savePackets();

    if (!card || !returnCardToPack(card)) {
      console.warn(
        `${member.user.tag} left, card #${pull.cardId} is not part of the ${pull.pack} pack anymore, so it is gone for good`,
      );
      return;
    }

    this.savePackets();

    console.log(
      `${member.user.tag} left, card #${pull.cardId} (${pull.rarity}) is back in the ${pull.pack} pack`,
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

    this.savePackets();

    const pull: WelcomePull = {
      userId: member.id,
      cardId: card.messageId,
      rarity: card.rarity,
      pack: card.pack,
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
    const pack = claimCardFromPack(pull.pack, pull.cardId);

    if (!pack) {
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
      `${member.user.tag} came back and got card #${restored.cardId} (${restored.rarity}) back from the ${pull.pack} pack`,
    );

    const card = getWelcomeCard(restored.pack, restored.cardId);

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
      for (const name of welcomePackNames) {
        DatabaseService.saveWelcomePacket(name, state[name]);
      }
    } catch (error) {
      console.error("Failed to persist the welcome packs in SQLite:", error);
    }
  };
}

export const WelcomeService = new WelcomeServiceClass();
