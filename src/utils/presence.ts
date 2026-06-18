import { env } from "@/config/env";
import { PresenceMetadata, PresencePerson, PresenceSummary } from "@/services/nowly-api.service";

export const searchPresences = (presences: PresenceSummary[], query: string): PresenceSummary[] => {
  if (!query) return presences;

  return presences.filter((presence) => {
    const name = presence.name?.toLowerCase() ?? "";
    return presence.slug.includes(query) || name.includes(query);
  });
};

export const findPresence = (presences: PresenceSummary[], query: string): PresenceSummary | undefined => {
  return presences.find((presence) => presence.slug === query)
    ?? presences.find((presence) => presence.name?.toLowerCase() === query)
    ?? searchPresences(presences, query)[0];
};

export const getPresenceMetadata = (presence: PresenceSummary): PresenceMetadata => {
  return {
    ...presence,
    ...(presence.metadata ?? {}),
    slug: presence.slug,
    version: presence.version ?? presence.metadata?.version,
    totalInstalls: presence.totalInstalls,
    activeUsers: presence.activeUsers,
    rating: presence.rating,
    ratingCount: presence.ratingCount,
  };
};

export const getPresenceAssetUrl = (
  slug: string,
  type: "logo" | "thumbnail",
  asset?: string,
): string | undefined => {
  if (!asset) return undefined;

  return `${env.NOWLY_API_BASE_URL}/presences/${encodeURIComponent(slug)}/assets/${type}`;
};

export const getPresenceCredits = (presence: PresenceMetadata): string | undefined => {
  const author = getPersonName(presence.author);
  const contributors = (presence.contributors ?? [])
    .map(getPersonName)
    .filter((name): name is string => Boolean(name));

  if (!author && contributors.length === 0) return undefined;
  if (!author) return `With ${contributors.join(", ")}`;
  if (contributors.length === 0) return `By ${author}`;

  return `By ${author} with ${contributors.join(", ")}`;
};

export const getPresenceDescription = (
  description: PresenceSummary["description"],
): string | undefined => {
  if (!description) return undefined;
  if (typeof description === "string") return description;

  return description["en-US"] ?? description.en ?? Object.values(description)[0];
};

const getPersonName = (person: string | PresencePerson | undefined): string | undefined => {
  if (!person) return undefined;
  if (typeof person === "string") return person;

  return person.name;
};