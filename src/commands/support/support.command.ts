import { env } from "@/config/env";
import { LocaleService } from "@/services/locale.service";
import { createLinkButton, createLinkRow } from "@/utils/components";
import { createNowlyEmbed } from "@/utils/embed";
import { CommandExecute } from "@/utils/handler/command";
import { t } from "@/utils/i18n";

export const execute: CommandExecute = async (command) => {
  await LocaleService.load();

  const locale = LocaleService.getInteractionLocale(command);
  const supportUrl = `${env.NOWLY_APP_BASE_URL}/support`;
  const statusUrl = `${env.NOWLY_APP_BASE_URL}/status`;

  const embed = createNowlyEmbed(
    t(locale, "supportTitle"),
    t(locale, "supportDescription"),
    supportUrl,
  );

  await command.reply({
    embeds: [embed],
    components: [
      createLinkRow(
        createLinkButton(t(locale, "openSupport"), supportUrl),
        createLinkButton(t(locale, "openStatus"), statusUrl),
      ),
    ],
    flags: ["Ephemeral"],
  });
};