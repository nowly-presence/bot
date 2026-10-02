import { env } from "@/config/env";
import { Client, Message, TextChannel } from "discord.js";

const VERIFY_CHANNEL_ID = "1555552153542725742";
const VERIFY_EMOJI_ID = "1516936626926784664";

export class VerifyServiceClass {
  private readonly emoji = VERIFY_EMOJI_ID;
  getConfiguredMessage = async (client: Client<true>): Promise<Message<true> | null> => {
    if (!env.DISCORD_VERIFY_MESSAGE_ID) return null;
    try {
      const channel = await client.channels.fetch(VERIFY_CHANNEL_ID);
      if (!(channel instanceof TextChannel)) throw new Error("verification channel is not a text channel");
      const message = await channel.messages.fetch(env.DISCORD_VERIFY_MESSAGE_ID);
      await message.react(this.emoji);
      return message;
    } catch (error) {
      console.error("Failed to prepare the verification message:", error);
      return null;
    }
  };

  isConfiguredMessage = (message: Message): boolean =>
    message.channelId === VERIFY_CHANNEL_ID &&
    message.id === env.DISCORD_VERIFY_MESSAGE_ID;

  syncMember = async (message: Message<boolean>, userId: string, verified: boolean): Promise<void> => {
    if (!env.DISCORD_MEMBER_ROLE_ID || userId === message.client.user.id) return;
    try {
      const guild = message.guild ?? (await message.client.guilds.fetch(env.DISCORD_GUILD_ID ?? ""));
      const member = await guild.members.fetch(userId);
      if (verified) await member.roles.add(env.DISCORD_MEMBER_ROLE_ID, "Verification reaction added");
      else await member.roles.remove(env.DISCORD_MEMBER_ROLE_ID, "Verification reaction removed");
    } catch (error) {
      console.error(`Failed to sync verification role for ${userId}:`, error);
    }
  };
}

export const VerifyService = new VerifyServiceClass();
