import { CommandExecute, AutocompleteExecute } from "@/utils/handler/command";
import { NowlyApiService, PresenceSummary } from "@/services/nowly-api.service";
import { LocaleService } from "@/services/locale.service";
import { createLinkButton, createLinkRow } from "@/utils/components";
import { createNowlyEmbed } from "@/utils/embed";
import { formatNumber, formatRating, normalizeSlug, truncate } from "@/utils/format";
import { t } from "@/utils/i18n";
import { env } from "@/config/env";
import { Locale } from "@/types/locale";

export const autocomplete: AutocompleteExecute = async (interaction) => {
  const focused = interaction.options.getFocused().toLowerCase();

  try {
    const presences = await NowlyApiService.listPresences();
    const choices = searchPresences(presences, focused).slice(0, 25).map((presence) => ({
      name: `${presence.name ?? presence.slug} (${presence.slug})`.slice(0, 100),
      value: presence.slug,
    }));

    await interaction.respond(choices);
  } catch (error) {
    console.error(error);
    await interaction.respond([]);
  }
};

export const execute: CommandExecute = async (command) => {
  await LocaleService.load();

  const locale = LocaleService.getInteractionLocale(command);
  const query = normalizeSlug(command.options.getString("query", true));
  const presences = await NowlyApiService.listPresences();
  const match = findPresence(presences, query);

  if (!match) {
    await command.reply({
      content: t(locale, "presenceNotFound", { query }),
      flags: ["Ephemeral"],
    });
    return;
  }

  const release = await NowlyApiService.getPresence(match.slug);
  const presence = release ?? match;
  const appUrl = `${env.NOWLY_APP_BASE_URL}/presences/${presence.slug}`;
  const description = getLocalizedDescription(presence.description, locale);
  const embed = createNowlyEmbed(
    presence.name ?? presence.slug,
    description ? truncate(description, 350) : t(locale, "presenceNoDescription"),
    appUrl,
  ).addFields(
    {
      name: t(locale, "presenceFields.slug"),
      value: presence.slug,
      inline: true,
    },
    {
      name: t(locale, "presenceFields.version"),
      value: presence.version || t(locale, "unknown"),
      inline: true,
    },
    {
      name: t(locale, "presenceFields.category"),
      value: presence.category || t(locale, "unknown"),
      inline: true,
    },
    {
      name: t(locale, "presenceFields.installs"),
      value: formatNumber(presence.totalInstalls),
      inline: true,
    },
    {
      name: t(locale, "presenceFields.activeUsers"),
      value: formatNumber(presence.activeUsers),
      inline: true,
    },
    {
      name: t(locale, "presenceFields.rating"),
      value: `${formatRating(presence.rating)} (${formatNumber(presence.ratingCount)})`,
      inline: true,
    },
  );

  if (presence.author) {
    embed.setFooter({ text: t(locale, "presenceFooter", { author: presence.author }) });
  }

  await command.reply({
    embeds: [embed],
    components: [
      createLinkRow(
        createLinkButton(t(locale, "openPresence"), appUrl),
        createLinkButton(t(locale, "openLibrary"), `${env.NOWLY_APP_BASE_URL}/presences`),
      ),
    ],
  });
};

const searchPresences = (presences: PresenceSummary[], query: string): PresenceSummary[] => {
  if (!query) {
    return presences;
  }

  return presences.filter((presence) => {
    const name = presence.name?.toLowerCase() ?? "";
    return presence.slug.includes(query) || name.includes(query);
  });
};

const findPresence = (presences: PresenceSummary[], query: string): PresenceSummary | undefined => {
  return presences.find((presence) => presence.slug === query)
    ?? presences.find((presence) => presence.name?.toLowerCase() === query)
    ?? searchPresences(presences, query)[0];
};

const getLocalizedDescription = (
  description: PresenceSummary["description"],
  locale: Locale,
): string | undefined => {
  if (!description) {
    return undefined;
  }

  if (typeof description === "string") {
    return description;
  }

  return description[locale]
    ?? description[locale === "fr" ? "fr-FR" : "en-US"]
    ?? description["en-US"]
    ?? description.en
    ?? Object.values(description)[0];
};
