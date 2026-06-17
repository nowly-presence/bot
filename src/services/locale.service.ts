import { mkdir, readFile, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { ChatInputCommandInteraction, PermissionsBitField } from "discord.js";
import { Locale } from "#/types/locale";

type LocaleStore = {
  guilds: Record<string, Locale>;
  users: Record<string, Locale>;
};

class LocaleServiceClass {
  private readonly filePath = join(process.cwd(), ".data", "locales.json");
  private readonly store: LocaleStore = {
    guilds: {},
    users: {},
  };
  private loaded = false;

  load = async (): Promise<void> => {
    if (this.loaded) {
      return;
    }

    this.loaded = true;

    try {
      const raw = await readFile(this.filePath, "utf-8");
      const data = JSON.parse(raw) as Partial<LocaleStore>;

      this.store.guilds = this.cleanLocales(data.guilds ?? {});
      this.store.users = this.cleanLocales(data.users ?? {});
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  };

  getInteractionLocale = (interaction: ChatInputCommandInteraction): Locale => {
    const configuredLocale = interaction.guildId
      ? this.store.guilds[interaction.guildId]
      : undefined;

    if (configuredLocale) {
      return configuredLocale;
    }

    const userLocale = this.store.users[interaction.user.id];

    if (userLocale) {
      return userLocale;
    }

    return interaction.locale?.startsWith("fr") ? "fr" : "en";
  };

  canManageGuildLocale = (interaction: ChatInputCommandInteraction): boolean => {
    return !!interaction.memberPermissions?.has(PermissionsBitField.Flags.ManageGuild);
  };

  setUserLocale = async (userId: string, locale: Locale): Promise<void> => {
    this.store.users[userId] = locale;
    await this.save();
  };

  setGuildLocale = async (guildId: string, locale: Locale): Promise<void> => {
    this.store.guilds[guildId] = locale;
    await this.save();
  };

  private save = async (): Promise<void> => {
    await mkdir(dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(this.store, null, 2)}\n`);
  };

  private cleanLocales = (locales: Record<string, Locale>): Record<string, Locale> => {
    return Object.fromEntries(
      Object.entries(locales).filter(([, locale]) => locale === "en" || locale === "fr"),
    );
  };
}

export const LocaleService = new LocaleServiceClass();
