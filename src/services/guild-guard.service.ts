import { env } from "@/config/env";
import { Client, Guild } from "discord.js";

class GuildGuardServiceClass {
  leaveUnauthorizedGuilds = async (client: Client<true>): Promise<void> => {
    this.ensureAuthorizedGuildConfigured();

    await Promise.all(
      client.guilds.cache.map((guild) => this.leaveIfUnauthorized(guild)),
    );
  };

  leaveIfUnauthorized = async (guild: Guild): Promise<void> => {
    this.ensureAuthorizedGuildConfigured();

    if (guild.id === env.DISCORD_GUILD_ID) {
      return;
    }

    console.warn(`Leaving unauthorized guild ${guild.name} (${guild.id})`);
    await guild.leave();
  };

  private ensureAuthorizedGuildConfigured = (): void => {
    if (!env.DISCORD_GUILD_ID) {
      throw new Error("Missing environment variable: DISCORD_GUILD_ID");
    }
  };
}

export const GuildGuardService = new GuildGuardServiceClass();
