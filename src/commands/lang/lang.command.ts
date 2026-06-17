import { CommandExecute } from "#/utils/handler/command";
import { LocaleService } from "#/services/locale.service";
import { Locale } from "#/types/locale";
import { t } from "#/utils/i18n";

export const execute: CommandExecute = async (command) => {
  await LocaleService.load();

  const currentLocale = LocaleService.getInteractionLocale(command);
  const locale = command.options.getString("language", true) as Locale;
  const scope = command.options.getString("scope") ?? "user";

  if (scope === "guild") {
    if (!command.guildId) {
      await command.reply({
        content: t(currentLocale, "langGuildOnly"),
        flags: ["Ephemeral"],
      });
      return;
    }

    if (!LocaleService.canManageGuildLocale(command)) {
      await command.reply({
        content: t(currentLocale, "langMissingPermission"),
        flags: ["Ephemeral"],
      });
      return;
    }

    await LocaleService.setGuildLocale(command.guildId, locale);
    await command.reply({
      content: t(locale, "langGuildUpdated"),
      flags: ["Ephemeral"],
    });
    return;
  }

  await LocaleService.setUserLocale(command.user.id, locale);
  await command.reply({
    content: t(locale, "langUserUpdated"),
    flags: ["Ephemeral"],
  });
};
