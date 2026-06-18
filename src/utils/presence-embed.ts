import { env } from "@/config/env";
import { PresenceMetadata } from "@/services/nowly-api.service";
import { createNowlyEmbed } from "@/utils/embed";
import { formatNumber, formatRating, truncate } from "@/utils/format";
import { getPresenceAssetUrl, getPresenceCredits, getPresenceDescription } from "@/utils/presence";
import { EmbedBuilder } from "discord.js";

export const createPresenceEmbed = (presence: PresenceMetadata): EmbedBuilder => {
  const appUrl = `${env.NOWLY_APP_BASE_URL}/presences/${presence.slug}`;
  const description = getPresenceDescription(presence.description);

  const embed = createNowlyEmbed(
    presence.name ?? presence.slug,
    description ? truncate(description, 350) : "No description available.",
    appUrl,
  ).addFields(
    { name: "Slug", value: presence.slug, inline: true },
    { name: "Version", value: presence.version || "Unknown", inline: true },
    { name: "Category", value: presence.category || "Unknown", inline: true },
    { name: "Installs", value: formatNumber(presence.totalInstalls), inline: true },
    { name: "Active users", value: formatNumber(presence.activeUsers), inline: true },
    { name: "Rating", value: `${formatRating(presence.rating)} (${formatNumber(presence.ratingCount)})`, inline: true },
  );

  const logoUrl = getPresenceAssetUrl(presence.slug, "logo", presence.assets?.logo);
  const bannerUrl = getPresenceAssetUrl(presence.slug, "thumbnail", presence.assets?.thumbnail);
  const credits = getPresenceCredits(presence);

  if (logoUrl) embed.setThumbnail(logoUrl);
  if (bannerUrl) embed.setImage(bannerUrl);
  if (credits) embed.setFooter({ text: credits });

  return embed;
};