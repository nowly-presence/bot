import { CommandExecute } from "@/utils/handler/command";
import { LocaleService } from "@/services/locale.service";
import { createLinkButton, createLinkRow } from "@/utils/components";
import { createNowlyEmbed } from "@/utils/embed";
import { t } from "@/utils/i18n";
import { env } from "@/config/env";

export const execute: CommandExecute = async (command) => {
  await LocaleService.load();

  const locale = LocaleService.getInteractionLocale(command);
  const embed = createNowlyEmbed(
    t(locale, "linksTitle"),
    t(locale, "linksDescription"),
    env.NOWLY_APP_BASE_URL,
  );

  await command.reply({
    embeds: [embed],
    components: [
      createLinkRow(
        createLinkButton(t(locale, "website"), env.NOWLY_APP_BASE_URL),
        createLinkButton(t(locale, "openLibrary"), `${env.NOWLY_APP_BASE_URL}/presences`),
        createLinkButton(t(locale, "openStatus"), `${env.NOWLY_APP_BASE_URL}/status`),
      ),
    ],
  });
};
